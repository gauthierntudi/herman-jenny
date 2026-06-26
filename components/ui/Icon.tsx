import type { LucideIcon as LucideIconType, LucideProps } from "lucide-react";

export type IconProps = LucideProps & {
  icon: LucideIconType;
  spin?: boolean;
};

export function Icon({
  icon: LucideIcon,
  spin,
  className,
  size = 18,
  strokeWidth = 2,
  ...rest
}: IconProps) {
  const classes = ["lucide-icon", spin ? "lucide-spin" : "", className].filter(Boolean).join(" ");

  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={classes}
      aria-hidden={rest["aria-hidden"] ?? true}
      {...rest}
    />
  );
}
