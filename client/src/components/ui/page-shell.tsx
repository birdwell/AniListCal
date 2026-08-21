import * as React from "react";

import { cn } from "@/lib/utils";

type PageShellSize = "wide" | "narrow";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: PageShellSize;
}

export function PageShell({
  size = "wide",
  className,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-10",
        size === "wide" ? "max-w-7xl" : "max-w-3xl",
        className,
      )}
      {...props}
    />
  );
}

interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold leading-[2.125rem] tracking-[-0.025em] text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
}

export function SectionHeading({
  title,
  count,
  action,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-between gap-4",
        className,
      )}
      {...props}
    >
      <h2 className="min-w-0 font-display text-xl font-semibold leading-7 tracking-[-0.015em]">
        {title}
        {typeof count === "number" ? (
          <span className="ml-2 font-data text-xs font-semibold text-muted-foreground">
            {count}
          </span>
        ) : null}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
