import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message?: string;
}

export function ErrorDisplay({ message = "Show not found" }: ErrorDisplayProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
