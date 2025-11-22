/**
 * Permission Caching Utilities
 * 
 * Provides in-memory caching for user permissions to reduce database load in middleware.
 * Uses Edge-compatible in-memory cache with TTL (Time To Live).
 */

import type { Permission } from "@/lib/constants/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

const PERMISSION_CACHE_TTL = 300000; // 5 minutes in milliseconds

interface CacheEntry {
  data: Permission[] | null;
  error: any;
  timestamp: number;
}

// In-memory cache (Edge runtime compatible)
const permissionCache = new Map<string, CacheEntry>();

/**
 * Get cached user permissions or fetch from database
 * Edge runtime compatible - uses in-memory Map cache
 */
export async function getCachedUserPermissions(
  userId: string,
  supabase: SupabaseClient
) {
  const now = Date.now();
  const cached = permissionCache.get(userId);

  // Return cached data if still valid
  if (cached && now - cached.timestamp < PERMISSION_CACHE_TTL) {
    return { data: cached.data, error: cached.error };
  }

  // Fetch fresh data
  const { data, error } = await supabase
    .rpc("get_user_permissions", { user_id: userId });

  if (error) {
    console.error("[CACHE] Error fetching permissions:", error);
    // Cache error response to avoid hammering DB on errors
    permissionCache.set(userId, { data: null, error, timestamp: now });
    return { data: null, error };
  }

  // Cache successful response
  permissionCache.set(userId, { data, error: null, timestamp: now });
  return { data, error: null };
}

/**
 * Invalidate permission cache for a specific user or all users
 * Call this when:
 * - User is added to or removed from a team
 * - Team permissions are modified
 * - User's role changes
 */
export function invalidatePermissionCache(userId?: string) {
  if (userId) {
    // Invalidate specific user's cache
    permissionCache.delete(userId);
  } else {
    // Invalidate all permission caches
    permissionCache.clear();
  }
}

/**
 * Check if user has a specific permission using cached data
 */
export function hasPermissionInCache(
  permissions: Permission[] | null,
  module: string,
  action: string
): boolean {
  if (!permissions || permissions.length === 0) return false;
  
  const perm = permissions.find((p) => p.module_name === module);
  if (!perm) return false;
  
  const actionKey = action as keyof Permission;
  return perm[actionKey] === true;
}
