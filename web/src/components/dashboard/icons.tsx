import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const buildClass = (className?: string) => ["h-7 w-7 shrink-0", className].filter(Boolean).join(" ");

export function DashboardIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="M4 13h6v7H4z" />
      <path d="M14 4h6v16h-6z" />
      <path d="M4 4h6v7H4z" />
    </svg>
  );
}

export function UsersIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="M16 21v-2.5a4.5 4.5 0 0 0-9 0V21" strokeLinecap="round" />
      <circle cx="11.5" cy="9" r="3.5" />
      <path d="M19 21v-2c0-1.4-.9-2.6-2.2-3.1" strokeLinecap="round" />
      <circle cx="18" cy="9" r="2.5" />
    </svg>
  );
}

export function StoreIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="M3 9.5h18L19.5 4h-15z" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9 13h6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={buildClass(className)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5 11 16l5.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path
        d="m19.4 13.5.8-1.4-.8-1.4-1.6-.2a6.2 6.2 0 0 0-.9-1.5l.3-1.6-1.3-.9-1.4.8c-.5-.2-1-.3-1.6-.3s-1.1.1-1.6.3l-1.4-.8-1.3.9.3 1.6c-.3.5-.6 1-.9 1.5l-1.6.2-.8 1.4.8 1.4 1.6.2c.2.5.6 1 .9 1.5l-.3 1.6 1.3.9 1.4-.8c.5.2 1 .3 1.6.3s1.1-.1 1.6-.3l1.4.8 1.3-.9-.3-1.6c.3-.5.6-1 .9-1.5z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function ContentIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M7.5 9h9" strokeLinecap="round" />
      <path d="M7.5 13h5" strokeLinecap="round" />
    </svg>
  );
}

export function HammerIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="m13 5 3-3 2 2-3 3" strokeLinecap="round" />
      <path d="M3 13 9 7l4 4-6 6H4z" strokeLinejoin="round" />
      <path d="m12 12 5.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

export function CategoryIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v4h-7z" />
      <path d="M13 10h7v10h-7z" />
      <path d="M4 13h7v7H4z" />
    </svg>
  );
}

export function BellIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 6 1.5 6H4.5S6 13 6 9" strokeLinecap="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={buildClass(className)} {...rest}>
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const dashboardIcons = {
  dashboard: DashboardIcon,
  users: UsersIcon,
  stores: StoreIcon,
  approvals: CheckIcon,
  settings: SettingsIcon,
  contents: ContentIcon,
  moderation: HammerIcon,
  categories: CategoryIcon,
  notifications: BellIcon,
  arrow: ArrowRightIcon
};
