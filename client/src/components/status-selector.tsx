import { useState, useEffect } from "react";
import { MediaListStatus } from "@/generated/graphql";
import { useUpdateStatus } from "@/hooks/useUpdateStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Clock, ListPlus, Pause, Play, RefreshCw, X } from "lucide-react";

interface StatusSelectorProps {
  mediaId: number;
  currentStatus: MediaListStatus | null;
  className?: string;
  variant?: "default" | "compact";
}

/**
 * Component for selecting and updating the watch status of an anime
 */
export function StatusSelector({
  mediaId,
  currentStatus,
  className = "",
  variant = "default",
}: StatusSelectorProps) {
  const [status, setStatus] = useState<MediaListStatus | null>(currentStatus);
  const { updateStatus, isUpdating } = useUpdateStatus();
  
  // Update local state when props change
  useEffect(() => {
    if (currentStatus !== status) {
      setStatus(currentStatus);
    }
  }, [currentStatus]);

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    const mediaListStatus = newStatus as MediaListStatus;
    setStatus(mediaListStatus);
    
    updateStatus({
      mediaId,
      status: mediaListStatus,
    });
  };

  // Get icon for status
  const getStatusIcon = (status: MediaListStatus | null) => {
    switch (status) {
      case MediaListStatus.Current:
        return <Play className="h-4 w-4" />;
      case MediaListStatus.Completed:
        return <CheckCircle className="h-4 w-4" />;
      case MediaListStatus.Planning:
        return <ListPlus className="h-4 w-4" />;
      case MediaListStatus.Dropped:
        return <X className="h-4 w-4" />;
      case MediaListStatus.Paused:
        return <Pause className="h-4 w-4" />;
      case MediaListStatus.Repeating:
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Format status for display
  const formatStatus = (status: MediaListStatus | null): string => {
    if (!status) return 'Not in List';
    
    switch (status) {
      case MediaListStatus.Current:
        return 'Watching';
      case MediaListStatus.Completed:
        return 'Completed';
      case MediaListStatus.Planning:
        return 'Plan to Watch';
      case MediaListStatus.Dropped:
        return 'Dropped';
      case MediaListStatus.Paused:
        return 'Paused';
      case MediaListStatus.Repeating:
        return 'Rewatching';
      default:
        return status;
    }
  };

  return (
    <Select
      value={status || ""}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger 
        className={`${className} ${variant === "compact" ? "h-8 text-xs" : ""}`}
      >
        <SelectValue placeholder="Set Status">
          <div className="flex items-center gap-2">
            {status && getStatusIcon(status)}
            <span>{formatStatus(status)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={MediaListStatus.Current}>
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            <span>Watching</span>
          </div>
        </SelectItem>
        <SelectItem value={MediaListStatus.Completed}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Completed</span>
          </div>
        </SelectItem>
        <SelectItem value={MediaListStatus.Planning}>
          <div className="flex items-center gap-2">
            <ListPlus className="h-4 w-4" />
            <span>Plan to Watch</span>
          </div>
        </SelectItem>
        <SelectItem value={MediaListStatus.Paused}>
          <div className="flex items-center gap-2">
            <Pause className="h-4 w-4" />
            <span>Paused</span>
          </div>
        </SelectItem>
        <SelectItem value={MediaListStatus.Dropped}>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4" />
            <span>Dropped</span>
          </div>
        </SelectItem>
        <SelectItem value={MediaListStatus.Repeating}>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Rewatching</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
