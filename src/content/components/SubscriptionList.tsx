import { useDndContext, useDroppable } from "@dnd-kit/core";
import type { ISubscription } from "../../shared/types";
import { t } from "../i18n";
import { SubscriptionItem } from "./SubscriptionItem";
import { UNGROUPED_DROP_ID } from "./dnd";

type SubscriptionListProps = {
  subscriptions: ISubscription[];
};

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: UNGROUPED_DROP_ID,
  });

  const isSubscriptionOver = isOver && active?.data.current?.kind === "subscription";

  return (
    <section ref={setNodeRef} className={`YouBunch-ungrouped${isSubscriptionOver ? " is-over" : ""}`}>
      <h3 className="YouBunch-ungrouped-title">{t("ungroupedSubscriptions")}</h3>
      <div className="YouBunch-ungrouped-list">
        {subscriptions.length > 0 ? (
          subscriptions.map((subscription) => (
            <SubscriptionItem
              key={subscription.channelId}
              subscription={subscription}
              groupId={null}
            />
          ))
        ) : (
          <p className="YouBunch-empty-text">{t("ungroupedEmpty")}</p>
        )}
      </div>
    </section>
  );
}
