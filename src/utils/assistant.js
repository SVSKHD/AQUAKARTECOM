import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

const useAssistant = () => {
  const dispatch = useDispatch();
  const available = useSelector((state) => state.assistant?.available);

  // `prefill` goes into the composer; it is not sent until the customer presses send.
  const openAssistant = useCallback(
    (prefill = "") => {
      dispatch({ type: "OPEN_ASSISTANT", payload: { prefill } });
    },
    [dispatch],
  );

  const closeAssistant = useCallback(() => {
    dispatch({ type: "CLOSE_ASSISTANT" });
  }, [dispatch]);

  return { available: Boolean(available), openAssistant, closeAssistant };
};

// "Tell me about <product>. Is it right for <use case>?"
export const productAssistantPrompt = (product) => {
  // Catalogue titles often carry an SEO suffix ("Kent Softener 5.5L | Aquakart").
  const title =
    String(product?.title || "")
      .replace(/\s*[|–-]\s*aquakart\s*$/i, "")
      .trim() || "this product";
  const category =
    typeof product?.category === "string"
      ? product.category
      : product?.category?.title || "";
  const text = `${category} ${product?.title || ""}`;
  const useCase = /soft/i.test(text)
    ? "hard water in my home"
    : /\bro\b|purif|\buv\b/i.test(text)
      ? "safe drinking water at home"
      : /filter/i.test(text)
        ? "whole-home water filtration"
        : "my home";
  return `Tell me about ${title}. Is it right for ${useCase}?`;
};

export default useAssistant;
