import type { InputHTMLAttributes } from "react";

type AuthFieldProps = {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthField({ label, id, className, ...inputProps }: AuthFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white/90" htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition ${className ?? ""}`}
        {...inputProps}
      />
    </label>
  );
}
