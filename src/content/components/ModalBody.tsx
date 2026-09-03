import {
  ArrowDownUp,
  DiamondPlus,
  ListChevronsDownUp,
  ListChevronsUpDown,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useCollapsedGroupsPersistence } from "../hooks/useCollapsedGroups";
import { t } from "../i18n";
import { useGroups } from "../hooks/useGroups";
import { useGroupsDnd } from "../modal/hooks/useGroupsDnd";
import { buildGroupingPrompt } from "../services/grouping-prompt";
import { isSubscriptionSortMode, sortSubscriptions } from "../services/sort-subscriptions";
import { loadSubscriptionSort, saveSubscriptionSort, type SubscriptionSortMode } from "../services/subscription-sort";
import type { ISubscription } from "../../shared/types";
import { GroupForm } from "./GroupForm";
import { GroupingPromptDialog } from "./GroupingPromptDialog";
import { GroupList } from "./GroupList";
import { SubscriptionList } from "./SubscriptionList";

interface IModalBodyProps {
  subscriptions: ISubscription[];
  isSubscriptionsLoading: boolean;
  hasSubscriptionsError: boolean;
  onRetrySubscriptions: () => void;
}

export type ModalBodyHandle = {
  openGroupingPrompt: () => void;
};

export const ModalBody = forwardRef<ModalBodyHandle, IModalBodyProps>(function ModalBody(
  { subscriptions, isSubscriptionsLoading, hasSubscriptionsError, onRetrySubscriptions },
  ref
) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupingPromptOpen, setIsGroupingPromptOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SubscriptionSortMode>("relevance");
  const {
    userId,
    groups,
    isLoading: isGroupsLoading,
    channelToGroupMap,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    assignChannelToGroup,
  } = useGroups();

  useImperativeHandle(
    ref,
    () => ({
      openGroupingPrompt: () => setIsGroupingPromptOpen(true),
    }),
    []
  );

  const [collapsedGroupIds, setCollapsedGroupIds] = useCollapsedGroupsPersistence(userId);

  const {
    DndContext,
    sensors,
    collisionDetection,
    modifiers,
    handleDragEnd,
  } = useGroupsDnd({
    groups,
    reorderGroups,
    assignChannelToGroup,
  });

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

  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(subscriptions, sortMode),
    [subscriptions, sortMode]
  );

  const { subscriptionsByGroupId, ungroupedSubscriptions } = useMemo(() => {
    const grouped = new Map<string, ISubscription[]>();
    for (const group of groups) {
      grouped.set(group.id, []);
    }

    const ungrouped: ISubscription[] = [];
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
  }, [channelToGroupMap, groups, sortedSubscriptions]);

  const groupingPrompt = useMemo(
    () =>
      buildGroupingPrompt({
        groups,
        subscriptions,
        channelToGroupMap,
      }),
    [channelToGroupMap, groups, subscriptions]
  );

  const handleSortModeChange = (nextSortMode: SubscriptionSortMode) => {
    setSortMode(nextSortMode);
    void saveSubscriptionSort(userId, nextSortMode);
  };

  const isLoading = isGroupsLoading || isSubscriptionsLoading;

  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const allGroupsCollapsed =
    groups.length > 0 && groups.every((group) => collapsedGroupIds.has(group.id));

  const handleCollapseExpandAll = () => {
    if (allGroupsCollapsed) {
      setCollapsedGroupIds(new Set());
    } else {
      setCollapsedGroupIds(new Set(groups.map((group) => group.id)));
    }
  };

  return (
    <div className="YouBunch-modal-body">
      <div className="YouBunch-toolbar">
        <button
          type="button"
          className="YouBunch-button is-primary YouBunch-new-group-button"
          onClick={() => setIsCreateGroupOpen(true)}
        >
          <DiamondPlus size={24} strokeWidth={2} aria-hidden="true" />
          {t("newGroup")}
        </button>
        <div className="YouBunch-toolbar-end">
          <label className="YouBunch-toolbar-select-wrap" title={t("sortSubscriptions")}>
            <span className="YouBunch-toolbar-select-label" aria-hidden="true">
              <ArrowDownUp size={18} strokeWidth={2} />
            </span>
            <select
              className="YouBunch-toolbar-select"
              aria-label={t("sortSubscriptions")}
              value={sortMode}
              onChange={(event) => {
                const nextSortMode = event.target.value;
                if (!isSubscriptionSortMode(nextSortMode)) return;
                handleSortModeChange(nextSortMode);
              }}
            >
              <option value="relevance">{t("sortRelevance")}</option>
              <option value="nameAsc">{t("sortNameAsc")}</option>
              <option value="nameDesc">{t("sortNameDesc")}</option>
            </select>
          </label>
          {!isLoading && groups.length > 0 ? (
            <button
              type="button"
              className="YouBunch-icon-button"
              aria-label={allGroupsCollapsed ? t("expandAllGroups") : t("collapseAllGroups")}
              title={allGroupsCollapsed ? t("expandAllGroups") : t("collapseAllGroups")}
              onClick={handleCollapseExpandAll}
            >
              {allGroupsCollapsed ? (
                <ListChevronsUpDown size={20} strokeWidth={2} aria-hidden="true" />
              ) : (
                <ListChevronsDownUp size={20} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {isCreateGroupOpen ? (
        <GroupForm
          mode="create"
          onCancel={() => setIsCreateGroupOpen(false)}
          onSubmit={async (values) => {
            await createGroup(values);
            setIsCreateGroupOpen(false);
          }}
        />
      ) : null}

      {isLoading ? (
        <div className="YouBunch-loading" role="status" aria-live="polite">
          <LoaderCircle className="YouBunch-loading-icon" aria-hidden="true" />
          <span>{t("loading")}</span>
        </div>
      ) : null}

      {!isLoading && hasSubscriptionsError ? (
        <div className="YouBunch-error" role="alert">
          <TriangleAlert className="YouBunch-error-icon" size={18} strokeWidth={2} aria-hidden="true" />
          <span className="YouBunch-error-text">{t("subscriptionsError")}</span>
          <button type="button" className="YouBunch-button" onClick={onRetrySubscriptions}>
            {t("retry")}
          </button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        modifiers={modifiers}
        onDragEnd={handleDragEnd}
      >
        <div className="YouBunch-modal-dnd">
          {groups.length > 0 ? (
            <GroupList
              groups={groups}
              subscriptionsByGroupId={subscriptionsByGroupId}
              collapsedGroupIds={collapsedGroupIds}
              onToggleGroupCollapsed={toggleGroupCollapsed}
              onDeleteGroup={async (groupId) => {
                if (!window.confirm(t("deleteGroupConfirm"))) return;
                await deleteGroup(groupId);
              }}
              onUpdateGroup={async (groupId, values) => {
                await updateGroup(groupId, values);
              }}
            />
          ) : (
            <p className="YouBunch-info-text">{t("noGroups")}</p>
          )}

          <SubscriptionList subscriptions={ungroupedSubscriptions} />
        </div>
      </DndContext>

      <GroupingPromptDialog
        isOpen={isGroupingPromptOpen}
        prompt={groupingPrompt}
        onClose={() => setIsGroupingPromptOpen(false)}
      />
    </div>
  );
});
