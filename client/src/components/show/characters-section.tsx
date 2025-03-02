import { MediaFragmentFragment } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CharactersSectionProps {
  show: MediaFragmentFragment;
}

export function CharactersSection({ show }: CharactersSectionProps) {
  // Add debug logging
  console.log("Characters data:", show.characters);
  
  if (!show.characters || !show.characters.nodes || !show.characters.nodes.length) {
    console.log("No characters available");
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Characters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {show.characters.nodes.map((character) => {
            if (!character) return null;
            
            return (
              <div key={character.id || `char-${Math.random().toString(36).substr(2, 9)}`} className="space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={character.image?.large || ""}
                    alt={character.name?.full || "Character"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/225x318?text=No+Image";
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
