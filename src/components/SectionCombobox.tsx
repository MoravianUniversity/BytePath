import { useEffect, useRef, useState } from "react";
import "./SectionCombobox.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  onCommit?: (value: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export default function SectionCombobox({
  value,
  onChange,
  suggestions,
  placeholder = "Section",
  className = "",
  onCommit,
  onCancel,
  autoFocus = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const trimmed = value.trim();
  const matching = suggestions.filter((s) =>
    trimmed === "" ? true : s.toLowerCase().includes(trimmed.toLowerCase()),
  );
  const showDropdown = open && matching.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commit = (next: string) => {
    onChange(next);
    onCommit?.(next);
  };

  return (
    <div className={`section-combobox ${className}`.trim()} ref={rootRef}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="section-combobox__input inline-edit-input"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            onCommit?.(valueRef.current.trim());
          }, 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(value.trim());
            setOpen(false);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel?.();
          }
        }}
      />
      {showDropdown && (
        <ul className="section-combobox__dropdown" role="listbox">
          {matching.map((s) => (
            <li key={s}>
              <button
                type="button"
                role="option"
                className="section-combobox__option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  commit(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
