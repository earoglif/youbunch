import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FC } from "react";
import type { GroupId, ISubscription } from "../../shared/types";
import { t } from "../i18n";
import { type SubscriptionDragData, getSubscriptionDragId } from "./dnd";

interface ISubscriptionItemProps {
  subscription: ISubscription;
  groupId: GroupId | null;
}

export const SubscriptionItem: FC<ISubscriptionItemProps> = ({ subscription, groupId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: getSubscriptionDragId(subscription.channelId),
    data: {
      kind: "subscription",
      channelId: subscription.channelId,
      groupId,
    } satisfies SubscriptionDragData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} className={`YouBunch-subscription-item${isDragging ? " is-dragging" : ""}`} style={style}>
      <button type="button" className="YouBunch-drag-handle" aria-label={t("dragSubscription")} {...attributes} {...listeners}>
        ≡
      </button>
      <span className="YouBunch-subscription-avatar-wrap" aria-hidden="true">
        {subscription.thumbnailUrl ? (
          <img
            className="YouBunch-subscription-avatar"
            src={subscription.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="YouBunch-subscription-avatar-fallback" />
        )}
      </span>
      <span className="YouBunch-subscription-name">{subscription.name}</span>
    </div>
  );
};
