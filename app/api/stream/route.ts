import { onNewMessage } from "@/lib/chatStore";

export const runtime = "nodejs"; // Use Node.js runtime for streaming

/**
 * Global Set to track all connected SSE clients
 * Each client is represented by their ReadableStream controller
 */
const activeClients = new Set<ReadableStreamDefaultController<Uint8Array>>();

/**
 * Text encoder for SSE messages
 */
const encoder = new TextEncoder();

/**
 * Broadcast a message to all connected clients
 * @param data - The data to broadcast
 */
function broadcastToClients(data: object) {
  const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(sseMessage);

  activeClients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
      console.log(`[SSE] Broadcast to 1 client (Total clients: ${activeClients.size})`);
    } catch (error) {
      // Client disconnected, will be cleaned up by abort handler
      console.warn(`[SSE] Failed to send to client:`, error instanceof Error ? error.message : String(error));
    }
  });

  console.log(`[SSE] Broadcasted to ${activeClients.size} connected client(s)`);
}

/**
 * Register the broadcast function globally so the webhook can call it
 * (Alternative: Could be imported from chatStore if implemented there)
 */
export { broadcastToClients };

/**
 * Export broadcast function for use by chatStore or webhook
 */
if (typeof globalThis !== "undefined") {
  (globalThis as Record<string, unknown>).__broadcastSSE = broadcastToClients;
}

export async function GET(request: Request) {
  const clientId = crypto.randomUUID();
  console.log(`\n[SSE] ✓ New client connected: ${clientId}`);
  console.log(`[SSE] Current total clients: ${activeClients.size + 1}`);

  // Create the response stream
  const customReadable = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register this client
      activeClients.add(controller);
      console.log(`[SSE] Client registered: ${clientId}`);
      console.log(`[SSE] Active connections: ${activeClients.size}`);

      // Send initial connection confirmation
      const welcomeMessage = `data: ${JSON.stringify({
        type: "connected",
        clientId,
        timestamp: new Date().toISOString(),
        connectedClients: activeClients.size,
      })}\n\n`;
      controller.enqueue(encoder.encode(welcomeMessage));
      console.log(`[SSE] Sent welcome message to ${clientId}`);

      // Subscribe to new messages from chatStore
      console.log(`[SSE] Subscribing ${clientId} to message events`);
      const unsubscribe = onNewMessage(({ userId, message }) => {
        const broadcastData = {
          userId,
          message: {
            id: message.id,
            text: message.text,
            sender: message.sender,
            createdAt: message.createdAt,
          },
        };

        try {
          const sseMessage = `data: ${JSON.stringify(broadcastData)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
          console.log(`[SSE] Message sent to ${clientId}`);
          console.log(`       From: ${userId} | Text: "${message.text.substring(0, 50)}..."`);
        } catch (error) {
          // Connection likely closed, will be cleaned up on abort
          console.warn(`[SSE] Could not send to ${clientId}:`, error instanceof Error ? error.message : "Unknown error");
        }
      });

      // Handle client disconnect
      const cleanup = () => {
        console.log(`\n[SSE] ✗ Client disconnected: ${clientId}`);
        
        // Unsubscribe from message events
        unsubscribe();
        console.log(`[SSE] Unsubscribed from message events`);

        // Remove from active clients
        activeClients.delete(controller);
        console.log(`[SSE] Removed from active clients`);
        console.log(`[SSE] Remaining connections: ${activeClients.size}`);

        // Close the stream
        try {
          controller.close();
        } catch {
          // Already closed, ignore
        }

        console.log(`[SSE] Session ${clientId} cleaned up`);
      };

      // Detect when client closes the connection
      request.signal.addEventListener("abort", cleanup);
      console.log(`[SSE] Abort handler registered for ${clientId}`);
    },

    cancel(reason) {
      console.log(`[SSE] Stream cancelled for unknown client:`, reason);
    },
  });

  return new Response(customReadable, {
    status: 200,
    headers: {
      // Required headers for SSE
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      
      // CORS headers for cross-origin requests
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      
      // Prevent compression which breaks SSE
      "Content-Encoding": "none",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600",
    },
  });
}
