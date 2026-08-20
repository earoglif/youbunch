import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useState } from "react";
import { DiamondPlus, X } from "lucide-react";
import type { ChannelId, GroupId, IGroup } from "../../shared/types";
import { GroupForm } from "./GroupForm";

const DIALOG_TITLE_ID = "YouBunch-assign-group-dialog-title";

export type SubscribedChannelInfo = {
  channelId: ChannelId;
  name: string;
  thumbnailUrl?: string;
};

export type AssignGroupDialogLabels = {
  title: string;
  description: string;
  skipLabel: string;
  closeLabel: string;
  createNewGroupLabel: string;
  createNamePlaceholder: string;
  colorPickerLabel: string;
  createLabel: string;
  saveLabel: string;
  cancelLabel: string;
};

type AssignGroupDialogProps = {
  channel: SubscribedChannelInfo;
  groups: IGroup[];
  labels: AssignGroupDialogLabels;
  onAssignToExisting: (groupId: GroupId) => Promise<void> | void;
  onCreateAndAssign: (values: { name: string; color: string }) => Promise<void> | void;
  onClose: () => void;
};

export function AssignGroupDialog({
  channel,
  groups,
  labels,
  onAssignToExisting,
  onCreateAndAssign,
  onClose,
}: AssignGroupDialogProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(groups.length === 0);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || isBusy) return;
    onClose();
  };

  const handleAssignExisting = async (groupId: GroupId) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onAssignToExisting(groupId);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateSubmit = async (values: { name: string; color: string }) => {
    setIsBusy(true);
    try {
      await onCreateAndAssign(values);
    } finally {
      setIsBusy(false);
    }
  };

  const stopKeyboardPropagation = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  };

  const handleModalKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    stopKeyboardPropagation(event);
    if (event.key === "Escape" && !isBusy) {
      event.preventDefault();
      onClose();
    }
  };

  const handleModalKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    stopKeyboardPropagation(event);
  };

  return (
    <div
      className="YouBunch-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleModalKeyDown}
      onKeyUp={handleModalKeyUp}
      role="presentation"
    >
      <div
        className="YouBunch-modal YouBunch-assign-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
      >
        <div className="YouBunch-modal-header">
          <h2 id={DIALOG_TITLE_ID} className="YouBunch-modal-title">
            {labels.title}
          </h2>
          <div className="YouBunch-modal-header-actions">
            <button
              type="button"
              aria-label={labels.closeLabel}
              className="YouBunch-icon-button"
              onClick={onClose}
              disabled={isBusy}
            >
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="YouBunch-modal-body">
          <div className="YouBunch-assign-channel">
            <span className="YouBunch-assign-channel-avatar" aria-hidden="true">
              {channel.thumbnailUrl ? (
                <img src={channel.thumbnailUrl} alt="" referrerPolicy="no-referrer" />
              ) : null}
            </span>
            <span className="YouBunch-assign-channel-name" title={channel.name}>
              {channel.name}
            </span>
          </div>

          <p className="YouBunch-assign-description">{labels.description}</p>

          {groups.length > 0 ? (
            <div className="YouBunch-assign-group-list">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="YouBunch-assign-group-item"
                  disabled={isBusy}
                  onClick={() => {
                    void handleAssignExisting(group.id);
                  }}
                >
                  <span
                    className="YouBunch-assign-group-item-color"
                    style={{ backgroundColor: group.color }}
                    aria-hidden="true"
                  />
                  <span className="YouBunch-assign-group-item-name">{group.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          {isCreateOpen ? (
            <GroupForm
              mode="create"
              labels={{
                namePlaceholder: labels.createNamePlaceholder,
                colorPickerLabel: labels.colorPickerLabel,
                createLabel: labels.createLabel,
                saveLabel: labels.saveLabel,
                cancelLabel: labels.cancelLabel,
              }}
              onCancel={() => {
                if (groups.length > 0) setIsCreateOpen(false);
                else onClose();
              }}
              onSubmit={handleCreateSubmit}
            />
          ) : (
            <button
              type="button"
              className="YouBunch-button YouBunch-assign-create-toggle"
              onClick={() => setIsCreateOpen(true)}
              disabled={isBusy}
            >
              <DiamondPlus size={18} strokeWidth={2} aria-hidden="true" />
              {labels.createNewGroupLabel}
            </button>
          )}

          <div className="YouBunch-assign-actions">
            <button
              type="button"
              className="YouBunch-button"
              onClick={onClose}
              disabled={isBusy}
            >
              {labels.skipLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
