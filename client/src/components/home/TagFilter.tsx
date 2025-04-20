import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useFilterStore } from "@/stores/filterStore";
import { X, Search } from "lucide-react";
import { useState, useMemo } from "react";

interface TagFilterProps {
    categorizedTags: Record<string, string[]>;
}

export function TagFilter({ categorizedTags }: TagFilterProps) {
    const selectedTags = useFilterStore((state) => state.selectedTags);
    const addTag = useFilterStore((state) => state.addTag);
    const removeTag = useFilterStore((state) => state.removeTag);
    const clearTags = useFilterStore((state) => state.clearTags);

    const [internalFilterQuery, setInternalFilterQuery] = useState("");

    const handleTagClick = (tag: string) => {
        if (selectedTags.includes(tag)) {
            removeTag(tag);
        } else {
            addTag(tag);
        }
    };

    const filteredCategorizedTags = useMemo(() => {
        if (!internalFilterQuery.trim()) {
            return categorizedTags;
        }

        const query = internalFilterQuery.toLowerCase();
        const result: Record<string, string[]> = {};

        for (const category in categorizedTags) {
            const matchingTags = categorizedTags[category].filter(tag =>
                tag.toLowerCase().includes(query)
            );
            if (matchingTags.length > 0) {
                result[category] = matchingTags;
            }
        }
        return result;
    }, [categorizedTags, internalFilterQuery]);

    const hasCategorizedTags = Object.keys(categorizedTags).length > 0;
    const hasFilteredResults = Object.keys(filteredCategorizedTags).length > 0;

    return (
        <div className="p-4 bg-background rounded-md border max-w-md w-full">
            {selectedTags.length > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium leading-none">Selected Tags</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearTags}
                            className="text-xs h-auto p-1"
                            aria-label="Clear selected tags"
                        >
                            Clear All <X className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag) => (
                            <Badge
                                key={`selected-${tag}`}
                                variant="default"
                                onClick={() => removeTag(tag)}
                                className="cursor-pointer"
                            >
                                {tag} <X className="ml-1 h-3 w-3" />
                            </Badge>
                        ))}
                    </div>
                    <hr className="my-3" />
                </div>
            )}

            <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Filter tags..."
                    value={internalFilterQuery}
                    onChange={(e) => setInternalFilterQuery(e.target.value)}
                    className="pl-8"
                />
                {internalFilterQuery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                        onClick={() => setInternalFilterQuery("")}
                        aria-label="Clear tag filter"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <ScrollArea className="h-72 w-full pr-3">
                {!hasCategorizedTags && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tags found.</p>
                )}
                {!hasFilteredResults && hasCategorizedTags && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tags match your filter.</p>
                )}
                {Object.entries(filteredCategorizedTags).map(([category, tags]) => (
                    <div key={category} className="mb-4">
                        <h5 className="text-sm font-semibold mb-2 sticky top-0 bg-background py-1">{category}</h5>
                        <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <Badge
                                        key={tag}
                                        variant={isSelected ? "default" : "outline"}
                                        onClick={() => handleTagClick(tag)}
                                        className="cursor-pointer transition-colors hover:bg-accent"
                                    >
                                        {tag}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </ScrollArea>
        </div>
    );
} 