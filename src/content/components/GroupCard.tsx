import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { type FC, useState } from "react";
import type { IGroup, ISubscription } from "../../shared/types";
import { t } from "../i18n";
import { GroupForm } from "./GroupForm";
import { SubscriptionItem } from "./SubscriptionItem";
import { type GroupDragData, getGroupDragId } from "./dnd";

interface IGroupCardProps {
  group: IGroup;
  subscriptions: ISubscription[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onDelete: (groupId: string) => Promise<void> | void;
  onUpdate: (groupId: string, values: { name: string; color: string }) => Promise<void> | void;
}

export const GroupCard: FC<IGroupCardProps> = ({
  group,
  subscriptions,
  isCollapsed,
  onToggleCollapsed,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { active } = useDndContext();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: getGroupDragId(group.id),
    data: {
      kind: "group",
      groupId: group.id,
    } satisfies GroupDragData,
  });

  const isSubscriptionOver = isOver && active?.data.current?.kind === "subscription";

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    borderColor: isSubscriptionOver ? group.color : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      className={`YouBunch-group-card${isDragging ? " is-dragging" : ""}${isSubscriptionOver ? " is-over" : ""}`}
      style={style}
    >
      <div className="YouBunch-group-header">
        <div className="YouBunch-group-title-wrap">
          <button
            type="button"
            className="YouBunch-drag-handle"
            aria-label={t("dragGroup")}
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <button
            type="button"
            className="YouBunch-collapse-toggle"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? t("expandGroup") : t("collapseGroup")}
          >
            <ChevronDown
              size={18}
              strokeWidth={2}
              className={`YouBunch-collapse-chevron${isCollapsed ? " is-collapsed" : ""}`}
              aria-hidden="true"
            />
          </button>
          <span className="YouBunch-group-color" style={{ backgroundColor: group.color }} />
          <h3 className="YouBunch-group-title">{group.name}</h3>
        </div>
        <div className="YouBunch-inline-actions YouBunch-group-header-actions">
          <button
            type="button"
            className="YouBunch-icon-button YouBunch-group-action-icon"
            onClick={() => setIsEditing((value) => !value)}
            title={t("edit")}
            aria-label={t("edit")}
          >
            <Pencil size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="YouBunch-icon-button YouBunch-group-action-icon"
            onClick={() => void onDelete(group.id)}
            title={t("delete")}
            aria-label={t("delete")}
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <GroupForm
          mode="edit"
          initialName={group.name}
          initialColor={group.color}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(group.id, values);
            setIsEditing(false);
          }}
        />
      ) : null}

      {!isCollapsed ? (
        <div className="YouBunch-group-content">
          {subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <SubscriptionItem
                key={subscription.channelId}
                subscription={subscription}
                groupId={group.id}
              />
            ))
          ) : (
            <p className="YouBunch-empty-text">{t("groupEmpty")}</p>
          )}
        </div>
      ) : null}
    </article>
  );
};
