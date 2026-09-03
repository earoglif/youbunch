import type { FC } from "react";
import { handleYouTubeSpaLinkClick } from "../services/yt-navigation";
import type { ChannelId, ISubscription } from "../../shared/types";

interface IGuideSubscriptionItemProps {
  subscription: ISubscription;
  currentPathname: string;
  hasNewContent?: boolean;
  onSeen?: (channelId: ChannelId) => void;
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

function isActiveSubscriptionPath(channelId: string, currentPathname: string): boolean {
  const normalizedPathname = normalizePathname(currentPathname);
  const channelPath = `/channel/${channelId}`;
  return normalizedPathname === channelPath || normalizedPathname.startsWith(`${channelPath}/`);
}

export const GuideSubscriptionItem: FC<IGuideSubscriptionItemProps> = ({
  subscription,
  currentPathname,
  hasNewContent,
  onSeen,
}) => {
  const isActive = isActiveSubscriptionPath(subscription.channelId, currentPathname);
  const channelUrl = `/channel/${subscription.channelId}`;

  return (
    <a
      className={`guide-sub-item${isActive ? " is-active" : ""}`}
      href={channelUrl}
      title={subscription.name}
      aria-current={isActive ? "page" : undefined}
      onClick={(event) => {
        onSeen?.(subscription.channelId);
        handleYouTubeSpaLinkClick(event, {
          url: channelUrl,
          browseId: subscription.channelId,
        });
      }}
    >
      <span className="guide-sub-avatar-wrap" aria-hidden="true">
        {subscription.thumbnailUrl ? (
          <img
            className="guide-sub-avatar"
            src={subscription.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="guide-sub-avatar-fallback" />
        )}
      </span>
      <span className="guide-sub-name">{subscription.name}</span>
      {hasNewContent ? <span className="guide-sub-newness-dot" aria-hidden="true" /> : null}
    </a>
  );
};
