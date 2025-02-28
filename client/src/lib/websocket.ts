// WebSocket utility for handling client-side connections
import { queryClient } from "./queryClient";

// Ensure we only have one WebSocket instance
let ws: WebSocket | null = null;
const listeners: Record<string, ((data: any) => void)[]> = {};

// Get the WebSocket URL based on the current window location
export async function getWebsocketUrl(path: string = '/ws/airing'): Promise<string> {
  try {
    // Try to get config from the server first
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      const serverProvidedPath = config.websocketPath || path;
      
      // Use the path from config if available
      path = serverProvidedPath;
    }
  } catch (error) {
    console.warn('Could not fetch config from server, using default values:', error);
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  
  // Explicitly use port 5001 as we know that's what the server is running on
  const port = '5001';
  
  const url = `${protocol}//${host}:${port}${path}`;
  console.log(`Creating WebSocket URL: ${url}`);
  return url;
}

// Setup WebSocket connection with better error handling
export async function setupWebSocket(): Promise<WebSocket> {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return ws;
    }
    
    // Close existing connection if any
    if (ws) {
      try {
        ws.close();
      } catch (err) {
        console.warn('Error closing existing WebSocket:', err);
      }
    }
    
    const url = await getWebsocketUrl();
    console.log(`Connecting to WebSocket: ${url}`);
    
    // Create new WebSocket with error handling
    try {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected!');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type } = data;
          
          // Notify all listeners for this message type
          if (listeners[type]) {
            listeners[type].forEach(callback => callback(data));
          }
          
          // Special handling for certain message types
          if (type === 'airing_update') {
            // Invalidate any relevant queries
            queryClient.invalidateQueries({ queryKey: ['airing'] });
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 5s...');
        setTimeout(async () => {
          try {
            await setupWebSocket();
          } catch (error) {
            console.error('Error in reconnection attempt:', error);
          }
        }, 5000);
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to construct WebSocket:', error);
      throw error;
    }
  } catch (error) {
    console.error('Critical error in setupWebSocket:', error);
    throw error;
  }
}

// Add a listener for a specific message type
export function addWebSocketListener(type: string, callback: (data: any) => void): () => void {
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

// Initialize WebSocket on app start
export function initWebSocket(): void {
  // Only initialize in browser environment
  if (typeof window !== 'undefined') {
    try {
      console.log('Initializing WebSocket connection...');
      console.log('Current window location:', {
        protocol: window.location.protocol,
        host: window.location.host,
        hostname: window.location.hostname,
        port: window.location.port,
        href: window.location.href
      });
      
      // Wait a little bit for the app to initialize fully
      setTimeout(async () => {
        try {
          await setupWebSocket();
        } catch (error) {
          console.error('Error setting up WebSocket:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error during WebSocket initialization:', error);
    }
  }
}

// Send a message through the WebSocket
export function sendWebSocketMessage(type: string, data: any): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return;
  }
  
  ws.send(JSON.stringify({ type, data }));
}
