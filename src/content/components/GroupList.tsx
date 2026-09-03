import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { FC } from "react";
import type { IGroup, ISubscription } from "../../shared/types";
import { GroupCard } from "./GroupCard";
import { getGroupDragId } from "./dnd";

interface IGroupListProps {
  groups: IGroup[];
  subscriptionsByGroupId: Map<string, ISubscription[]>;
  collapsedGroupIds: ReadonlySet<string>;
  onToggleGroupCollapsed: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => Promise<void> | void;
  onUpdateGroup: (groupId: string, values: { name: string; color: string }) => Promise<void> | void;
}

export const GroupList: FC<IGroupListProps> = ({
  groups,
  subscriptionsByGroupId,
  collapsedGroupIds,
  onToggleGroupCollapsed,
  onDeleteGroup,
  onUpdateGroup,
}) => {
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
            onDelete={onDeleteGroup}
            onUpdate={onUpdateGroup}
          />
        ))}
      </div>
    </SortableContext>
  );
};
