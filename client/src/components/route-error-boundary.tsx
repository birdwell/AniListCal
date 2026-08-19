import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <Card className="w-full max-w-md mx-4" role="alert">
            <CardHeader>
              <CardTitle>Update required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This page could not be loaded. Reload to use the latest version.</p>
              <Button onClick={this.reload}>Reload app</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
