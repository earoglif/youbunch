import { BotMessageSquare, Download, Upload, X } from "lucide-react";
import { t } from "../i18n";

type ModalHeaderProps = {
  titleId?: string;
  onOpenGroupingPrompt: () => void;
  groupingPromptDisabled?: boolean;
  onExport: () => void;
  onImport: () => void;
  actionsDisabled?: boolean;
  onClose: () => void;
};

export function ModalHeader({
  titleId,
  onOpenGroupingPrompt,
  groupingPromptDisabled,
  onExport,
  onImport,
  actionsDisabled,
  onClose,
}: ModalHeaderProps) {
  const title = t("manageGroups");
  const exportLabel = t("exportGroups");
  const importLabel = t("importGroups");
  const openGroupingPromptLabel = t("openGroupingPrompt");
  const closeLabel = t("close");

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
