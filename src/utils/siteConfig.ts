export const SITE_CONFIG = {
  storeName: import.meta.env.VITE_STORE_NAME || "Noor Store",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || "218910000000",
  phoneNumber: import.meta.env.VITE_PHONE_NUMBER || "+218 91 000 0000",
  email: import.meta.env.VITE_EMAIL || "hello@noorstore.com",
  city: import.meta.env.VITE_CITY || "Tripoli, Libya",
  responseTime:
    import.meta.env.VITE_RESPONSE_TIME ||
    "We usually reply within the same day on WhatsApp.",
  checkoutMessage:
    import.meta.env.VITE_CHECKOUT_MESSAGE ||
    "After you place the request, we will contact you on WhatsApp or phone to confirm the final details, delivery, and price.",
};

export function createWhatsAppLink(message: string) {
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
