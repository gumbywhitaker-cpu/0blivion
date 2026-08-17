import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50 shadow-sm",
  secondary:
    "bg-surface-2 text-foreground hover:brightness-95 border border-border",
  outline:
    "bg-transparent text-foreground border border-border hover:bg-surface-2",
  ghost: "bg-transparent text-foreground hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-95 disabled:bg-danger/50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading,
    icon,
    fullWidth,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...anchorRest } = rest as Omit<ButtonAsLink, keyof CommonProps>;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={loading || buttonRest.disabled} {...buttonRest}>
      {content}
    </button>
  );
}
