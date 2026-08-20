import { type FormEvent, useMemo, useState } from "react";
import { DEFAULT_GROUP_COLOR, sanitizeColor } from "../../shared/groups";
import { ShadcnColorPicker } from "./ShadcnColorPicker";

export type GroupFormValues = {
  name: string;
  color: string;
};

export type GroupFormLabels = {
  namePlaceholder: string;
  colorPickerLabel: string;
  createLabel: string;
  saveLabel: string;
  cancelLabel: string;
};

type GroupFormProps = {
  mode: "create" | "edit";
  labels: GroupFormLabels;
  initialName?: string;
  initialColor?: string;
  onSubmit: (values: GroupFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function GroupForm({ mode, labels, initialName, initialColor, onSubmit, onCancel }: GroupFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [color, setColor] = useState(() =>
    initialColor !== undefined ? sanitizeColor(initialColor) : DEFAULT_GROUP_COLOR
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLabel = useMemo(() => (mode === "create" ? labels.createLabel : labels.saveLabel), [labels, mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, color });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="YouBunch-group-form" onSubmit={handleSubmit}>
      <div className="YouBunch-group-form-name-row">
        <ShadcnColorPicker
          value={color}
          onChange={setColor}
          disabled={isSubmitting}
          aria-label={labels.colorPickerLabel}
        />
        <input
          className="YouBunch-input YouBunch-group-form-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={labels.namePlaceholder}
          maxLength={40}
        />
      </div>
      <div className="YouBunch-inline-actions">
        <button type="submit" className="YouBunch-button is-primary" disabled={!name.trim() || isSubmitting}>
          {submitLabel}
        </button>
        <button type="button" className="YouBunch-button" onClick={onCancel} disabled={isSubmitting}>
          {labels.cancelLabel}
        </button>
      </div>
    </form>
  );
}
