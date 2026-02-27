/**
 * LINE User Profile Cache
 * 
 * Caches user profile data in-memory to avoid refetching
 * the same profile info repeatedly during a session
 */

interface CachedProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const profileCache = new Map<string, CachedProfile>();

/**
 * Get a cached profile if it exists and is fresh
 */
export function getCachedProfile(userId: string): CachedProfile | null {
  const cached = profileCache.get(userId);
  if (!cached) return null;

  const age = Date.now() - cached.fetchedAt;
  if (age > CACHE_TTL_MS) {
    profileCache.delete(userId);
    return null;
  }

  return cached;
}

/**
 * Store a profile in the cache
 */
export function setCachedProfile(profile: CachedProfile): void {
  profileCache.set(profile.userId, profile);
}

/**
 * Fetch and cache a user profile
 * Returns cached version if available and fresh
 */
export async function fetchUserProfile(userId: string): Promise<CachedProfile | null> {
  // Check cache first
  const cached = getCachedProfile(userId);
  if (cached) return cached;

  try {
    const response = await fetch(`/api/line/profile?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return null;

    const { success, data } = (await response.json()) as {
      success: boolean;
      data?: CachedProfile;
    };

    if (!success || !data) return null;

    // Add fetchedAt timestamp
    const profile = { ...data, fetchedAt: Date.now() };
    setCachedProfile(profile);
    return profile;
  } catch {
    return null;
  }
}

/**
 * Clear the entire cache (useful for testing)
 */
export function clearProfileCache(): void {
  profileCache.clear();
}
