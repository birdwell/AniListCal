import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AppStateKind = "loading" | "error" | "empty";

interface AppStateProps {
  kind: AppStateKind;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function AppState({
  kind,
  title,
  description,
  action,
  className,
}: AppStateProps) {
  const isLoading = kind === "loading";
  const isError = kind === "error";

  return (
    <section
      className={cn(
        "flex min-h-64 flex-col items-center justify-center gap-4 py-10 text-center",
        className,
      )}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
      ) : isError ? (
        <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
      ) : (
        <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden />
      )}

      {(title || description) && (
        <div className="max-w-md space-y-1.5">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {action}
    </section>
  );
}
