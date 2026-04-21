import { useEffect, useRef, useState } from "react";
import { MdExpandMore } from "react-icons/md";

type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
};

export const Dropdown = ({ value, options, onChange, className = "" }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="brut-border btn-press flex min-h-[44px] w-full items-center justify-between gap-2 bg-card px-3 py-2 text-left text-sm font-medium text-ink outline-none transition-colors hover:bg-paper-alt"
      >
        <span className="truncate">{selected?.label ?? "Select..."}</span>
        <MdExpandMore
          size={20}
          className={`shrink-0 text-ink transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="brut-border brut-shadow absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-card">
          {options.map((opt) => (
            <li key={opt.value} className="border-b-2 border-ink last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                  opt.value === value
                    ? "bg-butter font-semibold text-ink"
                    : "text-ink hover:bg-paper-alt"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
