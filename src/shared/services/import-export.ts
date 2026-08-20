import { storage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../constants";
import { createGroupId } from "../ids";
import { sendMessage } from "../messaging/client";
import { getGroupNameKey, normalizeGroups, sanitizeText } from "../groups";
import { loadGroups, saveGroups } from "../storage/groups";
import type { GroupId, IGroup, ISubscription } from "../types";

type ParsedImportPayload = {
  groups: IGroup[];
  skippedInvalidCount: number;
};

export type ImportGroupsResult = {
  importedCount: number;
  skippedCount: number;
  filteredChannelsCount: number;
};

export type ExportGroupsResult = {
  exportedCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toValidUserId(value: unknown): string | null {
  const userId = sanitizeText(value);
  return userId.length > 0 ? userId : null;
}

async function getStoredUserId(): Promise<string | null> {
  const data = await storage.local.get(STORAGE_KEYS.userId);
  return toValidUserId(data[STORAGE_KEYS.userId]);
}

async function resolveUserId(userId?: string | null): Promise<string | null> {
  if (userId !== undefined) {
    return toValidUserId(userId);
  }

  return getStoredUserId();
}

function getFileNameDatePart(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadJsonFile(payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `YouBunch-backup-${getFileNameDatePart()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseImportPayload(content: string): ParsedImportPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid backup JSON");
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.groups)) {
    throw new Error("Invalid backup structure");
  }

  const groups = normalizeGroups(parsed.groups);

  return {
    groups,
    skippedInvalidCount: parsed.groups.length - groups.length,
  };
}

function normalizeSubscriptions(value: unknown): ISubscription[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const subscriptions: ISubscription[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const channelId = sanitizeText((item as { channelId?: unknown }).channelId);
    const name = sanitizeText((item as { name?: unknown }).name);
    const thumbnailUrl = sanitizeText((item as { thumbnailUrl?: unknown }).thumbnailUrl);
    const description = sanitizeText((item as { description?: unknown }).description);

    if (!channelId || !name) {
      continue;
    }

    subscriptions.push({
      channelId,
      name,
      thumbnailUrl: thumbnailUrl.length > 0 ? thumbnailUrl : undefined,
      description: description.length > 0 ? description : undefined,
    });
  }

  return subscriptions;
}

async function fetchCurrentSubscriptions(): Promise<ISubscription[]> {
  const subscriptions = await sendMessage("get-subscriptions", {});
  return normalizeSubscriptions(subscriptions);
}

function createUniqueGroupId(existingIds: Set<GroupId>): GroupId {
  let nextId: GroupId;

  do {
    nextId = createGroupId();
  } while (existingIds.has(nextId));

  existingIds.add(nextId);
  return nextId;
}

export async function exportGroups(userId?: string | null): Promise<ExportGroupsResult> {
  const resolvedUserId = await resolveUserId(userId);
  const groups = await loadGroups(resolvedUserId);

  if (groups.length === 0) {
    return { exportedCount: 0 };
  }

  downloadJsonFile({ groups });

  return {
    exportedCount: groups.length,
  };
}

export async function importGroups(
  file: File,
  userId?: string | null
): Promise<ImportGroupsResult> {
  const resolvedUserId = await resolveUserId(userId);
  const [existingGroups, currentSubscriptions, fileContent] = await Promise.all([
    loadGroups(resolvedUserId),
    fetchCurrentSubscriptions(),
    file.text(),
  ]);

  const importedPayload = parseImportPayload(fileContent);
  const currentChannelIds = new Set(currentSubscriptions.map((sub) => sub.channelId));
  const groupNameKeys = new Set(existingGroups.map((group) => getGroupNameKey(group.name)));
  const usedGroupIds = new Set(existingGroups.map((group) => group.id));

  let skippedCount = importedPayload.skippedInvalidCount;
  let filteredChannelsCount = 0;

  const groupsToImport: IGroup[] = [];
  for (const group of importedPayload.groups) {
    const groupNameKey = getGroupNameKey(group.name);
    if (!groupNameKey || groupNameKeys.has(groupNameKey)) {
      skippedCount += 1;
      continue;
    }

    groupNameKeys.add(groupNameKey);

    const filteredChannelIds = group.channelIds.filter((channelId) => currentChannelIds.has(channelId));
    filteredChannelsCount += group.channelIds.length - filteredChannelIds.length;

    let nextGroupId = group.id;
    if (usedGroupIds.has(nextGroupId)) {
      nextGroupId = createUniqueGroupId(usedGroupIds);
    } else {
      usedGroupIds.add(nextGroupId);
    }

    groupsToImport.push({
      ...group,
      id: nextGroupId,
      channelIds: filteredChannelIds,
    });
  }

  if (groupsToImport.length > 0) {
    await saveGroups(resolvedUserId, [...existingGroups, ...groupsToImport]);
  }

  return {
    importedCount: groupsToImport.length,
    skippedCount,
    filteredChannelsCount,
  };
}
