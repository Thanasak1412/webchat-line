/**
 * LINE Target ID Discovery Endpoint
 * 
 * This endpoint returns all target IDs (users, groups, rooms) that have
 * interacted with your bot, discovered from webhook events.
 * 
 * Useful for:
 * - Finding what user IDs have sent you messages
 * - Identifying group/room IDs for bulk messaging
 * - Debugging webhook events
 * 
 * @route GET /api/line/targets
 * 
 * @example
 * ```bash
 * curl http://localhost:3000/api/line/targets
 * ```
 * 
 * Response (200 OK):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "configured": {
 *       "id": "Uab12345...",
 *       "type": "user",
 *       "isValid": true
 *     },
 *     "discovered": [
 *       {
 *         "id": "Uab12345...",
 *         "type": "user",
 *         "discoveredAt": "2026-02-20T10:30:00.000Z",
 *         "lastMessageAt": "2026-02-20T10:35:00.000Z",
 *         "messageCount": 5
 *       }
 *     ],
 *     "stats": {
 *       "total": 1,
 *       "users": 1,
 *       "groups": 0,
 *       "rooms": 0,
 *       "totalMessages": 5
 *     }
 *   }
 * }
 * ```
 */

import { NextResponse } from "next/server";
import {
  getConfiguredTargetId,
  getTargetTypeFromId,
  isValidLineId,
  type LineTargetType,
} from "@/lib/lineTargetId";
import {
  getAllMessageSources,
  getMessageSourceStats,
  type MessageSource,
} from "@/lib/messageSourceTracker";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/types";

/**
 * Information about configured target
 */
interface ConfiguredTarget {
  /** The configured target ID */
  id: string | null;
  /** Type of target (user/group/room) */
  type: LineTargetType | null;
  /** Whether the ID format is valid */
  isValid: boolean;
}

/**
 * Statistics about discovered targets
 */
interface DiscoveryStats {
  /** Total unique targets */
  total: number;
  /** Unique users */
  users: number;
  /** Unique groups */
  groups: number;
  /** Unique rooms */
  rooms: number;
  /** Total messages received */
  totalMessages: number;
}

/**
 * Response data for targets endpoint
 */
interface TargetsData {
  /** The configured target ID from environment */
  configured: ConfiguredTarget;
  /** Target IDs discovered from webhook events */
  discovered: MessageSource[];
  /** Statistics about discovered targets */
  stats: DiscoveryStats;
}

/**
 * GET /api/line/targets
 * 
 * Returns:
 * - Configured target ID from environment variables
 * - All target IDs discovered from webhook events
 * - Statistics about the discovered targets
 */
export async function GET(): Promise<
  NextResponse<ApiSuccessResponse<TargetsData> | ApiErrorResponse>
> {
  try {
    // Get configured target ID
    const configuredId = getConfiguredTargetId();
    const configuredType = configuredId ? getTargetTypeFromId(configuredId) : null;
    const isConfiguredValid = configuredId ? isValidLineId(configuredId) : true;

    const configured: ConfiguredTarget = {
      id: configuredId,
      type: configuredType,
      isValid: isConfiguredValid,
    };

    // Get discovered targets
    const discovered = getAllMessageSources();

    // Get statistics
    const stats = getMessageSourceStats();

    return NextResponse.json<ApiSuccessResponse<TargetsData>>(
      {
        success: true,
        data: {
          configured,
          discovered,
          stats,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: "Failed to retrieve target information",
      },
      { status: 500 }
    );
  }
}
