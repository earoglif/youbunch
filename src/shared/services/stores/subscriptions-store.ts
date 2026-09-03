import { sendMessage } from "../../messaging/client";
import type { ISubscription } from "../../types";

export type SubscriptionsStatus = "loading" | "ready" | "error";

export type SubscriptionsSnapshot = {
  subscriptions: ISubscription[];
  status: SubscriptionsStatus;
};

type SubscriptionsListener = () => void;

let snapshot: SubscriptionsSnapshot = {
  subscriptions: [],
  status: "loading",
};

let latestLoadId = 0;
const listeners = new Set<SubscriptionsListener>();

function setSnapshot(patch: Partial<SubscriptionsSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

function normalizeSubscriptions(value: unknown): ISubscription[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ISubscription[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const channelId = (item as { channelId?: unknown }).channelId;
    const name = (item as { name?: unknown }).name;
    const thumbnailUrl = (item as { thumbnailUrl?: unknown }).thumbnailUrl;
    const description = (item as { description?: unknown }).description;

    if (typeof channelId !== "string" || channelId.length === 0) {
      continue;
    }
    if (typeof name !== "string" || name.length === 0) {
      continue;
    }

    normalized.push({
      channelId,
      name,
      thumbnailUrl: typeof thumbnailUrl === "string" && thumbnailUrl.length > 0 ? thumbnailUrl : undefined,
      description: typeof description === "string" && description.length > 0 ? description : undefined,
    });
  }

  return normalized;
}

async function loadSubscriptions(): Promise<void> {
  const loadId = ++latestLoadId;
  setSnapshot({ status: "loading" });

  try {
    const subscriptions = await sendMessage("get-subscriptions", {});
    if (loadId !== latestLoadId) return;

    const remote = normalizeSubscriptions(subscriptions);
    const remoteIds = new Set(remote.map((item) => item.channelId));
    const pendingLocal = snapshot.subscriptions.filter((item) => !remoteIds.has(item.channelId));
    setSnapshot({
      subscriptions: pendingLocal.length > 0 ? [...pendingLocal, ...remote] : remote,
      status: "ready",
    });
  } catch (error: unknown) {
    if (loadId !== latestLoadId) return;
    console.error("Failed to request subscriptions", error);
    setSnapshot({ status: "error" });
  }
}

export function subscribeToSubscriptions(listener: SubscriptionsListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function requestSubscriptions(): void {
  void loadSubscriptions();
}

export function getSubscriptionsSnapshot(): SubscriptionsSnapshot {
  return snapshot;
}

export function upsertSubscription(subscription: ISubscription): void {
  const channelId = typeof subscription.channelId === "string" ? subscription.channelId.trim() : "";
  if (!channelId) return;

  const name = typeof subscription.name === "string" ? subscription.name.trim() : "";
  if (!name) return;

  const nextItem: ISubscription = {
    channelId,
    name,
    thumbnailUrl:
      typeof subscription.thumbnailUrl === "string" && subscription.thumbnailUrl.length > 0
        ? subscription.thumbnailUrl
        : undefined,
    description:
      typeof subscription.description === "string" && subscription.description.length > 0
        ? subscription.description
        : undefined,
  };

  const existingIndex = snapshot.subscriptions.findIndex((item) => item.channelId === channelId);
  if (existingIndex < 0) {
    setSnapshot({ subscriptions: [nextItem, ...snapshot.subscriptions] });
    return;
  }

  const existing = snapshot.subscriptions[existingIndex];
  const merged: ISubscription = {
    ...existing,
    ...nextItem,
    name: nextItem.name || existing.name,
    thumbnailUrl: nextItem.thumbnailUrl ?? existing.thumbnailUrl,
    description: nextItem.description ?? existing.description,
  };

  const nextList = [...snapshot.subscriptions];
  nextList[existingIndex] = merged;
  setSnapshot({ subscriptions: nextList });
}

export function removeSubscriptions(channelIds: string[]): void {
  const ids = Array.isArray(channelIds)
    ? channelIds
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    : [];
  if (ids.length === 0) return;

  const idSet = new Set(ids);
  const nextList = snapshot.subscriptions.filter((item) => !idSet.has(item.channelId));
  if (nextList.length === snapshot.subscriptions.length) return;
  setSnapshot({ subscriptions: nextList });
}

export async function requestChannelDetails(channelId: string): Promise<ISubscription | null> {
  const normalizedChannelId = typeof channelId === "string" ? channelId.trim() : "";
  if (!normalizedChannelId) return null;

  const subscription = await sendMessage("get-channel-details", {
    channelId: normalizedChannelId,
  });
  return subscription ?? null;
}
