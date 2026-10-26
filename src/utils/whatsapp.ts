import { Order, StoreSettings } from '../types';

export function formatWhatsAppOrderMessage(order: Order, settings: StoreSettings): string {
  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.product.name} (${item.product.volume}) [${item.product.category}] @ KES ${(
          item.product.price * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const mapsLink = `https://maps.google.com/?q=${order.location.lat},${order.location.lng}`;

  const discountLine =
    order.pointsRedeemed && order.pointsRedeemed > 0
      ? `• Points Redeemed Discount: -KES ${order.discountAmount} (${order.pointsRedeemed} pts)\n`
      : '';

  const message = `🔔 *DISPATCH ACTION: NEW CONFIRMED ORDER (Send to 0712610337)*

📦 *Order Number:* ${order.orderNumber}
🕒 *Time:* ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

👤 *CUSTOMER CONTACT (WHATSAPP / M-PESA):*
• Customer Name: ${order.customerName}
• WhatsApp / M-Pesa Number: ${order.safaricomPhone}

📍 *DELIVERY LOCATION:*
• Estate / Area: ${order.location.estate}
• Exact Address: ${order.location.address}
• Landmark / Apt / Building: ${order.location.buildingOrHouse || 'None provided'}
• Google Maps Location: ${mapsLink}
• Delivery Window: ${order.deliverySchedule}

🛒 *ORDERED ITEMS:*
${itemsText}

💰 *TOTAL PRICE:*
• Items Subtotal: KES ${order.subtotal.toLocaleString()}
${discountLine}• Delivery Fee: KES ${order.deliveryFee.toLocaleString()}
• *TOTAL AMOUNT TO COLLECT: KES ${order.total.toLocaleString()}*

💳 *PAYMENT METHOD:*
• Pay Upon Delivery via Kopo Kopo / M-PESA
• Till Number: ${settings.kopoKopoTillNumber || '349797'}
• Status: ${order.paymentStatus === 'paid_via_kopokopo' ? '✅ Paid' : '⏳ Pending Payment on Delivery'}

🛵 *DISPATCH ACTION REQUIRED:*
Please arrange rider dispatch immediately to ${order.customerName} at ${order.location.estate} (Contact: ${order.safaricomPhone})!`;

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
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    return !!newWindow;
  } catch (err) {
    console.error('Failed to trigger WhatsApp notification:', err);
    return false;
  }
}
