// AquaKart customer support (same number as the contact page and invoices).
export const SUPPORT_PHONE_DISPLAY = "+91 90147 74667";
export const SUPPORT_TEL = "tel:+919014774667";
const SUPPORT_WHATSAPP = "919014774667";

// Shown with AI answers: the assistant shortlists, support confirms.
export const AI_SUPPORT_NOTE =
  "AI suggestions help you shortlist models. For accurate prices, stock, sizing and installation, please confirm with AquaKart support.";

// WhatsApp chat with the customer's question pre-filled, so support has the context.
export const supportWhatsAppUrl = (question?: string) => {
  const q = (question || "").trim().slice(0, 300);
  const text = q
    ? `Hi AquaKart, I was asking your assistant: "${q}". Can you help me confirm the right product?`
    : "Hi AquaKart, I'd like help choosing the right water purifier or softener.";
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
};
