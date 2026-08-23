import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getSubscriptionsSnapshot,
  requestSubscriptions,
  subscribeToSubscriptions,
} from "../../shared/services/stores/subscriptions-store";

export function useSubscriptions() {
  const { subscriptions, status } = useSyncExternalStore(
    subscribeToSubscriptions,
    getSubscriptionsSnapshot,
    getSubscriptionsSnapshot
  );

  useEffect(() => {
    requestSubscriptions();
  }, []);

  const refresh = useCallback(() => {
    requestSubscriptions();
  }, []);

  return {
    subscriptions,
    isLoading: status === "loading" && subscriptions.length === 0,
    hasError: status === "error",
    refresh,
  };
}
