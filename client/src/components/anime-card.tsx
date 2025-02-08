import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface AnimeCardProps {
  title: string;
  imageUrl: string;
  status: string;
  nextEpisode?: {
    airingAt: number;
    episode: number;
  };
}

export function AnimeCard({ title, imageUrl, status, nextEpisode }: AnimeCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[2/3] relative">
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full"
        />
        <Badge className="absolute top-2 right-2 bg-primary">
          {status}
        </Badge>
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
      </CardHeader>
      {nextEpisode && (
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Episode {nextEpisode.episode} airs{" "}
              {new Date(nextEpisode.airingAt * 1000).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
