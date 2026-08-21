import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RelationsSectionData } from "./types";
import { MediaLink } from "@/components/media-link";

const formatRelationType = (relationType: string): string => {
  return relationType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export function RelationsSection({ relations }: RelationsSectionData) {
  const relationEdges =
    relations?.edges?.filter((edge) => edge !== null && edge.node !== null) ||
    [];

  if (!relations || relationEdges.length === 0) {
    return null;
  }

  const relationsByType: Record<string, typeof relationEdges> = {};

  relationEdges.forEach((relation) => {
    if (!relation?.relationType) {
      return;
    }

    if (!relationsByType[relation.relationType]) {
      relationsByType[relation.relationType] = [];
    }

    relationsByType[relation.relationType].push(relation);
  });

  const relationTypes = Object.keys(relationsByType);
  if (relationTypes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="font-display text-xl font-semibold">Related media</h2>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {Object.entries(relationsByType).map(([relationType, items]) => (
            <div key={relationType} className="space-y-2">
              <h3 className="text-sm font-medium">
                {formatRelationType(relationType)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.map((relation) => {
                  const node = relation?.node;
                  if (!node) return null;

                  const title =
                    node.title?.english ||
                    node.title?.romaji ||
                    "Unknown title";

                  return (
                    <MediaLink
                      key={relation?.id ?? `${relationType}-${node.id}`}
                      mediaId={node.id}
                      mediaType={node.type}
                      label={`Open ${title}`}
                      className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted motion-reduce:transition-none"
                    >
                      <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                        <img
                          src={node.coverImage?.large || ""}
                          alt=""
                          width={48}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium transition-colors group-hover:text-primary motion-reduce:transition-none">
                          {title}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          {node.format && (
                            <Badge variant="outline" className="h-5 py-0 text-xs">
                              {node.format}
                            </Badge>
                          )}
                          {node.status && (
                            <span className="text-xs text-muted-foreground">
                              {node.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </MediaLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
