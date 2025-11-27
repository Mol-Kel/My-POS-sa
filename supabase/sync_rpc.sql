-- RPC function to apply sync operations idempotently
CREATE OR REPLACE FUNCTION apply_sync_ops(ops JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  op JSONB;
  op_id TEXT;
  op_type TEXT;
  table_name TEXT;
  record_id TEXT;
  payload JSONB;
  device_id TEXT;
  device_seq INTEGER;
  result JSONB := '{"success": true, "applied": 0}'::JSONB;
  applied_count INTEGER := 0;
BEGIN
  -- Loop through each operation
  FOR op IN SELECT * FROM jsonb_array_elements(ops)
  LOOP
    op_id := op->>'id';
    op_type := op->>'op_type';
    table_name := op->>'table_name';
    record_id := op->>'record_id';
    payload := op->'payload';
    device_id := op->>'device_id';
    device_seq := (op->>'device_seq')::INTEGER;
    
    -- Check if this op was already applied (idempotency)
    IF EXISTS (SELECT 1 FROM sync_ops WHERE id = op_id) THEN
      CONTINUE;
    END IF;
    
    -- Log the operation
    INSERT INTO sync_ops (id, op_type, table_name, record_id, payload, device_id, device_seq, applied, applied_at)
    VALUES (op_id, op_type, table_name, record_id, payload, device_id, device_seq, TRUE, NOW());
    
    -- Apply the operation based on type
    CASE op_type
      WHEN 'item_insert' THEN
        INSERT INTO items (id, name, price, sku, barcode, initial_stock, category, mode, device_id, created_at, updated_at)
        VALUES (
          record_id,
          payload->>'name',
          (payload->>'price')::NUMERIC,
          payload->>'sku',
          payload->>'barcode',
          COALESCE((payload->>'initial_stock')::INTEGER, 0),
          payload->>'category',
          payload->>'mode',
          device_id,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
      WHEN 'item_update' THEN
        UPDATE items
        SET 
          name = payload->>'name',
          price = (payload->>'price')::NUMERIC,
          sku = payload->>'sku',
          barcode = payload->>'barcode',
          category = payload->>'category',
          mode = payload->>'mode',
          updated_at = NOW()
        WHERE id = record_id;
        
      WHEN 'item_delete' THEN
        UPDATE items SET deleted = TRUE, updated_at = NOW()
        WHERE id = record_id;
        
      WHEN 'sale_insert' THEN
        INSERT INTO sales (id, items_json, total, date, device_id, created_at)
        VALUES (
          record_id,
          payload->'items_json',
          (payload->>'total')::NUMERIC,
          (payload->>'date')::DATE,
          device_id,
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
      WHEN 'stock_movement_insert' THEN
        INSERT INTO stock_movements (id, item_id, quantity, type, notes, device_id, created_at)
        VALUES (
          record_id,
          payload->>'item_id',
          (payload->>'quantity')::INTEGER,
          payload->>'type',
          payload->>'notes',
          device_id,
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
      ELSE
        -- Unknown operation type, skip
        CONTINUE;
    END CASE;
    
    applied_count := applied_count + 1;
  END LOOP;
  
  result := jsonb_set(result, '{applied}', to_jsonb(applied_count));
  RETURN result;
END;
$$;
