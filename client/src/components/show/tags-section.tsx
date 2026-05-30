import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TagsSectionData } from "./types";

export function TagsSection({ tags }: TagsSectionData) {
  const [showSpoilers, setShowSpoilers] = useState(false);

  const sortedTags =
    tags
      ?.filter((tag) => tag !== null)
      .sort((a, b) => (b?.rank || 0) - (a?.rank || 0)) || [];

  if (!tags || sortedTags.length === 0) {
    return null;
  }

  const spoilerTags = sortedTags.filter(
    (tag) => tag?.isMediaSpoiler || tag?.isGeneralSpoiler
  );
  const nonSpoilerTags = sortedTags.filter(
    (tag) => !tag?.isMediaSpoiler && !tag?.isGeneralSpoiler
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {nonSpoilerTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {nonSpoilerTags.map((tag) => (
              <TooltipProvider key={tag?.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="cursor-help">
                      {tag?.name || "Unknown Tag"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-sm">
                    <p>
                      {tag?.description ||
                        `No description available for ${tag?.name || "this tag"}`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-3 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No tags available</span>
          </div>
        )}

        {spoilerTags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">Spoiler Tags</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSpoilers(!showSpoilers)}
                className="ml-auto text-xs"
              >
                {showSpoilers ? "Hide Spoilers" : "Show Spoilers"}
              </Button>
            </div>

            {showSpoilers ? (
              <div className="flex flex-wrap gap-2">
                {spoilerTags.map((tag) => (
                  <TooltipProvider key={tag?.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="cursor-help border-warning text-warning"
                        >
                          {tag?.name || "Unknown Spoiler Tag"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px] text-sm">
                        <p>
                          {tag?.description ||
                            `No description available for ${tag?.name || "this spoiler tag"}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Click "Show Spoilers" to view {spoilerTags.length} spoiler tag
                {spoilerTags.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
