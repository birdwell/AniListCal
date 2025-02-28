import { MediaFragmentFragment } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CharactersSectionProps {
  show: MediaFragmentFragment;
}

export function CharactersSection({ show }: CharactersSectionProps) {
  if (!show.characters?.nodes?.length) {
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
              <div key={character.id} className="space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={character.image?.large || ""}
                    alt={character.name?.full || ""}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium line-clamp-1">
                    {character.name?.full}
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
