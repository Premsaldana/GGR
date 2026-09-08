/**
 * Button — primary UI primitive
 * ─────────────────────────────────────────────
 * Variants: primary (filled accent), secondary (outlined), ghost (text only)
 * Sizes: sm, md, lg
 * States: default, hover, focus, loading, disabled
 * Accessibility: always renders as <button> or <a> with correct role/type
 */

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize    = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchor = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "btn-primary",
  secondary:
    "btn-secondary",
  ghost:
    "btn-ghost",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  ...props
}: ButtonProps) {
  const className = [
    "btn",
    variantClasses[variant],
    sizeClasses[size],
    loading ? "btn-loading" : "",
    (props as ButtonHTMLAttributes<HTMLButtonElement>).disabled ? "btn-disabled" : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if ((props as ButtonAsAnchor).as === "a") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { as: _as, loading: _l, ...anchorProps } = props as ButtonAsAnchor & { loading?: boolean };
    return (
      <a {...anchorProps} className={className}>
        {loading ? <span aria-hidden="true" className="btn-spinner" /> : null}
        <span className={loading ? "btn-label-loading" : ""}>{children}</span>
      </a>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading: _l, ...buttonProps } = props as ButtonAsButton & { loading?: boolean };
  return (
    <button
      {...buttonProps}
      disabled={(buttonProps.disabled) || loading}
      className={className}
      type={buttonProps.type ?? "button"}
    >
      {loading ? <span aria-hidden="true" className="btn-spinner" /> : null}
      <span className={loading ? "btn-label-loading" : ""}>{children}</span>
    </button>
  );
}
