import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { logger } from "../shared/logger";
import { notify } from "../shared/services/notifications";
import modalStyles from "./groups-modal.css?inline";
import { ensureShadowMount } from "./mount";
import { AssignGroupDialog, type SubscribedChannelInfo } from "./components/AssignGroupDialog";
import { useGroups } from "./hooks/useGroups";
import { t, useLanguageSync } from "./i18n";
import { removeSubscriptions, requestChannelDetails, requestSubscriptions, upsertSubscription } from "./services/subscriptions";
import { initSubscribeWatcher, initUnsubscribeWatcher } from "./services/subscribe-watcher";

const ROOT_HOST_ID = "YouBunch-subscribe-assign-host";
const STYLE_ELEMENT_ID = "YouBunch-subscribe-assign-shadow-styles";
const ROOT_ELEMENT_ID = "YouBunch-subscribe-assign-shadow-root";
const DEBUG_PREFIX = "[YouBunch/subscribe-assign]";

function SubscribeAssignRoot() {
  useLanguageSync();
  const [pendingChannel, setPendingChannel] = useState<SubscribedChannelInfo | null>(null);
  const { groups, assignChannelToGroup, assignChannelsToGroup, createGroupAndAssignChannel } = useGroups();

  useEffect(() => {
    logger.debug(`${DEBUG_PREFIX} mount; initSubscribeWatcher`);
    const stopSubscribe = initSubscribeWatcher((channelId) => {
      const fallbackInfo: SubscribedChannelInfo = {
        channelId,
        name: channelId,
      };

      void requestChannelDetails(channelId)
        .then((subscription) => {
          const resolved: SubscribedChannelInfo = subscription
            ? {
                channelId: subscription.channelId,
                name: subscription.name.trim() || fallbackInfo.name,
                thumbnailUrl: subscription.thumbnailUrl,
              }
            : fallbackInfo;

          upsertSubscription({
            channelId: resolved.channelId,
            name: resolved.name,
            thumbnailUrl: resolved.thumbnailUrl,
          });

          logger.debug(`${DEBUG_PREFIX} set pending channel`, subscription, resolved);
          setPendingChannel(resolved);
        })
        .catch(() => {
          notify.error(t("genericError"));
          upsertSubscription({
            channelId: fallbackInfo.channelId,
            name: fallbackInfo.name,
          });
          logger.debug(`${DEBUG_PREFIX} set pending channel (fallback)`, fallbackInfo);
          setPendingChannel(fallbackInfo);
        });
    });

    const stopUnsubscribe = initUnsubscribeWatcher((channelIds) => {
      removeSubscriptions(channelIds);
      requestSubscriptions();
      void assignChannelsToGroup(channelIds, null);
      
      setPendingChannel((current) =>
        current && channelIds.includes(current.channelId) ? null : current
      );
    });

    return () => {
      stopSubscribe();
      stopUnsubscribe();
    };
  }, [assignChannelToGroup, assignChannelsToGroup]);

  if (!pendingChannel) return null;

  const handleClose = () => {
    setPendingChannel(null);
  };

  const handleAssignExisting = async (groupId: string) => {
    await assignChannelToGroup(pendingChannel.channelId, groupId);
    setPendingChannel(null);
  };

  const handleCreateAndAssign = async (values: { name: string; color: string }) => {
    await createGroupAndAssignChannel(pendingChannel.channelId, values);
    setPendingChannel(null);
  };

  return (
    <AssignGroupDialog
      channel={pendingChannel}
      groups={groups}
      onAssignToExisting={handleAssignExisting}
      onCreateAndAssign={handleCreateAndAssign}
      onClose={handleClose}
    />
  );
}

export function initSubscribeAssign(): void {
  if (document.getElementById(ROOT_HOST_ID)) {
    logger.debug(`${DEBUG_PREFIX} already initialized`);
    return;
  }

  const host = document.createElement("div");
  host.id = ROOT_HOST_ID;
  document.body.append(host);
  const mountRoot = ensureShadowMount({
    host,
    styleId: STYLE_ELEMENT_ID,
    rootId: ROOT_ELEMENT_ID,
    styles: modalStyles,
  });

  logger.debug(`${DEBUG_PREFIX} create react root`);
  createRoot(mountRoot).render(<SubscribeAssignRoot />);
}
