import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CharactersSectionData } from "./types";

export function CharactersSection({ characters }: CharactersSectionData) {
  if (!characters?.nodes?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-xl font-semibold">Characters</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {characters.nodes.map((character) => {
            if (!character) return null;

            return (
              <div key={character.id} className="space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={character.image?.large || ""}
                    alt={character.name?.full || "Character"}
                    width="225"
                    height="300"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium line-clamp-1">
                    {character.name?.full || "Unknown Character"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
