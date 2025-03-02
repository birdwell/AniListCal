import { MediaFragmentFragment } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, Link2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface RelationsSectionProps {
  show: MediaFragmentFragment;
}

// Helper function to format relation types for display
const formatRelationType = (relationType: string): string => {
  // Convert from SNAKE_CASE to Title Case with spaces
  return relationType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function RelationsSection({ show }: RelationsSectionProps) {
  // Debug logging
  useEffect(() => {
    console.log("Relations Data:", show.relations);
  }, [show.relations]);

  // Filter out null relations
  const relations = show.relations?.edges?.filter(edge => edge !== null && edge.node !== null) || [];
  
  if (!show.relations || !relations || relations.length === 0) {
    console.log("No relations available");
    return null;
  }
  
  // Group relations by type for better organization
  const relationsByType: Record<string, typeof relations> = {};
  
  relations.forEach(relation => {
    if (!relation?.relationType) {
      console.log("Relation missing relationType:", relation);
      return;
    }
    
    if (!relationsByType[relation.relationType]) {
      relationsByType[relation.relationType] = [];
    }
    
    relationsByType[relation.relationType].push(relation);
  });
  
  // Check if we have any relation types after grouping
  const relationTypes = Object.keys(relationsByType);
  if (relationTypes.length === 0) {
    console.log("No relation types available after grouping");
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
        {relationTypes.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(relationsByType).map(([relationType, relations]) => (
              <div key={relationType} className="space-y-2">
                <h3 className="text-sm font-medium">{formatRelationType(relationType)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {relations.map(relation => (
                    <a 
                      key={relation?.id || `relation-${Math.random()}`} 
                      href={`/show/${relation?.node?.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors group"
                    >
                      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={relation?.node?.coverImage?.large || ''} 
                          alt={relation?.node?.title?.romaji || ''} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {relation?.node?.title?.english || relation?.node?.title?.romaji || 'Unknown Title'}
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
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No related media available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
