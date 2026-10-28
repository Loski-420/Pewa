import { Order, StoreSettings } from '../types';

export function formatWhatsAppOrderMessage(order: Order, settings: StoreSettings): string {
  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.product.name} (${item.product.volume || 'Standard'}) [${item.product.category}] - KES ${(
          item.product.price * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const mapsLink = `https://maps.google.com/?q=${order.location.lat},${order.location.lng}`;

  const discountLine =
    order.pointsRedeemed && order.pointsRedeemed > 0
      ? `• Points Redeemed Discount: -KES ${order.discountAmount} (${order.pointsRedeemed} pts)\n`
      : '';

  const message = `🚨 *NEW PEWA DRINKS & MUNCHIES ORDER DISPATCH*
To: *0712610337*

📦 *Order #:* ${order.orderNumber}
🕒 *Placed At:* ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
⏳ *Delivery Slot:* ${order.deliverySchedule}

━━━━━━━━━━━━━━━━━━━━
📱 *CUSTOMER WHATSAPP NUMBER:*
• WhatsApp Number: *${order.safaricomPhone}*
• Customer Name: ${order.customerName}

📍 *DELIVERY LOCATION:*
• Estate / Area: *${order.location.estate}*
• Street / Landmark: *${order.location.address}*
• Building / Apt / House No: ${order.location.buildingOrHouse || 'Not specified'}
• 🗺️ GPS Google Maps Pin: ${mapsLink}
${order.location.notes ? `• Gate / Delivery Notes: ${order.location.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
🛒 *ORDER ITEMS:*
${itemsText}

💰 *TOTAL CASH TO COLLECT:*
• Items Subtotal: KES ${order.subtotal.toLocaleString()}
${discountLine}• Delivery Fee: KES ${order.deliveryFee.toLocaleString()}
👉 *TOTAL CASH: KES ${order.total.toLocaleString()}*

💳 *PAYMENT METHOD:*
• Pay on Delivery via Kopo Kopo / Lipa na M-PESA
• Buy Goods Till: *${settings.kopoKopoTillNumber || '349797'}*

━━━━━━━━━━━━━━━━━━━━
🛵 *ACTION FOR 0712610337:*
Please dispatch a rider to *${order.customerName}* at *${order.location.estate}* immediately! Call or WhatsApp customer at *${order.safaricomPhone}*.`;

  return message;
}

/**
 * Cleans and converts Kenyan phone numbers (e.g. 0712610337, +254712610337, 712610337)
 * into the international WhatsApp standard (e.g. 254712610337).
 */
export function formatKenyanPhoneForWhatsApp(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

/**
 * Returns a direct WhatsApp chat link to the store (defaults to 0712610337 -> 254712610337)
 */
export function getDirectWhatsAppUrl(
  phone: string = '254712610337',
  customText?: string
): string {
  const normalizedPhone = formatKenyanPhoneForWhatsApp(phone);
  const text =
    customText ||
    'Hello Pewa! I would like to place an order for drinks & munchies for same-day delivery.';
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppLink(order: Order, settings: StoreSettings): string {
  const message = formatWhatsAppOrderMessage(order, settings);
  const targetPhone = '254712610337'; // Direct dispatch to 0712610337
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

export function triggerWhatsAppNotification(order: Order, settings: StoreSettings): boolean {
  try {
    const url = generateWhatsAppLink(order, settings);
    // On mobile devices, window.open often gets blocked by popup blockers.
    // Try window.open, and if not allowed, fallback to direct location
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
    return true;
  } catch (err) {
    console.error('Failed to trigger WhatsApp notification:', err);
    try {
      window.location.href = generateWhatsAppLink(order, settings);
    } catch (_) {}
    return false;
  }
}
