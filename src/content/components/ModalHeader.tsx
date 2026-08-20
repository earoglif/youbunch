import { BotMessageSquare, Download, Upload, X } from "lucide-react";

type ModalHeaderProps = {
  title: string;
  titleId?: string;
  openGroupingPromptLabel: string;
  onOpenGroupingPrompt: () => void;
  groupingPromptDisabled?: boolean;
  exportLabel: string;
  onExport: () => void;
  importLabel: string;
  onImport: () => void;
  actionsDisabled?: boolean;
  closeLabel: string;
  onClose: () => void;
};

export function ModalHeader({
  title,
  titleId,
  openGroupingPromptLabel,
  onOpenGroupingPrompt,
  groupingPromptDisabled,
  exportLabel,
  onExport,
  importLabel,
  onImport,
  actionsDisabled,
  closeLabel,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="YouBunch-modal-header">
      <h2 id={titleId} className="YouBunch-modal-title">
        {title}
      </h2>
      <div className="YouBunch-modal-header-actions">
        <button
          type="button"
          className="YouBunch-icon-button"
          aria-label={exportLabel}
          title={exportLabel}
          disabled={actionsDisabled}
          onClick={onExport}
        >
          <Upload size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="YouBunch-icon-button"
          aria-label={importLabel}
          title={importLabel}
          disabled={actionsDisabled}
          onClick={onImport}
        >
          <Download size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="YouBunch-icon-button"
          aria-label={openGroupingPromptLabel}
          title={openGroupingPromptLabel}
          disabled={groupingPromptDisabled}
          onClick={onOpenGroupingPrompt}
        >
          <BotMessageSquare size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <button type="button" aria-label={closeLabel} className="YouBunch-icon-button" onClick={onClose}>
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
