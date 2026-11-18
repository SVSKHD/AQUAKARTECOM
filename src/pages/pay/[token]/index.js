import OfflinePayPage from "@/pageComponents/pay/OfflinePayPage";

// Payment link for an order agreed with the Aquakart team (sent on WhatsApp).
// The token stays in the URL so a Google redirect sign-in and a PhonePe
// same-tab return both come back here.
export default function PayLinkPage() {
  return <OfflinePayPage />;
}
