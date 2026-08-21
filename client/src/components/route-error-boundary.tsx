import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AppState } from "@/components/app-state";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  reload?: () => void;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Route] Failed to load route", error, info);
  }

  private reload = () => {
    if (this.props.reload) {
      this.props.reload();
      return;
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <PageShell size="narrow" className="space-y-6 py-10 sm:py-16">
          <PageHeader title="Update required" />
          <AppState
            kind="error"
            description="This page could not be loaded. Reload to use the latest version."
            action={<Button onClick={this.reload}>Reload app</Button>}
          />
        </PageShell>
      );
    }

    return this.props.children;
  }
}
