import { MediaFragmentFragment } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Globe, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface ExternalLinksSectionProps {
  show: MediaFragmentFragment;
}

// Group links by type
const groupLinksByType = (links: any[]) => {
  const grouped: Record<string, any[]> = {};
  
  links.forEach(link => {
    const type = link?.type || 'OTHER';
    
    if (!grouped[type]) {
      grouped[type] = [];
    }
    
    grouped[type].push(link);
  });
  
  return grouped;
};

// Format link type for display
const formatLinkType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function ExternalLinksSection({ show }: ExternalLinksSectionProps) {
  // Debug logging
  useEffect(() => {
    console.log("External Links Data:", show.externalLinks);
  }, [show.externalLinks]);

  // Filter out null links
  const links = show.externalLinks?.filter(link => link !== null) || [];
  
  if (!show.externalLinks || !links || links.length === 0) {
    console.log("No external links available");
    return null;
  }
  
  const groupedLinks = groupLinksByType(links);
  
  // If no grouped links, don't render
  if (Object.keys(groupedLinks).length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          External Links
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {Object.keys(groupedLinks).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedLinks).map(([type, links]) => (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-medium">{formatLinkType(type)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {links.map(link => (
                    <a
                      key={link?.id}
                      href={link?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group"
                      style={{ 
                        color: link?.color ? `#${link.color}` : 'inherit',
                      }}
                    >
                      {link?.icon ? (
                        <img 
                          src={link.icon} 
                          alt={link?.site} 
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium group-hover:underline">
                        {link?.site}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No external links available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
