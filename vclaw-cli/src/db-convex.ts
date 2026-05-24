/**
 * Convex Database Layer for veo-cli
 * Cloud-based job tracking with real-time sync
 *
 * This module provides the same interface as db.ts but uses Convex instead of SQLite.
 * Use CONVEX_URL environment variable to enable Convex; falls back to SQLite if not set.
 *
 * NOTE: Convex imports are lazy-loaded to avoid errors when generated files don't exist.
 */

import { createHash } from "crypto";

// Lazy-loaded Convex types and client
let ConvexHttpClient: typeof import("convex/browser").ConvexHttpClient;
let api: any;

type Id<TableName extends string> = string & { readonly __tableName?: TableName };
type ConvexDocument<TableName extends string> = Record<string, any> & {
  _id: Id<TableName>;
};

// Types (matching db.ts interface)
export type BatchStatus = "pending" | "running" | "completed" | "cancelled";
export type JobStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface Batch {
  id: string; // Convex uses string IDs
  prompts_file: string;
  prompts_hash: string;
  project_id: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
}

export interface Job {
  id: string; // Convex uses string IDs
  batch_id: string;
  prompt_index: number;
  prompt_text: string;
  prompt_type: string;
  tag: string | null;
  status: JobStatus;
  video_path: string | null;
  error_message: string | null;
  credits_used: number | null;
  duration_ms: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface BatchStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  skipped: number;
}

export type UseApiHistoryStatus = "success" | "failed" | "rate_limited" | "timeout";

export interface UseApiHistoryEntry {
  id?: string;
  timestamp: string;
  job_id: string;
  backend: string;
  status: UseApiHistoryStatus;
  duration_ms: number | null;
  error_message: string | null;
  cost: number | null;
}

// Client singleton
let client: any = null; // Type is ConvexHttpClient but lazy-loaded
let userId: any = null; // Type is Id<"users"> but lazy-loaded

/**
 * Lazy-load Convex dependencies
 * This allows the module to be imported even if Convex generated files don't exist
 */
async function loadConvexDeps(): Promise<void> {
  if (!ConvexHttpClient) {
    const convexModule = await import("convex/browser");
    ConvexHttpClient = convexModule.ConvexHttpClient;
  }
  if (!api) {
    try {
      const generatedApiPath = "../../convex/_generated/api";
      const apiModule = await import(generatedApiPath);
      api = apiModule.api;
    } catch (e) {
      throw new Error(
        "Convex API not generated. Run 'cd convex && npx convex deploy' first."
      );
    }
  }
}

/**
 * Get the Convex client (creates if needed)
 */
async function getClient(): Promise<any> {
  if (!client) {
    await loadConvexDeps();
    const url = process.env.CONVEX_URL;
    if (!url) {
      throw new Error("CONVEX_URL environment variable not set");
    }
    client = new ConvexHttpClient(url);
  }
  return client;
}

/**
 * Check if Convex is configured
 */
export function isConvexEnabled(): boolean {
  return !!process.env.CONVEX_URL;
}

/**
 * Initialize Convex connection and get/create user
 */
export async function initConvex(email?: string): Promise<void> {
  const c = await getClient();

  // Get or create user based on email or a default identifier
  const userEmail = email || process.env.USER_EMAIL || `cli-user@${require("os").hostname()}`;

  userId = await c.mutation(api.mutations.users.getOrCreate, {
    externalId: `cli:${userEmail}`,
    email: userEmail,
    name: "veo-cli User",
  });
}

/**
 * Get the current user ID (throws if not initialized)
 */
function getUserId(): Id<"users"> {
  if (!userId) {
    throw new Error("Convex not initialized. Call initConvex() first.");
  }
  return userId;
}

/**
 * Close Convex connection (no-op for HTTP client)
 */
export function closeConvex(): void {
  client = null;
  userId = null;
}

/**
 * Generate MD5 hash of prompts content
 */
export function hashPrompts(content: string): string {
  return createHash("md5").update(content).digest("hex");
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
    projectId?: Id<"projects">;
  }
): Promise<string> {
  const c = await getClient();

  const batchId = await c.mutation(api.mutations.batches.create, {
    userId: getUserId(),
    projectId: options?.projectId,
    backend: options?.backend || "direct",
    quality: options?.quality || "fast",
    aspectRatio: options?.aspectRatio || "16:9",
    promptsFile,
    promptsHash,
    totalJobs,
  });

  return batchId;
}

/**
 * Get batch by ID
 */
export async function getBatch(id: string): Promise<Batch | null> {
  const c = await getClient();
  const batch = await c.query(api.queries.batches.get, {
    batchId: id as Id<"batches">,
  });

  if (!batch) return null;

  return convexBatchToLocal(batch);
}

/**
 * Get active (running or pending) batch for a prompts hash
 */
export async function getActiveBatch(
  promptsFile: string,
  promptsHash: string
): Promise<Batch | null> {
  const c = await getClient();

  // Find by prompts hash
  const batch = await c.query(api.queries.batches.findByPromptsHash, {
    promptsHash,
  });

  if (!batch) return null;
  if (batch.status !== "pending" && batch.status !== "running") return null;

  return convexBatchToLocal(batch);
}

/**
 * Get the most recent incomplete batch
 */
export async function getMostRecentIncompleteBatch(): Promise<Batch | null> {
  const c = await getClient();

  const batches = await c.query(api.queries.batches.getResumableBatches, {
    userId: getUserId(),
  });

  if (batches.length === 0) return null;

  // Return most recently updated
  const sorted = batches.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  const latest = sorted[0];
  return latest ? convexBatchToLocal(latest) : null;
}

/**
 * Update batch status
 */
export async function updateBatchStatus(
  batchId: string,
  status: BatchStatus,
  projectId?: string
): Promise<void> {
  const c = await getClient();

  if (status === "running") {
    await c.mutation(api.mutations.batches.start, {
      batchId: batchId as Id<"batches">,
    });
  } else if (status === "completed") {
    await c.mutation(api.mutations.batches.complete, {
      batchId: batchId as Id<"batches">,
    });
  } else if (status === "cancelled") {
    await c.mutation(api.mutations.batches.cancel, {
      batchId: batchId as Id<"batches">,
    });
  } else if (status === "pending") {
    // Reset to pending - use updateCounts
    await c.mutation(api.mutations.batches.updateCounts, {
      batchId: batchId as Id<"batches">,
    });
  }
}

/**
 * Update batch job counts (recalculated automatically in Convex)
 */
export async function updateBatchCounts(batchId: string): Promise<void> {
  // In Convex, counts are updated automatically when jobs change
  // This is a no-op but kept for API compatibility
}

// ============================================================================
// JOB OPERATIONS
// ============================================================================

/**
 * Create jobs for a batch
 */
export async function createJobs(
  batchId: string,
  prompts: Array<{
    index: number;
    text: string;
    type: string;
    tag: string | null;
  }>
): Promise<void> {
  const c = await getClient();

  await c.mutation(api.mutations.batches.createJobs, {
    batchId: batchId as Id<"batches">,
    userId: getUserId(),
    jobs: prompts.map((p) => ({
      promptIndex: p.index,
      promptText: p.text,
      promptType: p.type as "text" | "image" | "frames" | "ingredients",
      tag: p.tag || undefined,
    })),
  });
}

/**
 * Get job by ID
 */
export async function getJob(id: string): Promise<Job | null> {
  const c = await getClient();
  const job = await c.query(api.queries.batches.getJob, {
    jobId: id as Id<"jobs">,
  });

  if (!job) return null;
  return convexJobToLocal(job);
}

/**
 * Get all jobs for a batch
 */
export async function getBatchJobs(batchId: string): Promise<Job[]> {
  const c = await getClient();
  const jobs = await c.query(api.queries.batches.listJobsByBatch, {
    batchId: batchId as Id<"batches">,
  });

  return jobs.map(convexJobToLocal).sort((a: Job, b: Job) => a.prompt_index - b.prompt_index);
}

/**
 * Get pending jobs for a batch
 */
export async function getPendingJobs(batchId: string): Promise<Job[]> {
  const c = await getClient();
  const jobs = await c.query(api.queries.batches.getPendingJobs, {
    batchId: batchId as Id<"batches">,
  });

  return jobs.map(convexJobToLocal).sort((a: Job, b: Job) => a.prompt_index - b.prompt_index);
}

/**
 * Update job status to running
 */
export async function startJob(
  jobId: string,
  useapiJobId?: string
): Promise<void> {
  const c = await getClient();
  await c.mutation(api.mutations.batches.startJob, {
    jobId: jobId as Id<"jobs">,
    useapiJobId,
  });
}

/**
 * Mark job as completed
 */
export async function completeJob(
  jobId: string,
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
  const c = await getClient();
  await c.mutation(api.mutations.batches.completeJob, {
    jobId: jobId as Id<"jobs">,
    videoPath,
    videoUrl: options?.videoUrl,
    mediaId: options?.mediaId,
    altVideoPath: options?.altVideoPath,
    altVideoUrl: options?.altVideoUrl,
    altMediaId: options?.altMediaId,
    creditsUsed,
    captchaCreditsUsed: options?.captchaCreditsUsed,
    durationMs,
  });
}

/**
 * Mark job as failed
 */
export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  const c = await getClient();
  await c.mutation(api.mutations.batches.failJob, {
    jobId: jobId as Id<"jobs">,
    errorMessage,
  });
}

/**
 * Get batch statistics
 */
export async function getBatchStats(batchId: string): Promise<BatchStats> {
  const c = await getClient();
  const jobs = await c.query(api.queries.batches.listJobsByBatch, {
    batchId: batchId as Id<"batches">,
  });

  const stats: BatchStats = {
    total: jobs.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const job of jobs) {
    switch (job.status) {
      case "pending":
        stats.pending++;
        break;
      case "running":
        stats.running++;
        break;
      case "completed":
        stats.completed++;
        break;
      case "failed":
        stats.failed++;
        break;
      case "skipped":
        stats.skipped++;
        break;
    }
  }

  return stats;
}

/**
 * List all batches
 */
export async function listBatches(limit: number = 20): Promise<Batch[]> {
  const c = await getClient();
  const batches = await c.query(api.queries.batches.listByUser, {
    userId: getUserId(),
    limit,
  });

  return batches.map(convexBatchToLocal);
}

/**
 * Get job history across all batches
 */
export async function getJobHistory(
  limit: number = 20
): Promise<Array<Job & { batch_prompts_file: string }>> {
  const c = await getClient();

  // Get recent batches and their jobs
  const batches = await c.query(api.queries.batches.listByUser, {
    userId: getUserId(),
    limit: 10,
  });

  const allJobs: Array<Job & { batch_prompts_file: string }> = [];

  for (const batch of batches) {
    const jobs = await c.query(api.queries.batches.listJobsByBatch, {
      batchId: batch._id,
    });

    for (const job of jobs) {
      allJobs.push({
        ...convexJobToLocal(job),
        batch_prompts_file: batch.promptsFile || "",
      });
    }
  }

  // Sort by completion/creation time and limit
  return allJobs
    .sort((a, b) => {
      const aTime = a.completed_at || a.created_at;
      const bTime = b.completed_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    })
    .slice(0, limit);
}

/**
 * Reset failed jobs in a batch to pending
 */
export async function resetFailedJobs(batchId: string): Promise<number> {
  const c = await getClient();
  const result = await c.mutation(api.mutations.batches.resetFailedJobs, {
    batchId: batchId as Id<"batches">,
  });
  return result.resetCount;
}

/**
 * Cancel a batch and all pending jobs
 */
export async function cancelBatch(batchId: string): Promise<void> {
  const c = await getClient();
  await c.mutation(api.mutations.batches.cancel, {
    batchId: batchId as Id<"batches">,
  });
}

/**
 * Check if all jobs in a batch are complete
 */
export async function isBatchComplete(batchId: string): Promise<boolean> {
  const stats = await getBatchStats(batchId);
  return stats.pending === 0 && stats.running === 0;
}

/**
 * Mark batch as completed if all jobs are done
 */
export async function checkAndCompleteBatch(batchId: string): Promise<void> {
  if (await isBatchComplete(batchId)) {
    await updateBatchStatus(batchId, "completed");
  }
}

// ============================================================================
// useapi.net History Tracking
// ============================================================================

/**
 * Record a useapi.net job result
 */
export async function recordUseApiHistory(
  entry: Omit<UseApiHistoryEntry, "id" | "timestamp">
): Promise<string> {
  const c = await getClient();

  const id = await c.mutation(api.mutations.assets.recordApiUsage, {
    userId: getUserId(),
    service: "useapi",
    operation: "generate_video",
    success: entry.status === "success",
    errorMessage: entry.error_message || undefined,
    cost: entry.cost || undefined,
    durationMs: entry.duration_ms || undefined,
  });

  return id;
}

/**
 * Get recent useapi.net history entries
 */
export async function getUseApiHistory(limit: number = 100): Promise<UseApiHistoryEntry[]> {
  const c = await getClient();

  const startTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // Last 30 days
  const usage = await c.query(api.queries.analytics.getUsageByUser, {
    userId: getUserId(),
    startTime,
    service: "useapi",
  });

  return usage.slice(0, limit).map((u: any) => ({
    id: u._id,
    timestamp: new Date(u.timestamp).toISOString(),
    job_id: u.jobId?.toString() || "",
    backend: "useapi",
    status: u.success ? "success" : "failed",
    duration_ms: u.durationMs || null,
    error_message: u.errorMessage || null,
    cost: u.cost || null,
  }));
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
  const c = await getClient();

  const startTime = Date.now() - hours * 60 * 60 * 1000;
  const usage = await c.query(api.queries.analytics.getUsageByUser, {
    userId: getUserId(),
    startTime,
    service: "useapi",
  });

  let success = 0;
  let failed = 0;
  let rateLimited = 0;
  let timeout = 0;
  let totalCost = 0;
  let totalDuration = 0;
  let durationCount = 0;

  for (const u of usage) {
    if (u.success) {
      success++;
    } else {
      failed++;
      // Check error message for rate limit or timeout
      if (u.errorMessage?.includes("rate")) {
        rateLimited++;
      } else if (u.errorMessage?.includes("timeout")) {
        timeout++;
      }
    }
    totalCost += u.cost || 0;
    if (u.durationMs) {
      totalDuration += u.durationMs;
      durationCount++;
    }
  }

  return {
    success,
    failed,
    rateLimited,
    timeout,
    totalCost,
    avgDurationMs: durationCount > 0 ? totalDuration / durationCount : null,
  };
}

/**
 * Clean up old useapi.net history entries (no-op for Convex - use scheduled functions)
 */
export async function cleanupUseApiHistory(daysToKeep: number = 30): Promise<number> {
  // Convex handles data retention differently - this would be a scheduled function
  // For now, return 0 as no local cleanup needed
  return 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Convex batch document to local Batch interface
 */
function convexBatchToLocal(batch: ConvexDocument<"batches">): Batch {
  return {
    id: batch._id,
    prompts_file: batch.promptsFile || "",
    prompts_hash: batch.promptsHash || "",
    project_id: batch.flowProjectId || null,
    status: batch.status as BatchStatus,
    created_at: new Date(batch.createdAt).toISOString(),
    updated_at: new Date(batch.updatedAt).toISOString(),
    total_jobs: batch.totalJobs,
    completed_jobs: batch.completedJobs,
    failed_jobs: batch.failedJobs,
  };
}

/**
 * Convert Convex job document to local Job interface
 */
function convexJobToLocal(job: ConvexDocument<"jobs">): Job {
  return {
    id: job._id,
    batch_id: job.batchId,
    prompt_index: job.promptIndex,
    prompt_text: job.promptText,
    prompt_type: job.promptType,
    tag: job.tag || null,
    status: job.status as JobStatus,
    video_path: job.videoPath || null,
    error_message: job.errorMessage || null,
    credits_used: job.creditsUsed || null,
    duration_ms: job.durationMs || null,
    created_at: new Date(job.createdAt).toISOString(),
    started_at: job.startedAt ? new Date(job.startedAt).toISOString() : null,
    completed_at: job.completedAt ? new Date(job.completedAt).toISOString() : null,
  };
}
