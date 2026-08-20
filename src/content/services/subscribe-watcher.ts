import type { ChannelId } from "../../shared/types";
import { logger } from "../../shared/logger";
import { PAGE_BRIDGE_EVENTS } from "./page-bridge";

export type SubscribeWatcherCallback = (channelId: ChannelId) => void;
export type UnsubscribeWatcherCallback = (channelIds: ChannelId[]) => void;

const DEBUG_PREFIX = "[YouBunch/subscribe-watcher]";

function readChannelIds(detail: unknown): ChannelId[] {
  const ids = (detail as { channelIds?: unknown } | undefined)?.channelIds;
  if (!Array.isArray(ids)) return [];
  return ids.filter((value): value is string => typeof value === "string" && value.length > 0);
}

export function initSubscribeWatcher(onSubscribed: SubscribeWatcherCallback): () => void {
  logger.debug(`${DEBUG_PREFIX} init; listening event`, PAGE_BRIDGE_EVENTS.subscriptionSubscribe);

  const handleSubscribeEvent = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;

    const channelIds = readChannelIds(event.detail);
    logger.debug(`${DEBUG_PREFIX} subscribe event received`, { channelIds });

    const channelId = channelIds[0];
    if (!channelId) {
      logger.debug(`${DEBUG_PREFIX} skip: no channelId in payload`);
      return;
    }

    onSubscribed(channelId);
  };

  window.addEventListener(PAGE_BRIDGE_EVENTS.subscriptionSubscribe, handleSubscribeEvent as EventListener);

  return () => {
    window.removeEventListener(PAGE_BRIDGE_EVENTS.subscriptionSubscribe, handleSubscribeEvent as EventListener);
  };
}

export function initUnsubscribeWatcher(onUnsubscribed: UnsubscribeWatcherCallback): () => void {
  logger.debug(`${DEBUG_PREFIX} init; listening event`, PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe);

  const handleUnsubscribeEvent = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;

    const channelIds = readChannelIds(event.detail);
    if (channelIds.length === 0) {
      logger.debug(`${DEBUG_PREFIX} skip: no channelIds in payload`);
      return;
    }

    onUnsubscribed(channelIds);
  };

  window.addEventListener(PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe, handleUnsubscribeEvent as EventListener);

  return () => {
    window.removeEventListener(PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe, handleUnsubscribeEvent as EventListener);
  };
}
