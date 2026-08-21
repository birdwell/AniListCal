import { Link } from "wouter";
import { AppState } from "@/components/app-state";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export default function NotFound() {
  return (
    <PageShell size="narrow" className="space-y-6 py-10 sm:py-16">
      <PageHeader eyebrow="404" title="Page not found" />
      <AppState
        kind="empty"
        description="The page may have moved or the address may be incorrect."
        action={
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        }
      />
    </PageShell>
  );
}
