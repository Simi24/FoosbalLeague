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
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-left text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <span className="truncate">{selected?.label ?? "Select..."}</span>
        <MdExpandMore
          size={18}
          className={`shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-bg-secondary shadow-lg">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3 py-3 text-left text-sm transition-colors sm:py-2.5 ${
                  opt.value === value
                    ? "bg-accent-light font-medium text-accent"
                    : "text-text-primary hover:bg-bg-tertiary"
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
