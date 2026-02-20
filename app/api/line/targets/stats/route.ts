/**
 * LINE Target Statistics Endpoint
 * 
 * Returns statistics about all discovered target IDs (users, groups, rooms)
 * and allows filtering by type.
 * 
 * @route GET /api/line/targets/stats
 * @route GET /api/line/targets/stats?type=user
 * 
 * @example
 * ```bash
 * # Get all statistics
 * curl http://localhost:3000/api/line/targets/stats
 * 
 * # Get only user statistics
 * curl http://localhost:3000/api/line/targets/stats?type=user
 * ```
 */

import { NextResponse } from "next/server";
import { getMessageSourceStats, getMessageSourcesByType } from "@/lib/messageSourceTracker";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/types";

/**
 * Target statistics data
 */
interface TargetStats {
  /** Total unique targets that have messaged */
  total: number;
  /** Individual users who have messaged */
  users: number;
  /** Groups that have messaged */
  groups: number;
  /** Rooms that have messaged */
  rooms: number;
  /** Total messages received from all sources */
  totalMessages: number;
  /** Average messages per target */
  avgMessagesPerTarget: number;
}

/**
 * Response for filtered targets (by type)
 */
interface FilteredTargetStatsResponse {
  /** The filter that was applied */
  filter: "user" | "group" | "room" | "all";
  /** Number of targets matching the filter */
  count: number;
  /** Total messages from targets matching the filter */
  messageCount: number;
  /** Average messages per target in this filter */
  avgMessagesPerTarget: number;
}

/**
 * GET /api/line/targets/stats
 * 
 * Query parameters:
 * - type: Filter by target type ("user", "group", "room")
 */
export async function GET(request: Request): Promise<
  NextResponse<
    ApiSuccessResponse<TargetStats | FilteredTargetStatsResponse> | ApiErrorResponse
  >
> {
  try {
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get("type");

    if (typeFilter && !["user", "group", "room"].includes(typeFilter)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error: 'Invalid type parameter. Must be "user", "group", or "room"',
        },
        { status: 400 }
      );
    }

    if (typeFilter === "user" || typeFilter === "group" || typeFilter === "room") {
      // Return filtered statistics
      const targets = getMessageSourcesByType(typeFilter);
      const messageCount = targets.reduce((sum, target) => sum + target.messageCount, 0);
      const avgMessages = targets.length > 0 ? messageCount / targets.length : 0;

      return NextResponse.json<ApiSuccessResponse<FilteredTargetStatsResponse>>(
        {
          success: true,
          data: {
            filter: typeFilter,
            count: targets.length,
            messageCount,
            avgMessagesPerTarget: Math.round(avgMessages * 100) / 100,
          },
        },
        { status: 200 }
      );
    }

    // Return overall statistics
    const stats = getMessageSourceStats();
    const avgMessages =
      stats.total > 0 ? Math.round((stats.totalMessages / stats.total) * 100) / 100 : 0;

    return NextResponse.json<ApiSuccessResponse<TargetStats>>(
      {
        success: true,
        data: {
          total: stats.total,
          users: stats.users,
          groups: stats.groups,
          rooms: stats.rooms,
          totalMessages: stats.totalMessages,
          avgMessagesPerTarget: avgMessages,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: "Failed to retrieve statistics",
      },
      { status: 500 }
    );
  }
}
