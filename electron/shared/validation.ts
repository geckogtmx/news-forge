/**
 * IPC Input Validation Schemas
 *
 * Zod schemas for validating IPC handler inputs at the system boundary.
 * Validates the highest-risk channels: URLs (SSRF), source creation, headline search.
 */
import { z } from 'zod/v4';

// ========== Common Schemas ==========

const positiveInt = z.number().int().positive();

const sourceType = z.enum(['rss', 'gmail', 'youtube', 'website', 'arxiv', 'huggingface']);

// ========== URL Validation (SSRF Protection) ==========

/**
 * Validates a URL is safe to fetch (no private IPs, localhost, non-http schemes).
 */
export const safeUrl = z.url().check(
    z.refine((url) => {
        try {
            const parsed = new URL(url);

            // Only allow http/https
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return false;
            }

            const hostname = parsed.hostname.toLowerCase();

            // Block localhost variants
            if (
                hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname === '::1' ||
                hostname === '0.0.0.0' ||
                hostname.endsWith('.localhost')
            ) {
                return false;
            }

            // Block private IP ranges
            const parts = hostname.split('.').map(Number);
            if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
                if (parts[0] === 10) return false;
                if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
                if (parts[0] === 192 && parts[1] === 168) return false;
                if (parts[0] === 169 && parts[1] === 254) return false;
            }

            return true;
        } catch {
            return false;
        }
    }, 'URL must be a valid public HTTP(S) URL'),
);

/** YouTube URL validator */
const youtubeUrl = z.url().check(
    z.refine((url) => {
        try {
            const parsed = new URL(url);
            return ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'].includes(
                parsed.hostname.toLowerCase(),
            );
        } catch {
            return false;
        }
    }, 'Must be a valid YouTube URL'),
);

// ========== Source Schemas ==========

export const createSourceSchema = z.object({
    userId: positiveInt,
    name: z.string().min(1).max(200),
    type: sourceType,
    config: z.record(z.string(), z.any()),
    topics: z.array(z.string()),
    isActive: z.boolean().optional(),
});

export const updateSourceSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    type: sourceType.optional(),
    config: z.record(z.string(), z.any()).optional(),
    topics: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

// ========== Headline Schemas ==========

export const createHeadlineSchema = z.object({
    runId: positiveInt,
    sourceId: positiveInt,
    title: z.string().min(1).max(1000),
    description: z.string().max(5000).optional().nullable(),
    url: z.url(),
    publishedAt: z.union([z.date(), z.string(), z.number()]).optional().nullable(),
    source: sourceType,
    isSelected: z.boolean().optional(),
});

// ========== Schema map for IPC channels ==========

/**
 * Maps IPC channel names to Zod schemas that validate the args tuple.
 * Channels not listed here pass through without validation.
 */
export const IPC_SCHEMAS: Record<string, z.ZodType> = {
    // Source operations
    'source:create': createSourceSchema,
    'source:update': z.tuple([positiveInt, updateSourceSchema]),

    // RSS operations (SSRF risk)
    'rss:fetch-feed': z.tuple([safeUrl]),
    'rss:discover-feeds': z.tuple([safeUrl]),
    'rss:validate-feed': z.tuple([safeUrl]),
    'rss:preview-feed': z.tuple([safeUrl]),

    // Headline operations
    'headline:create': createHeadlineSchema,
    'headline:search': z.tuple([positiveInt, z.string().min(1).max(500)]),

    // YouTube operations
    'youtube:validate-url': z.tuple([youtubeUrl]),
    'youtube:extract-video-id': z.tuple([youtubeUrl]),
    'youtube:fetch-video': z.tuple([youtubeUrl]),
    'youtube:preview-video': z.tuple([youtubeUrl]),
    'youtube:extract-headline': z.tuple([youtubeUrl]),
};

/**
 * Validate IPC arguments against registered schema.
 * Returns parsed data on success, or throws with a descriptive error.
 */
export function validateIpcArgs(channel: string, args: unknown[]): unknown[] {
    const schema = IPC_SCHEMAS[channel];
    if (!schema) return args; // No schema registered, pass through

    // Try parsing as full args array first (for tuple schemas),
    // then as single arg (for object schemas like source:create)
    let result = schema.safeParse(args);
    if (!result.success && args.length === 1) {
        result = schema.safeParse(args[0]);
    }

    if (!result.success) {
        const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Validation failed for ${channel}: ${issues}`);
    }

    const data = result.data;
    return Array.isArray(data) ? data : [data];
}
