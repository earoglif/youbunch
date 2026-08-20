import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useState } from "react";
import { X } from "lucide-react";

type CopyStatus = "idle" | "copied" | "error";

export type GroupingPromptDialogLabels = {
  title: string;
  description: string;
  closeLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copyErrorLabel: string;
  promptFieldLabel: string;
};

type GroupingPromptDialogProps = {
  isOpen: boolean;
  prompt: string;
  labels: GroupingPromptDialogLabels;
  onClose: () => void;
};

const PROMPT_DIALOG_TITLE_ID = "YouBunch-grouping-prompt-title";

export function GroupingPromptDialog({
  isOpen,
  prompt,
  labels,
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
            {labels.title}
          </h3>
          <button type="button" className="YouBunch-icon-button" aria-label={labels.closeLabel} onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="YouBunch-prompt-body">
          <p className="YouBunch-info-text">{labels.description}</p>

          <textarea
            className="YouBunch-prompt-textarea"
            readOnly
            value={prompt}
            aria-label={labels.promptFieldLabel}
          />

          <div className="YouBunch-inline-actions YouBunch-prompt-actions">
            <button type="button" className="YouBunch-button is-primary" onClick={copyPrompt}>
              {copyStatus === "copied" ? labels.copiedLabel : labels.copyLabel}
            </button>
          </div>

          {copyStatus === "error" ? <p className="YouBunch-info-text">{labels.copyErrorLabel}</p> : null}
        </div>
      </div>
    </div>
  );
}
