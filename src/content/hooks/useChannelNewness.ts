import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "../../shared/services/notifications";
import { t } from "../i18n";
import { markChannelSeen, requestChannelNewness } from "../services/newness";
import type { ChannelId, ISubscription } from "../../shared/types";

type UseChannelNewnessResult = {
  newnessMap: Map<ChannelId, boolean>;
  markSeen: (channelId: ChannelId) => void;
};

export function useChannelNewness(subscriptions: ISubscription[]): UseChannelNewnessResult {
  const [newnessMap, setNewnessMap] = useState<Map<ChannelId, boolean>>(() => new Map());
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (subscriptions.length === 0) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let isCancelled = false;
    const channelIds = subscriptions.map((sub) => sub.channelId);

    requestChannelNewness(channelIds)
      .then((nextMap) => {
        if (!isCancelled) {
          setNewnessMap(nextMap);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load channel newness", error);
        notify.error(t("genericError"));
      });

    return () => {
      isCancelled = true;
    };
  }, [subscriptions]);

  const markSeen = useCallback((channelId: ChannelId) => {
    setNewnessMap((prev) => {
      if (!prev.get(channelId)) return prev;
      const next = new Map(prev);
      next.set(channelId, false);
      return next;
    });

    void markChannelSeen(channelId).catch((error: unknown) => {
      console.error("Failed to mark channel seen", error);
      notify.error(t("genericError"));
    });
  }, []);

  return { newnessMap, markSeen };
}
