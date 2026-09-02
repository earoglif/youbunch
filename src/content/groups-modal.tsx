import { type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ToastHost } from "../components/ui/toast";
import { notify } from "../shared/services/notifications";
import modalStyles from "./groups-modal.css?inline";
import { ModalBody, type ModalBodyHandle, type ModalBodyLabels } from "./components/ModalBody";
import { ModalHeader } from "./components/ModalHeader";
import { t } from "./i18n";
import { ensureShadowMount } from "./mount";
import { ModalPortalContainerContext } from "./modal-portal-context";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { exportGroups, importGroups } from "../shared/services/import-export";

const MODAL_TITLE_ID = "YouBunch-manage-groups-modal-title";
const MODAL_HOST_ID = "YouBunch-modal-host";
const MODAL_ROOT_ID = "YouBunch-modal-root";
const MODAL_STYLE_ID = "YouBunch-modal-styles";
type GroupsModalLabels = ModalBodyLabels & {
  closeLabel: string;
  exportLabel: string;
  importLabel: string;
};

type GroupsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type GroupsModalPortalContentProps = {
  portalRoot: HTMLElement;
  title: string;
  labels: GroupsModalLabels;
  onClose: () => void;
};

function GroupsModalPortalContent({ portalRoot, title, labels, onClose }: GroupsModalPortalContentProps) {
  const {
    subscriptions,
    isLoading: isSubscriptionsLoading,
    hasError: hasSubscriptionsError,
    refresh,
  } = useSubscriptions();
  const modalBodyRef = useRef<ModalBodyHandle>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportExportBusy, setIsImportExportBusy] = useState(false);

  const onOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const stopKeyboardPropagation = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  };

  const onOverlayKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    stopKeyboardPropagation(event);
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  const onOverlayKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    stopKeyboardPropagation(event);
  };

  const handleExport = (): void => {
    setIsImportExportBusy(true);
    void exportGroups()
      .catch((error: unknown) => {
        console.error("Failed to export groups", error);
        notify.error(`${labels.exportLabel}: failed`);
      })
      .finally(() => {
        setIsImportExportBusy(false);
      });
  };

  const handleImportClick = (): void => {
    if (isImportExportBusy) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsImportExportBusy(true);
    void importGroups(file)
      .then(() => {
        refresh();
      })
      .catch((error: unknown) => {
        console.error("Failed to import groups", error);
        notify.error(`${labels.importLabel}: failed`);
      })
      .finally(() => {
        setIsImportExportBusy(false);
      });
  };

  return createPortal(
    <ModalPortalContainerContext.Provider value={portalRoot}>
      <div
        className="YouBunch-overlay"
        onClick={onOverlayClick}
        onKeyDown={onOverlayKeyDown}
        onKeyUp={onOverlayKeyUp}
        role="presentation"
      >
        <div className="YouBunch-modal" role="dialog" aria-modal="true" aria-labelledby={MODAL_TITLE_ID}>
          <ModalHeader
            title={title}
            titleId={MODAL_TITLE_ID}
            openGroupingPromptLabel={labels.openGroupingPromptLabel}
            onOpenGroupingPrompt={() => modalBodyRef.current?.openGroupingPrompt()}
            groupingPromptDisabled={subscriptions.length === 0}
            exportLabel={labels.exportLabel}
            onExport={handleExport}
            importLabel={labels.importLabel}
            onImport={handleImportClick}
            actionsDisabled={isImportExportBusy}
            closeLabel={labels.closeLabel}
            onClose={onClose}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
          <ModalBody
            ref={modalBodyRef}
            labels={labels}
            subscriptions={subscriptions}
            isSubscriptionsLoading={isSubscriptionsLoading}
            hasSubscriptionsError={hasSubscriptionsError}
            onRetrySubscriptions={refresh}
          />
          <ToastHost />
        </div>
      </div>
    </ModalPortalContainerContext.Provider>,
    portalRoot
  );
}

function ensureModalRoot(): HTMLElement {
  let host = document.getElementById(MODAL_HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = MODAL_HOST_ID;
    document.body.append(host);
  }

  return ensureShadowMount({
    host,
    styleId: MODAL_STYLE_ID,
    rootId: MODAL_ROOT_ID,
    styles: modalStyles,
  });
}

export function GroupsModal({ isOpen, onClose }: GroupsModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const title = t("manageGroups");
  const labels: GroupsModalLabels = {
    closeLabel: t("close"),
    newGroupLabel: t("newGroup"),
    exportLabel: t("exportGroups"),
    importLabel: t("importGroups"),
    sortLabel: t("sortSubscriptions"),
    sortRelevanceLabel: t("sortRelevance"),
    sortNameAscLabel: t("sortNameAsc"),
    sortNameDescLabel: t("sortNameDesc"),
    loadingLabel: t("loading"),
    retryLabel: t("retry"),
    subscriptionsErrorLabel: t("subscriptionsError"),
    noGroupsLabel: t("noGroups"),
    ungroupedTitle: t("ungroupedSubscriptions"),
    ungroupedEmptyLabel: t("ungroupedEmpty"),
    groupEmptyLabel: t("groupEmpty"),
    groupEditLabel: t("edit"),
    groupDeleteLabel: t("delete"),
    groupExpandLabel: t("expandGroup"),
    groupCollapseLabel: t("collapseGroup"),
    expandAllGroupsLabel: t("expandAllGroups"),
    collapseAllGroupsLabel: t("collapseAllGroups"),
    groupDragHandleLabel: t("dragGroup"),
    subscriptionDragHandleLabel: t("dragSubscription"),
    createNamePlaceholder: t("groupNamePlaceholder"),
    groupColorPickerLabel: t("groupColorPicker"),
    createLabel: t("createGroupAction"),
    saveLabel: t("save"),
    cancelLabel: t("cancel"),
    deleteGroupConfirm: t("deleteGroupConfirm"),
    openGroupingPromptLabel: t("openGroupingPrompt"),
    promptDialogTitle: t("groupingPromptTitle"),
    promptDialogDescription: t("groupingPromptDescription"),
    promptDialogCloseLabel: t("close"),
    promptDialogCopyLabel: t("copyPrompt"),
    promptDialogCopiedLabel: t("copiedPrompt"),
    promptDialogCopyErrorLabel: t("copyPromptError"),
    promptDialogFieldLabel: t("groupingPromptField"),
  };

  useEffect(() => {
    if (!isOpen) return;
    setPortalRoot(ensureModalRoot());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen || !portalRoot) return null;

  return <GroupsModalPortalContent portalRoot={portalRoot} title={title} labels={labels} onClose={onClose} />;
}
