const isIosBrowser = () => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const normalizePdfFileName = (fileName) => {
  const safeName = String(fileName || "Aquakart-Invoice.pdf")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  return safeName.toLowerCase().endsWith(".pdf")
    ? safeName
    : `${safeName}.pdf`;
};

/**
 * iOS Safari can drop a download that starts after asynchronous PDF generation.
 * Opening a blank tab during the original user gesture preserves a navigation
 * target that can receive the generated PDF once it is ready.
 */
export const preparePdfDownloadTarget = () => {
  if (typeof window === "undefined" || !isIosBrowser()) return null;

  try {
    const target = window.open("", "_blank");
    if (!target) return null;

    target.document.title = "Preparing Aquakart invoice";
    target.document.body.innerHTML =
      '<p style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;color:#0f172a">Preparing your Aquakart invoice...</p>';

    return target;
  } catch {
    return null;
  }
};

export const closePdfDownloadTarget = (target) => {
  if (!target || target.closed) return;

  try {
    target.close();
  } catch {
    // Ignore browser restrictions while cleaning up a failed download target.
  }
};

/**
 * Save a jsPDF document without relying on jsPDF/FileSaver's browser-specific
 * save implementation. Desktop/Android get a normal download. iOS Safari gets
 * the PDF in the tab opened by preparePdfDownloadTarget so it can be saved or
 * shared using the native PDF viewer.
 */
export const savePdfDocument = (doc, fileName, preparedTarget = null) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF downloads are only available in the browser");
  }

  if (!doc?.output) {
    throw new Error("Invalid PDF document");
  }

  const normalizedFileName = normalizePdfFileName(fileName);
  const blob = doc.output("blob");
  const objectUrl = URL.createObjectURL(blob);

  const revokeObjectUrl = () => {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Revocation is best-effort only.
    }
  };

  if (preparedTarget && !preparedTarget.closed) {
    try {
      preparedTarget.location.replace(objectUrl);
      window.setTimeout(revokeObjectUrl, 60_000);
      return { mode: "viewer", fileName: normalizedFileName };
    } catch {
      closePdfDownloadTarget(preparedTarget);
    }
  }

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = normalizedFileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  // On iOS, opening the Blob URL in a new tab is the most reliable fallback
  // when the download attribute is ignored by WebKit.
  if (isIosBrowser()) {
    anchor.target = "_blank";
  }

  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Safari may still be reading the Blob after click(), so do not revoke it
    // immediately. A delayed cleanup avoids intermittent zero-byte/failed PDFs.
    window.setTimeout(revokeObjectUrl, 60_000);
  }

  return {
    mode: isIosBrowser() ? "viewer" : "download",
    fileName: normalizedFileName,
  };
};
