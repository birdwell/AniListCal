import { useState } from "react";
import { MediaListStatus } from "@/generated/graphql";
import { useUpdateStatus } from "@/hooks/useUpdateStatus";
import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, CheckCircle, Pause, X, RefreshCw } from "lucide-react";

interface AddToListButtonProps {
  mediaId: number;
  className?: string;
}

/**
 * Button to add an anime to the user's list with a specific status
 */
export function AddToListButton({ mediaId, className = "" }: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { updateStatus, isUpdating } = useUpdateStatus();

  const handleAddToList = (status: MediaListStatus) => {
    updateStatus({
      mediaId,
      status,
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className={className} 
          disabled={isUpdating}
          variant="outline"
        >
          <ListPlus className="h-4 w-4 mr-2" />
          Add to List
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAddToList(MediaListStatus.Current)}>
          <Play className="h-4 w-4 mr-2" />
          <span>Watching</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToList(MediaListStatus.Planning)}>
          <ListPlus className="h-4 w-4 mr-2" />
          <span>Plan to Watch</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToList(MediaListStatus.Completed)}>
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Completed</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToList(MediaListStatus.Paused)}>
          <Pause className="h-4 w-4 mr-2" />
          <span>Paused</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToList(MediaListStatus.Dropped)}>
          <X className="h-4 w-4 mr-2" />
          <span>Dropped</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToList(MediaListStatus.Repeating)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          <span>Rewatching</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
