import { useSyncExternalStore } from "react";

// Subscribe to the browser's online/offline events.
const subscribe = (onChange) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getSnapshot = () => navigator.onLine;
// The server (and the hydration render) assumes online.
const getServerSnapshot = () => true;

const useNetworkStatus = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export default useNetworkStatus;
