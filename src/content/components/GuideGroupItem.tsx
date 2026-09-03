import { ChevronDown } from "lucide-react";
import type { FC } from "react";
import type { ChannelId, IGroup, ISubscription } from "../../shared/types";
import { t } from "../i18n";
import { GuideSubscriptionItem } from "./GuideSubscriptionItem";

interface IGuideGroupItemProps {
  group: IGroup;
  subscriptions: ISubscription[];
  currentPathname: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  newnessMap?: Map<ChannelId, boolean>;
  onChannelSeen?: (channelId: ChannelId) => void;
}

export const GuideGroupItem: FC<IGuideGroupItemProps> = ({
  group,
  subscriptions,
  currentPathname,
  isCollapsed,
  onToggleCollapsed,
  newnessMap,
  onChannelSeen,
}) => {
  return (
    <section className="guide-group">
      <button
        type="button"
        className="guide-group-header"
        onClick={onToggleCollapsed}
        aria-label={isCollapsed ? t("expandGroup") : t("collapseGroup")}
      >
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`guide-group-chevron${isCollapsed ? " is-collapsed" : ""}`}
          aria-hidden="true"
        />
        <span className="guide-group-color" style={{ backgroundColor: group.color }} aria-hidden="true" />
        <span className="guide-group-name" title={group.name}>
          {group.name}
        </span>
      </button>
      {!isCollapsed ? (
        <div className="guide-sub-list">
          {subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <GuideSubscriptionItem
                key={subscription.channelId}
                subscription={subscription}
                currentPathname={currentPathname}
                hasNewContent={newnessMap?.get(subscription.channelId) ?? false}
                onSeen={onChannelSeen}
              />
            ))
          ) : (
            <p className="guide-empty-text">{t("groupEmpty")}</p>
          )}
        </div>
      ) : null}
    </section>
  );
};
