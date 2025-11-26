SA POS MVP - South African Point of Sale System
Version: 1.0.0
Platform: Android & iOS (React Native)
Status: Production-Ready MVP

🎯 What Is This?
SA POS is a mobile point-of-sale system designed specifically for South African small businesses:

🍔 Fast-food stands (kota stands, bunny chow vendors)
🛒 Spaza shops (neighborhood grocery stores)

The app works 100% offline and syncs automatically when internet is available.

✨ Key Features
📱 Dual Business Modes

Fast-food Mode: Quick sales, menu items, no stock tracking
Spaza Mode: Full inventory management with barcode scanning

🔌 Offline-First Design

Works completely without internet
All sales and data saved locally
Auto-syncs when connection returns
Never lose a sale due to network issues

💰 Core Capabilities

✅ Add and manage items/products
✅ Quick sale processing (1-2 taps)
✅ Daily sales totals and analytics
✅ Sales history with receipts
✅ Stock management (Spaza mode)
✅ Barcode scanning (Spaza mode)
✅ Low-stock alerts
✅ CSV export for accounting
✅ Multi-device sync


🏗️ Technical Architecture
Tech Stack
Frontend:  React Native (Expo)
Local DB:  SQLite (offline storage)
Cloud:     Supabase (PostgreSQL)
Sync:      Custom operation-log protocol
How It Works

Everything happens locally first → Saved to SQLite instantly
Operations are logged → Every change tracked in sync queue
Auto-sync when online → Uploads changes to cloud
Conflict-free → Append-only design prevents data conflicts
Multi-device ready → Changes sync across all devices


📊 System Overview
Data Flow
User Action
    ↓
Local SQLite DB (instant save)
    ↓
Sync Queue (operation log)
    ↓
[When Online]
    ↓
Supabase Cloud (PostgreSQL)
    ↓
Other Devices (pull updates)
Database Schema
Local (SQLite):

items - Products/menu items
sales - Transaction records
stock_movements - Inventory adjustments
sync_queue - Operations waiting to sync
meta - Device settings and sync state

Cloud (Supabase):

Same tables as local + sync_ops for operation log
