import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Globe, AlertCircle } from "lucide-react";
import type { ExternalLinksSectionData } from "./types";
import type { MediaFragmentFragment } from "@/generated/graphql";

type ExternalLinkItem = NonNullable<
  NonNullable<MediaFragmentFragment["externalLinks"]>[number]
>;

const groupLinksByType = (links: ExternalLinkItem[]) => {
  const grouped: Record<string, ExternalLinkItem[]> = {};

  links.forEach((link) => {
    const type = link.type || "OTHER";

    if (!grouped[type]) {
      grouped[type] = [];
    }

    grouped[type].push(link);
  });

  return grouped;
};

const formatLinkType = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export function ExternalLinksSection({
  externalLinks,
}: ExternalLinksSectionData) {
  const links =
    externalLinks?.filter(
      (link): link is ExternalLinkItem => link !== null
    ) || [];

  if (!externalLinks || links.length === 0) {
    return null;
  }

  const groupedLinks = groupLinksByType(links);

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
        <div className="space-y-4">
          {Object.entries(groupedLinks).map(([type, typeLinks]) => (
            <div key={type} className="space-y-2">
              <h3 className="text-sm font-medium">{formatLinkType(type)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {typeLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group"
                    style={{
                      color: link.color ? `#${link.color}` : "inherit",
                    }}
                  >
                    {link.icon ? (
                      <img
                        src={link.icon}
                        alt={link.site}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium group-hover:underline">
                      {link.site}
                    </span>
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
