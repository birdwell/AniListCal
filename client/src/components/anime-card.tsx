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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm">
          {status}
        </Badge>
      </div>
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">
          {title}
        </CardTitle>
      </CardHeader>
      {nextEpisode && (
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              Ep. {nextEpisode.episode} airs{" "}
              {new Date(nextEpisode.airingAt * 1000).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}