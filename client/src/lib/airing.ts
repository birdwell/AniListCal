// This file was renamed from websocket.ts to airing.ts
// Now uses a polling-based approach instead of WebSockets for better reliability

import { queryClient } from './queryClient';
import { useQuery } from '@tanstack/react-query';

// Types for our airing data
export interface AiringUpdate {
  type: string;
  data: AiringShow[];
}

export interface AiringShow {
  id: number;
  title: string;
  status: string;
  episodes?: number;
  mediaListEntry?: {
    status: string;
    progress: number;
  };
  nextAiringEpisode?: {
    timeUntilAiring: number;
    episode: number;
    airingAt: number;
  };
}

// Cache of listeners for specific message types
const listeners: Record<string, ((data: any) => void)[]> = {};

// Fetch airing updates from the server
export async function fetchAiringUpdates(): Promise<AiringUpdate> {
  try {
    // Use the new endpoint
    const response = await fetch('/api/anime/airing');
    if (!response.ok) {
      throw new Error(`Failed to fetch airing updates: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching airing updates:', error);
    return { type: 'airing_update', data: [] };
  }
}

// React Query hook for airing updates
export function useAiringUpdates(options = { enabled: true, refetchInterval: 60000 }) {
  return useQuery({
    queryKey: ['airing-updates'],
    queryFn: fetchAiringUpdates,
    ...options
  });
}

// Add a listener for a specific message type
export function addListener(type: string, callback: (data: any) => void): () => void {
  if (!listeners[type]) {
    listeners[type] = [];
  }
  
  listeners[type].push(callback);
  
  // Return a function to remove this listener
  return () => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter(cb => cb !== callback);
    }
  };
}

// Initialize polling on app start
export function initAiringUpdates(): void {
  if (typeof window !== 'undefined') {
    try {
      console.log('Initializing airing updates polling...');
      
      // Start polling immediately
      queryClient.prefetchQuery({
        queryKey: ['airing-updates'],
        queryFn: fetchAiringUpdates,
      });
      
      // Set up interval refetching for real-time updates
      const intervalId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['airing-updates'] });
      }, 60000); // Refresh every minute
      
      // Clean up on window unload
      window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
      });
    } catch (error) {
      console.error('Error initializing airing updates:', error);
    }
  }
}
