"use client";

import dynamic from "next/dynamic";
import AquaProviders from "./AquaProviders";

// The workspace reads localStorage (theme, split) and window size on first render,
// so it is rendered on the client only. This is the single mounted page of the flow.
const AquaWorkspace = dynamic(() => import("./AquaWorkspace"), {
  ssr: false,
  loading: () => <div className="aq-root" aria-busy="true" />,
});

export default function AquaApp() {
  return (
    <AquaProviders>
      <AquaWorkspace />
    </AquaProviders>
  );
}
