import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CharactersSectionData } from "./types";

export function CharactersSection({ characters }: CharactersSectionData) {
  if (!characters?.nodes?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Characters</CardTitle>
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
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/225x318?text=No+Image";
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
