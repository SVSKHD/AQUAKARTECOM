import priceUtils from "@/utils/priceUtils";
import { shortProductName } from "@/utils/invoice/recommendProducts";

/**
 * Questions a signed-in customer can ask the assistant about this exact bill.
 * The assistant does not see the page, so each question carries the facts it
 * needs (number, amounts, products). Each entry is { label, question, tone }:
 * `label` is the short chip text, `question` the full prompt it pre-fills.
 */
export const invoiceQuestions = (
  invoice = {},
  status = { key: "unpaid" },
  amounts = {},
) => {
  const ref = invoice.invoice_no || invoice.id || "this bill";
  const total = priceUtils.formatAmount(amounts.grandTotal || 0);
  const base = priceUtils.formatAmount(amounts.basePrice || 0);
  const gst = priceUtils.formatAmount(amounts.gstValue || 0);
  const names = (invoice.products || [])
    .map((product) => shortProductName(product.productName))
    .filter(Boolean);
  const first = names[0];
  const productList = names.slice(0, 3).join(", ") || "my products";

  const byStatus = {
    paid: [
      {
        label: "Claim warranty",
        question: `I paid receipt ${ref} for ${productList}. How do I claim warranty and what does it cover?`,
      },
      {
        label: "Book a service",
        question: `How do I book a service visit for ${first || "my purchase"} on receipt ${ref}?`,
      },
    ],
    unpaid: [
      {
        label: "How do I pay?",
        question: `Invoice ${ref} shows ${total} unpaid. What are the ways I can pay it?`,
      },
      {
        label: "Due date",
        question: `When is payment due for invoice ${ref} (${total}) and what happens if it is late?`,
      },
    ],
    partial: [
      {
        label: "Balance due",
        question: `Invoice ${ref} for ${total} is partially paid. How do I check and pay the remaining balance?`,
      },
    ],
    quotation: [
      {
        label: "Confirm this quote",
        question: `How do I accept quotation ${ref} for ${productList} (${total}) and place the order?`,
      },
      {
        label: "What's included?",
        question: `Does quotation ${ref} (${total}) include installation, delivery and warranty for ${productList}?`,
      },
    ],
    po: [
      {
        label: "Pay this PO",
        question: `How do I pay purchase order ${ref} for ${total} by bank transfer, and what reference should I use?`,
      },
      {
        label: "After payment",
        question: `After I pay purchase order ${ref}, how long until ${productList} is delivered and installed?`,
      },
    ],
    cancelled: [
      {
        label: "Why cancelled?",
        question: `Bill ${ref} shows as cancelled. What does that mean and what should I do next?`,
      },
    ],
  };

  const common = [
    {
      label: "Explain the GST",
      question: `Explain the tax on ${ref}: base price ${base} plus GST ${gst}${invoice.gst ? " (CGST 9% + SGST 9%)" : " (18% included)"} makes ${total}.`,
    },
    first
      ? {
          label: `Care for ${first}`,
          question: `How do I maintain my ${first} and how often should it be serviced?`,
        }
      : null,
    invoice.gst
      ? {
          label: "Claim GST input",
          question: `Can my business claim input tax credit on ${ref} (GSTIN ${invoice.gst_no || "on the bill"})? What do I need?`,
        }
      : null,
  ].filter(Boolean);

  return [...(byStatus[status.key] || byStatus.unpaid), ...common]
    .slice(0, 5)
    .map((entry) => ({ ...entry, tone: status.key }));
};

/** Wraps a free-text question with the bill it is about. */
export const invoiceFreeQuestion = (invoice = {}, text = "") => {
  const ref = invoice.invoice_no || invoice.id;
  const question = String(text).trim();
  if (!question) return "";
  return ref ? `About bill ${ref}: ${question}` : question;
};

export default invoiceQuestions;
