import { type FC, type FormEvent, useState } from "react";
import { DEFAULT_GROUP_COLOR, sanitizeColor } from "../../shared/groups";
import { t } from "../i18n";
import { ShadcnColorPicker } from "./ShadcnColorPicker";

export type GroupFormValues = {
  name: string;
  color: string;
};

interface IGroupFormProps {
  mode: "create" | "edit";
  initialName?: string;
  initialColor?: string;
  onSubmit: (values: GroupFormValues) => Promise<void> | void;
  onCancel: () => void;
}

export const GroupForm: FC<IGroupFormProps> = ({ mode, initialName, initialColor, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialName ?? "");
  const [color, setColor] = useState(() =>
    initialColor !== undefined ? sanitizeColor(initialColor) : DEFAULT_GROUP_COLOR
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLabel = mode === "create" ? t("createGroupAction") : t("save");

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
          aria-label={t("groupColorPicker")}
        />
        <input
          className="YouBunch-input YouBunch-group-form-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("groupNamePlaceholder")}
          maxLength={40}
        />
      </div>
      <div className="YouBunch-inline-actions">
        <button type="submit" className="YouBunch-button is-primary" disabled={!name.trim() || isSubmitting}>
          {submitLabel}
        </button>
        <button type="button" className="YouBunch-button" onClick={onCancel} disabled={isSubmitting}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
};
