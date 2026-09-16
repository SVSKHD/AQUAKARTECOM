import { createContext, useContext } from "react";

const ManagedSeoContext = createContext(null);

export const ManagedSeoProvider = ManagedSeoContext.Provider;
export const useManagedSeoContext = () => useContext(ManagedSeoContext);
