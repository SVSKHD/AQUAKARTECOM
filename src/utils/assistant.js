import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

const useAssistant = () => {
  const dispatch = useDispatch();
  const available = useSelector((state) => state.assistant?.available);

  // `prefill` goes into the composer; it is not sent until the customer presses send.
  // `tab` ("chat" | "products") picks the drawer tab when a page set a context.
  const openAssistant = useCallback(
    (prefill = "", { tab } = {}) => {
      dispatch({ type: "OPEN_ASSISTANT", payload: { prefill, tab } });
    },
    [dispatch],
  );

  const closeAssistant = useCallback(() => {
    dispatch({ type: "CLOSE_ASSISTANT" });
  }, [dispatch]);

  // A page's own assistant setup; pass null to clear it when the page leaves.
  const setAssistantContext = useCallback(
    (context) => {
      dispatch({ type: "SET_ASSISTANT_CONTEXT", payload: context });
    },
    [dispatch],
  );

  return {
    available: Boolean(available),
    openAssistant,
    closeAssistant,
    setAssistantContext,
  };
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
