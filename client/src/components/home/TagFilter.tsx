import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useFilterStore } from "@/stores/filterStore";
import { X, Search } from "lucide-react";
import { useState, useMemo } from "react";

interface TagFilterProps {
    categorizedTags: Record<string, string[]>;
}

function formatCategory(category: string): string {
    return category.replace(/-/g, " / ");
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
        <div className="mt-3 w-full rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/55">
            <h2 className="sr-only">Filter by tags</h2>
            {selectedTags.length > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium leading-none">Selected tags</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearTags}
                            className="text-xs h-auto p-1"
                            aria-label="Clear selected tags"
                        >
                            Clear all <X className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag) => (
                            <Button
                                key={`selected-${tag}`}
                                variant="secondary"
                                size="sm"
                                onClick={() => removeTag(tag)}
                                className="min-h-11 rounded-md px-3 font-data text-xs sm:min-h-9"
                                aria-label={`Remove ${tag} filter`}
                            >
                                {tag} <X className="ml-1 h-3 w-3" />
                            </Button>
                        ))}
                    </div>
                    <div className="my-3 h-px bg-border" aria-hidden />
                </div>
            )}

            <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Filter tags..."
                    aria-label="Filter available tags"
                    value={internalFilterQuery}
                    onChange={(e) => setInternalFilterQuery(e.target.value)}
                    className="pl-8"
                />
                {internalFilterQuery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2"
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
                {Object.entries(filteredCategorizedTags).map(([category, tags]) => {
                    const headingId = `tag-category-${category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

                    return (
                    <div key={category} className="mb-5" role="group" aria-labelledby={headingId}>
                        <h3
                            id={headingId}
                            className="mb-3 flex w-full items-center gap-3 text-sm font-semibold"
                        >
                            <span className="shrink-0">{formatCategory(category)}</span>
                            <span className="h-px flex-1 bg-border/70" aria-hidden />
                        </h3>
                        <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <Button
                                        key={tag}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleTagClick(tag)}
                                        aria-pressed={isSelected}
                                        className="min-h-11 rounded-md px-3 font-data text-xs sm:min-h-9"
                                    >
                                        {tag}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    );
                })}
            </ScrollArea>
        </div>
    );
}
