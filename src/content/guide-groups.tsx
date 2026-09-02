import { Group, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { storage as extensionStorage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../shared/constants";
import styles from "./guide-groups.css?inline";
import { GuideGroupItem } from "./components/GuideGroupItem";
import { GuideSubscriptionList } from "./components/GuideSubscriptionList";
import { GroupsModal } from "./groups-modal";
import { useChannelNewness } from "./hooks/useChannelNewness";
import { useCollapsedGroupsPersistence } from "./hooks/useCollapsedGroups";
import { useGroups } from "./hooks/useGroups";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { ensureShadowMount } from "./mount";
import { t, useLanguageSync } from "./i18n";
import { isSubscriptionSortMode, sortSubscriptions } from "./services/sort-subscriptions";
import { loadSubscriptionSort, type SubscriptionSortMode } from "./services/subscription-sort";

const GROUPS_SECTION_ID = "YouBunch-groups-section";
const GROUPS_SECTION_STYLE_ID = "YouBunch-groups-section-styles";
const GROUPS_SECTION_ROOT_ID = "YouBunch-groups-section-root";
const GUIDE_COLLAPSED_GROUPS_STORAGE_PREFIX = STORAGE_KEYS.guideCollapsedPrefix;

function getCurrentPathname(): string {
  if (typeof window === "undefined") return "/";
  const trimmedPathname = window.location.pathname.replace(/\/+$/, "");
  return trimmedPathname.length > 0 ? trimmedPathname : "/";
}

type GuideGroupsButtonProps = {
  onClick: () => void;
};

function GuideGroupsButton({ onClick }: GuideGroupsButtonProps) {
  return (
    <button type="button" className="guide-groups-item" onClick={onClick}>
      <span className="guide-groups-icon" aria-hidden="true">
        <Group size={24} strokeWidth={2} />
      </span>
      <span className="guide-groups-label">{t("groups")}</span>
      <span className="guide-groups-settings" aria-hidden="true">
        <Settings size={20} strokeWidth={2} />
      </span>
    </button>
  );
}

function GuideGroupsSection() {
  useLanguageSync();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SubscriptionSortMode>("relevance");
  const [currentPathname, setCurrentPathname] = useState(getCurrentPathname);
  const { userId, groups, isLoading: isGroupsLoading, channelToGroupMap } = useGroups();
  const {
    subscriptions,
    isLoading: isSubscriptionsLoading,
    hasError: hasSubscriptionsError,
    refresh: refreshSubscriptions,
  } = useSubscriptions();
  const { newnessMap, markSeen } = useChannelNewness(subscriptions);
  const [collapsedGroupIds, setCollapsedGroupIds] = useCollapsedGroupsPersistence(
    userId,
    GUIDE_COLLAPSED_GROUPS_STORAGE_PREFIX
  );

  useEffect(() => {
    let isCancelled = false;

    void loadSubscriptionSort(userId)
      .then((storedSortMode) => {
        if (!isCancelled) {
          setSortMode(storedSortMode);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSortMode("relevance");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const sortStorageKey = userId
      ? `${STORAGE_KEYS.subscriptionSortPrefix}${userId}`
      : `${STORAGE_KEYS.subscriptionSortPrefix}anonymous`;

    const handleStorageChanged: Parameters<typeof extensionStorage.onChanged.addListener>[0] = (
      changes,
      areaName
    ) => {
      if (areaName !== "local") return;
      const nextSortMode = changes[sortStorageKey]?.newValue;
      if (typeof nextSortMode !== "string" || !isSubscriptionSortMode(nextSortMode)) return;
      setSortMode(nextSortMode);
    };

    extensionStorage.onChanged.addListener(handleStorageChanged);
    return () => extensionStorage.onChanged.removeListener(handleStorageChanged);
  }, [userId]);

  useEffect(() => {
    const syncPathname = () => {
      setCurrentPathname(getCurrentPathname());
    };

    window.addEventListener("popstate", syncPathname);
    window.addEventListener("yt-navigate-finish", syncPathname);
    window.addEventListener("yt-page-data-updated", syncPathname);

    return () => {
      window.removeEventListener("popstate", syncPathname);
      window.removeEventListener("yt-navigate-finish", syncPathname);
      window.removeEventListener("yt-page-data-updated", syncPathname);
    };
  }, []);

  useEffect(() => {
    const match = currentPathname.match(/^\/channel\/([^/]+)/);
    if (!match) return;
    const channelId = match[1];
    const isSubscribed = subscriptions.some((sub) => sub.channelId === channelId);
    if (!isSubscribed) return;
    markSeen(channelId);
  }, [currentPathname, subscriptions, markSeen]);

  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(subscriptions, sortMode),
    [subscriptions, sortMode]
  );

  const { subscriptionsByGroupId, ungroupedSubscriptions } = useMemo(() => {
    const grouped = new Map<string, typeof subscriptions>();
    for (const group of groups) {
      grouped.set(group.id, []);
    }

    const ungrouped: typeof subscriptions = [];
    for (const subscription of sortedSubscriptions) {
      const groupId = channelToGroupMap.get(subscription.channelId);
      if (groupId && grouped.has(groupId)) {
        grouped.get(groupId)?.push(subscription);
      } else {
        ungrouped.push(subscription);
      }
    }

    return {
      subscriptionsByGroupId: grouped,
      ungroupedSubscriptions: ungrouped,
    };
  }, [channelToGroupMap, groups, sortedSubscriptions, subscriptions]);

  const isListLoading = isGroupsLoading || isSubscriptionsLoading;
  const handleToggleCollapsed = (groupId: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div className="guide-groups-container">
      <div className="guide-groups-section">
        <GuideGroupsButton onClick={() => setIsModalOpen(true)} />
        {hasSubscriptionsError ? (
          <div className="guide-groups-error" role="alert">
            <p className="guide-groups-error-text">{t("subscriptionsError")}</p>
            <button type="button" className="guide-groups-error-retry" onClick={refreshSubscriptions}>
              {t("retry")}
            </button>
          </div>
        ) : null}
        {!isListLoading ? (
          <div className="guide-groups-list">
            {groups.map((group) => (
              <GuideGroupItem
                key={group.id}
                group={group}
                subscriptions={subscriptionsByGroupId.get(group.id) ?? []}
                currentPathname={currentPathname}
                isCollapsed={collapsedGroupIds.has(group.id)}
                onToggleCollapsed={() => handleToggleCollapsed(group.id)}
                newnessMap={newnessMap}
                onChannelSeen={markSeen}
              />
            ))}
            <GuideSubscriptionList
              currentPathname={currentPathname}
              subscriptions={ungroupedSubscriptions}
              newnessMap={newnessMap}
              onChannelSeen={markSeen}
            />
          </div>
        ) : null}
      </div>
      <GroupsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

function injectGroupsSection(): boolean {
  if (document.getElementById(GROUPS_SECTION_ID)) return true;

  const sectionsContainer = document.querySelector(
    "ytd-guide-renderer#guide-renderer #sections"
  );
  if (!sectionsContainer) return false;

  const sectionRenderers = sectionsContainer.querySelectorAll(
    ":scope > ytd-guide-section-renderer"
  );
  if (sectionRenderers.length < 2) return false;

  const subscriptionsSection = sectionRenderers[1];
  const container = document.createElement("div");
  container.id = GROUPS_SECTION_ID;
  container.className = "style-scope ytd-guide-renderer";
  sectionsContainer.insertBefore(container, subscriptionsSection);

  const reactContainer = ensureShadowMount({
    host: container,
    styleId: GROUPS_SECTION_STYLE_ID,
    rootId: GROUPS_SECTION_ROOT_ID,
    styles,
  });

  createRoot(reactContainer).render(<GuideGroupsSection />);

  return true;
}

export function initGuideGroups(): void {
  if (injectGroupsSection()) return;

  const observer = new MutationObserver(() => {
    if (injectGroupsSection()) {
      observer.disconnect();
      window.clearTimeout(observerTimeout);
    }
  });
  const observerTarget = document.querySelector("ytd-app") ?? document.body;
  const observerTimeout = window.setTimeout(() => {
    observer.disconnect();
  }, 30_000);

  observer.observe(observerTarget, { childList: true, subtree: true });
  window.addEventListener("yt-navigate-finish", () => {
    if (!document.getElementById(GROUPS_SECTION_ID)) {
      injectGroupsSection();
    }
  });
}
