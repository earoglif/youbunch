import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { IGroup, ISubscription } from "../../shared/types";
import { type GroupFormLabels } from "./GroupForm";
import { GroupCard, type GroupCardLabels } from "./GroupCard";
import { getGroupDragId } from "./dnd";

type GroupListProps = {
  groups: IGroup[];
  subscriptionsByGroupId: Map<string, ISubscription[]>;
  collapsedGroupIds: ReadonlySet<string>;
  onToggleGroupCollapsed: (groupId: string) => void;
  labels: GroupCardLabels;
  formLabels: GroupFormLabels;
  onDeleteGroup: (groupId: string) => Promise<void> | void;
  onUpdateGroup: (groupId: string, values: { name: string; color: string }) => Promise<void> | void;
};

export function GroupList({
  groups,
  subscriptionsByGroupId,
  collapsedGroupIds,
  onToggleGroupCollapsed,
  labels,
  formLabels,
  onDeleteGroup,
  onUpdateGroup,
}: GroupListProps) {
  return (
    <SortableContext items={groups.map((group) => getGroupDragId(group.id))} strategy={verticalListSortingStrategy}>
      <div className="YouBunch-group-list">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            subscriptions={subscriptionsByGroupId.get(group.id) ?? []}
            isCollapsed={collapsedGroupIds.has(group.id)}
            onToggleCollapsed={() => onToggleGroupCollapsed(group.id)}
            labels={labels}
            formLabels={formLabels}
            onDelete={onDeleteGroup}
            onUpdate={onUpdateGroup}
          />
        ))}
      </div>
    </SortableContext>
  );
}
