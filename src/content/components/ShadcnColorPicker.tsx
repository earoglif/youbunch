import { type FC, useContext, useEffect, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { ModalPortalContainerContext } from "../modal-portal-context";

interface IShadcnColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label": string;
}

function normalizeHexKeyInput(raw: string): string {
  let s = raw.trim();
  if (!s.startsWith("#")) {
    s = `#${s.replace(/#/g, "")}`;
  }
  const body = s
    .slice(1)
    .replace(/[^0-9A-Fa-f]/g, "")
    .slice(0, 6);
  return `#${body}`;
}

export const ShadcnColorPicker: FC<IShadcnColorPickerProps> = ({ value, onChange, disabled, "aria-label": ariaLabel }) => {
  const portalContainer = useContext(ModalPortalContainerContext);
  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(value);

  const displayColor = useMemo(() => value || "#ffffff", [value]);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  const pickerColor = useMemo(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexDraft)) {
      return hexDraft.toLowerCase();
    }
    return displayColor;
  }, [displayColor, hexDraft]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="YouBunch-color-picker-trigger"
          style={{ backgroundColor: displayColor }}
          aria-label={ariaLabel}
        />
      </PopoverTrigger>
      <PopoverContent
        container={portalContainer ?? undefined}
        className="YouBunch-color-picker-popover"
      >
        <div className="YouBunch-shadcn-color-picker-panel">
          <HexColorPicker color={pickerColor} onChange={(next) => onChange(next.toLowerCase())} />
          <input
            className="YouBunch-input YouBunch-color-picker-hex-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            value={hexDraft}
            onChange={(event) => {
              const next = normalizeHexKeyInput(event.target.value);
              setHexDraft(next);
              if (/^#[0-9A-Fa-f]{6}$/.test(next)) {
                onChange(next.toLowerCase());
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
