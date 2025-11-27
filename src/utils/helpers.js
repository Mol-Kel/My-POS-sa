export function generateReceiptText(sale) {
  const items = JSON.parse(sale.items_json);
  let receipt = 'SA POS\n';
  receipt += '================================\n';
  receipt += `Date: ${new Date(sale.created_at).toLocaleString()}\n`;
  receipt += `Receipt: ${sale.id.substring(0, 8)}\n`;
  receipt += '================================\n\n';
  
  items.forEach(item => {
    receipt += `${item.name}\n`;
    receipt += `  R${item.price.toFixed(2)} x ${item.quantity} = R${(item.price * item.quantity).toFixed(2)}\n\n`;
  });
  
  receipt += '================================\n';
  receipt += `TOTAL: R${sale.total.toFixed(2)}\n`;
  receipt += '================================\n';
  receipt += 'Thank you!\n';
  
  return receipt;
}

export function formatCurrency(amount) {
  return `R${amount.toFixed(2)}`;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-ZA');
}
