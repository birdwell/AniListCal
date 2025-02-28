// This file patches Vite's HMR client to fix the WebSocket connection issues
// Based on https://github.com/vitejs/vite/issues/2492

if (import.meta.hot) {
  try {
    // Override the WebSocket host to use a fixed port and host
    const originalWebSocket = window.WebSocket;
    
    // Create a proxy WebSocket constructor
    window.WebSocket = function(url, protocols) {
      console.log('WebSocket constructor called with URL:', url);
      
      // Check if this is a Vite HMR WebSocket connection (it will contain ?token=)
      if (typeof url === 'string' && url.includes('?token=') && 
          (url.includes('://localhost:undefined') || url.includes('://[undefined]'))) {
        // Fix the URL by replacing the undefined host with a proper one
        const fixedUrl = url.replace('://localhost:undefined', '://localhost:5001')
                            .replace('://[undefined]', '://localhost:5001');
        
        console.log('Fixed WebSocket URL:', fixedUrl);
        return new originalWebSocket(fixedUrl, protocols);
      }
      
      // For all other WebSocket connections, use the original WebSocket
      return new originalWebSocket(url, protocols);
    };
    
    // Copy all static properties from the original WebSocket
    Object.keys(originalWebSocket).forEach(key => {
      window.WebSocket[key] = originalWebSocket[key];
    });
    
    // Copy prototype
    window.WebSocket.prototype = originalWebSocket.prototype;
    
    console.log('Vite HMR WebSocket patch applied');
  } catch (error) {
    console.error('Failed to patch Vite HMR WebSocket:', error);
  }
}
