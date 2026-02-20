/**
 * LINE Push Message API Endpoint (Alias)
 * 
 * This is an alternative endpoint for pushing messages to a LINE OA.
 * It re-exports the POST handler from /api/send-message.
 * 
 * Endpoint: POST /api/line/push
 * Alternative: POST /api/send-message
 * 
 * Request: JSON { message: string }
 * Response: { success: true } | { success: false, error: string }
 */
export { POST } from "../../send-message/route";