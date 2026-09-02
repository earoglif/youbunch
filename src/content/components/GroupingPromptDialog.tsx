import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { t } from "../i18n";

type CopyStatus = "idle" | "copied" | "error";

type GroupingPromptDialogProps = {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
};

const PROMPT_DIALOG_TITLE_ID = "YouBunch-grouping-prompt-title";

export function GroupingPromptDialog({
  isOpen,
  prompt,
  onClose,
}: GroupingPromptDialogProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (isOpen) {
      setCopyStatus("idle");
    }
  }, [isOpen, prompt]);

  if (!isOpen) {
    return null;
  }

  const onOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
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

  return (
    <div
      className="YouBunch-prompt-overlay"
      onClick={onOverlayClick}
      onKeyDown={onOverlayKeyDown}
      onKeyUp={onOverlayKeyUp}
      role="presentation"
    >
      <div className="YouBunch-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby={PROMPT_DIALOG_TITLE_ID}>
        <div className="YouBunch-prompt-header">
          <h3 id={PROMPT_DIALOG_TITLE_ID} className="YouBunch-prompt-title">
            {t("groupingPromptTitle")}
          </h3>
          <button type="button" className="YouBunch-icon-button" aria-label={t("close")} onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="YouBunch-prompt-body">
          <p className="YouBunch-info-text">{t("groupingPromptDescription")}</p>

          <textarea
            className="YouBunch-prompt-textarea"
            readOnly
            value={prompt}
            aria-label={t("groupingPromptField")}
          />

          <div className="YouBunch-inline-actions YouBunch-prompt-actions">
            <button type="button" className="YouBunch-button is-primary" onClick={copyPrompt}>
              {copyStatus === "copied" ? t("copiedPrompt") : t("copyPrompt")}
            </button>
          </div>

          {copyStatus === "error" ? <p className="YouBunch-info-text">{t("copyPromptError")}</p> : null}
        </div>
      </div>
    </div>
  );
}
