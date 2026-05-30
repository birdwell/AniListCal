import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RelationsSectionData } from "./types";

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
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Related Media
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {Object.entries(relationsByType).map(([relationType, items]) => (
            <div key={relationType} className="space-y-2">
              <h3 className="text-sm font-medium">
                {formatRelationType(relationType)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.map((relation) => (
                  <a
                    key={relation?.id ?? `${relationType}-${relation?.node?.id}`}
                    href={`/show/${relation?.node?.id}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={relation?.node?.coverImage?.large || ""}
                        alt={relation?.node?.title?.romaji || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {relation?.node?.title?.english ||
                          relation?.node?.title?.romaji ||
                          "Unknown Title"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {relation?.node?.format && (
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            {relation.node.format}
                          </Badge>
                        )}
                        {relation?.node?.status && (
                          <span className="text-xs text-muted-foreground">
                            {relation.node.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
