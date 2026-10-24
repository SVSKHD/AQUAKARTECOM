// TODO(backend): replace with the PIN serviceability endpoint once it exists.
// This stub only validates the format and returns a rough estimate so the
// product panel can be built against the final { ok, eta } shape.

export type DeliveryCheck = { ok: boolean; eta: string; demo: true };

export async function checkDelivery(pin: string): Promise<DeliveryCheck> {
  await new Promise((r) => setTimeout(r, 350));
  if (!/^\d{6}$/.test(pin))
    return { ok: false, eta: "Enter a valid 6-digit PIN code.", demo: true };
  return /^5/.test(pin)
    ? {
        ok: true,
        eta: "Delivers in 2–4 days · installation available",
        demo: true,
      }
    : {
        ok: true,
        eta: "Delivers in 5–8 days · installation by partner network",
        demo: true,
      };
}
