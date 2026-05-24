/**
 * Unified Database Layer for veo-cli
 *
 * Provides a single interface that can use either:
 * - SQLite (local, default) - for offline/development use
 * - Convex (cloud) - for multi-device sync and collaboration
 *
 * Selection is based on CONVEX_URL environment variable.
 */

import * as sqlite from "./db";
import * as convex from "./db-convex";

// Re-export types
export type BatchStatus = sqlite.BatchStatus;
export type JobStatus = sqlite.JobStatus;
export type Batch = sqlite.Batch | convex.Batch;
export type Job = sqlite.Job | convex.Job;
export type BatchStats = sqlite.BatchStats;
export type UseApiHistoryStatus = sqlite.UseApiHistoryStatus;
export type UseApiHistoryEntry = sqlite.UseApiHistoryEntry | convex.UseApiHistoryEntry;

// Determine which backend to use
const useConvex = (): boolean => {
  return convex.isConvexEnabled();
};

/**
 * Initialize the database
 * For SQLite: creates tables
 * For Convex: establishes connection and gets/creates user
 */
export async function initDB(email?: string): Promise<void> {
  if (useConvex()) {
    await convex.initConvex(email);
    console.log("📡 Using Convex cloud database");
  } else {
    sqlite.initDB();
    console.log("💾 Using local SQLite database");
  }
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (useConvex()) {
    convex.closeConvex();
  } else {
    sqlite.closeDB();
  }
}

/**
 * Generate MD5 hash of prompts content
 */
export function hashPrompts(content: string): string {
  return sqlite.hashPrompts(content); // Same implementation
}

/**
 * Check if using Convex backend
 */
export function isUsingConvex(): boolean {
  return useConvex();
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Create a new batch
 */
export async function createBatch(
  promptsFile: string,
  promptsHash: string,
  totalJobs: number,
  options?: {
    backend?: "direct" | "useapi";
    quality?: "free" | "fast" | "quality" | "veo2";
    aspectRatio?: "16:9" | "9:16" | "1:1";
  }
): Promise<string | number> {
  if (useConvex()) {
    return await convex.createBatch(promptsFile, promptsHash, totalJobs, options);
  } else {
    return sqlite.createBatch(promptsFile, promptsHash, totalJobs);
  }
}

/**
 * Get batch by ID
 */
export async function getBatch(id: string | number): Promise<Batch | null> {
  if (useConvex()) {
    return await convex.getBatch(String(id));
  } else {
    return sqlite.getBatch(Number(id));
  }
}

/**
 * Get active (running or pending) batch for a prompts file
 */
export async function getActiveBatch(
  promptsFile: string,
  promptsHash: string
): Promise<Batch | null> {
  if (useConvex()) {
    return await convex.getActiveBatch(promptsFile, promptsHash);
  } else {
    return sqlite.getActiveBatch(promptsFile, promptsHash);
  }
}

/**
 * Get the most recent incomplete batch
 */
export async function getMostRecentIncompleteBatch(): Promise<Batch | null> {
  if (useConvex()) {
    return await convex.getMostRecentIncompleteBatch();
  } else {
    return sqlite.getMostRecentIncompleteBatch();
  }
}

/**
 * Update batch status
 */
export async function updateBatchStatus(
  batchId: string | number,
  status: sqlite.BatchStatus,
  projectId?: string
): Promise<void> {
  if (useConvex()) {
    await convex.updateBatchStatus(String(batchId), status, projectId);
  } else {
    sqlite.updateBatchStatus(Number(batchId), status, projectId);
  }
}

/**
 * Update batch job counts
 */
export async function updateBatchCounts(batchId: string | number): Promise<void> {
  if (useConvex()) {
    await convex.updateBatchCounts(String(batchId));
  } else {
    sqlite.updateBatchCounts(Number(batchId));
  }
}

// ============================================================================
// JOB OPERATIONS
// ============================================================================

/**
 * Create jobs for a batch
 */
export async function createJobs(
  batchId: string | number,
  prompts: Array<{
    index: number;
    text: string;
    type: string;
    tag: string | null;
  }>
): Promise<void> {
  if (useConvex()) {
    await convex.createJobs(String(batchId), prompts);
  } else {
    sqlite.createJobs(Number(batchId), prompts);
  }
}

/**
 * Get job by ID
 */
export async function getJob(id: string | number): Promise<Job | null> {
  if (useConvex()) {
    return await convex.getJob(String(id));
  } else {
    return sqlite.getJob(Number(id));
  }
}

/**
 * Get all jobs for a batch
 */
export async function getBatchJobs(batchId: string | number): Promise<Job[]> {
  if (useConvex()) {
    return await convex.getBatchJobs(String(batchId));
  } else {
    return sqlite.getBatchJobs(Number(batchId));
  }
}

/**
 * Get pending jobs for a batch
 */
export async function getPendingJobs(batchId: string | number): Promise<Job[]> {
  if (useConvex()) {
    return await convex.getPendingJobs(String(batchId));
  } else {
    return sqlite.getPendingJobs(Number(batchId));
  }
}

/**
 * Update job status to running
 */
export async function startJob(
  jobId: string | number,
  useapiJobId?: string
): Promise<void> {
  if (useConvex()) {
    await convex.startJob(String(jobId), useapiJobId);
  } else {
    sqlite.startJob(Number(jobId));
  }
}

/**
 * Mark job as completed
 */
export async function completeJob(
  jobId: string | number,
  videoPath: string,
  durationMs: number,
  creditsUsed: number = 10,
  options?: {
    videoUrl?: string;
    mediaId?: string;
    altVideoPath?: string;
    altVideoUrl?: string;
    altMediaId?: string;
    captchaCreditsUsed?: number;
  }
): Promise<void> {
  if (useConvex()) {
    await convex.completeJob(String(jobId), videoPath, durationMs, creditsUsed, options);
  } else {
    sqlite.completeJob(Number(jobId), videoPath, durationMs, creditsUsed);
  }
}

/**
 * Mark job as failed
 */
export async function failJob(
  jobId: string | number,
  errorMessage: string
): Promise<void> {
  if (useConvex()) {
    await convex.failJob(String(jobId), errorMessage);
  } else {
    sqlite.failJob(Number(jobId), errorMessage);
  }
}

/**
 * Get batch statistics
 */
export async function getBatchStats(batchId: string | number): Promise<sqlite.BatchStats> {
  if (useConvex()) {
    return await convex.getBatchStats(String(batchId));
  } else {
    return sqlite.getBatchStats(Number(batchId));
  }
}

/**
 * List all batches
 */
export async function listBatches(limit: number = 20): Promise<Batch[]> {
  if (useConvex()) {
    return await convex.listBatches(limit);
  } else {
    return sqlite.listBatches(limit);
  }
}

/**
 * Get job history across all batches
 */
export async function getJobHistory(
  limit: number = 20
): Promise<Array<Job & { batch_prompts_file: string }>> {
  if (useConvex()) {
    return await convex.getJobHistory(limit);
  } else {
    return sqlite.getJobHistory(limit);
  }
}

/**
 * Reset failed jobs in a batch to pending
 */
export async function resetFailedJobs(batchId: string | number): Promise<number> {
  if (useConvex()) {
    return await convex.resetFailedJobs(String(batchId));
  } else {
    return sqlite.resetFailedJobs(Number(batchId));
  }
}

/**
 * Cancel a batch and all pending jobs
 */
export async function cancelBatch(batchId: string | number): Promise<void> {
  if (useConvex()) {
    await convex.cancelBatch(String(batchId));
  } else {
    sqlite.cancelBatch(Number(batchId));
  }
}

/**
 * Check if all jobs in a batch are complete
 */
export async function isBatchComplete(batchId: string | number): Promise<boolean> {
  if (useConvex()) {
    return await convex.isBatchComplete(String(batchId));
  } else {
    return sqlite.isBatchComplete(Number(batchId));
  }
}

/**
 * Mark batch as completed if all jobs are done
 */
export async function checkAndCompleteBatch(batchId: string | number): Promise<void> {
  if (useConvex()) {
    await convex.checkAndCompleteBatch(String(batchId));
  } else {
    sqlite.checkAndCompleteBatch(Number(batchId));
  }
}

/**
 * Get average job duration from completed jobs (for ETA estimates)
 * Returns average in milliseconds, or default if no data available
 */
export async function getAverageJobDuration(defaultMs: number = 90_000): Promise<number> {
  // Currently only SQLite tracks duration - Convex would need separate implementation
  return sqlite.getAverageJobDuration(defaultMs);
}

// ============================================================================
// useapi.net History Tracking
// ============================================================================

/**
 * Record a useapi.net job result
 */
export async function recordUseApiHistory(
  entry: Omit<sqlite.UseApiHistoryEntry, "id" | "timestamp">
): Promise<string | number> {
  if (useConvex()) {
    return await convex.recordUseApiHistory(entry);
  } else {
    return sqlite.recordUseApiHistory(entry);
  }
}

/**
 * Get recent useapi.net history entries
 */
export async function getUseApiHistory(
  limit: number = 100
): Promise<UseApiHistoryEntry[]> {
  if (useConvex()) {
    return await convex.getUseApiHistory(limit);
  } else {
    return sqlite.getUseApiHistory(limit);
  }
}

/**
 * Get useapi.net history stats for last N hours
 */
export async function getUseApiStats(hours: number = 24): Promise<{
  success: number;
  failed: number;
  rateLimited: number;
  timeout: number;
  totalCost: number;
  avgDurationMs: number | null;
}> {
  if (useConvex()) {
    return await convex.getUseApiStats(hours);
  } else {
    return sqlite.getUseApiStats(hours);
  }
}

/**
 * Clean up old useapi.net history entries
 */
export async function cleanupUseApiHistory(daysToKeep: number = 30): Promise<number> {
  if (useConvex()) {
    return await convex.cleanupUseApiHistory(daysToKeep);
  } else {
    return sqlite.cleanupUseApiHistory(daysToKeep);
  }
}

// ============================================================================
// IMAGE UPLOAD CACHE
// ============================================================================

// Re-export image cache type
export type { ImageCacheEntry } from "./db";

/**
 * Get cached mediaId for an image file hash
 * Note: Image cache is SQLite-only (local optimization)
 */
export function getImageCache(
  fileHash: string,
  aspectRatio: "landscape" | "portrait",
  backend: "direct" | "useapi"
): sqlite.ImageCacheEntry | null {
  return sqlite.getImageCache(fileHash, aspectRatio, backend);
}

/**
 * Store a mediaId in the image cache
 * Note: Image cache is SQLite-only (local optimization)
 */
export function setImageCache(
  entry: Omit<sqlite.ImageCacheEntry, "id" | "created_at" | "last_used_at">
): number {
  return sqlite.setImageCache(entry);
}

/**
 * Get image cache statistics
 */
export function getImageCacheStats(): {
  totalEntries: number;
  directEntries: number;
  useapiEntries: number;
  totalSizeBytes: number;
} {
  return sqlite.getImageCacheStats();
}

/**
 * Clean up old image cache entries
 */
export function cleanupImageCache(keepPerBackend: number = 500): number {
  return sqlite.cleanupImageCache(keepPerBackend);
}

/**
 * Hash file contents for cache lookup
 */
export function hashFileContents(content: ArrayBuffer): string {
  return sqlite.hashFileContents(content);
}

// ============================================================================
// SYNC UTILITIES (Convex-specific)
// ============================================================================

/**
 * Sync local SQLite data to Convex (migration utility)
 */
export async function syncToConvex(): Promise<{
  batches: number;
  jobs: number;
}> {
  if (!useConvex()) {
    throw new Error("Convex is not configured. Set CONVEX_URL to enable.");
  }

  // Initialize Convex client
  await convex.initConvex();

  // Initialize SQLite to read from it
  sqlite.initDB();

  // Get all batches from SQLite
  const localBatches = sqlite.listBatches(1000);
  let batchCount = 0;
  let jobCount = 0;

  for (const localBatch of localBatches) {
    // Create batch in Convex
    const convexBatchId = await convex.createBatch(
      localBatch.prompts_file,
      localBatch.prompts_hash,
      localBatch.total_jobs
    );

    // Get jobs for this batch
    const localJobs = sqlite.getBatchJobs(localBatch.id);

    // Create jobs in Convex
    await convex.createJobs(
      convexBatchId,
      localJobs.map((j) => ({
        index: j.prompt_index,
        text: j.prompt_text,
        type: j.prompt_type,
        tag: j.tag,
      }))
    );

    // Update job statuses
    const convexJobs = await convex.getBatchJobs(convexBatchId);
    for (let i = 0; i < localJobs.length; i++) {
      const localJob = localJobs[i];
      if (!localJob) continue;
      const convexJob = convexJobs.find((j) => j.prompt_index === localJob.prompt_index);

      if (convexJob && localJob.status !== "pending") {
        if (localJob.status === "completed" && localJob.video_path) {
          await convex.completeJob(
            convexJob.id,
            localJob.video_path,
            localJob.duration_ms || 0,
            localJob.credits_used || 10
          );
        } else if (localJob.status === "failed") {
          await convex.failJob(convexJob.id, localJob.error_message || "Unknown error");
        }
      }
    }

    // Update batch status
    await convex.updateBatchStatus(convexBatchId, localBatch.status);

    batchCount++;
    jobCount += localJobs.length;
  }

  sqlite.closeDB();

  return { batches: batchCount, jobs: jobCount };
}
