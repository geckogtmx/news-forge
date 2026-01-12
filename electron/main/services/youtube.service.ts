/**
 * YouTubeService - Handles YouTube video metadata extraction and AI-powered analysis
 * 
 * Simplified approach using Gemini API for content analysis:
 * - Manual URL input (no channel monitoring)
 * - Video metadata scraping (title, description, date)
 * - Gemini AI for video content analysis (topics, summary)
 */

import { geminiService } from './gemini.service';

export interface VideoMetadata {
    videoId: string;
    title: string;
    description: string;
    publishedAt: Date;
    duration?: string;
    channelName?: string;
}

export interface VideoSummary {
    topics: string[];
    summary: string;
    fullTranscript: string; // Not used with Gemini, kept for compatibility
}

export interface YoutubeHeadline {
    title: string;
    description: string;
    url: string;
    publishedAt: Date;
    source: 'youtube';
    metadata: {
        videoId: string;
        duration?: string;
        topics: string[];
        transcriptSummary: string;
    };
}

class YouTubeService {
    /**
     * Validate if URL is a valid YouTube video URL
     */
    isValidYoutubeUrl(url: string): boolean {
        const patterns = [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^https?:\/\/youtu\.be\/[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/,
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * Extract video ID from various YouTube URL formats
     */
    extractVideoId(url: string): string | null {
        // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
        let match = url.match(/[?&]v=([^&]+)/);
        if (match) return match[1];

        // Short URL: https://youtu.be/VIDEO_ID
        match = url.match(/youtu\.be\/([^?]+)/);
        if (match) return match[1];

        // Embed URL: https://www.youtube.com/embed/VIDEO_ID
        match = url.match(/\/embed\/([^?]+)/);
        if (match) return match[1];

        // Old format: https://www.youtube.com/v/VIDEO_ID
        match = url.match(/\/v\/([^?]+)/);
        if (match) return match[1];

        return null;
    }

    /**
     * Fetch video metadata by scraping the YouTube page
     */
    async fetchVideoMetadata(url: string): Promise<VideoMetadata> {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        try {
            // Fetch the YouTube page
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch video page');
            }

            const html = await response.text();

            // Extract title from og:title meta tag
            const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
            const title = titleMatch ? this.decodeHtmlEntities(titleMatch[1]) : 'Unknown Title';

            // Extract description from og:description meta tag
            const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
            const description = descMatch ? this.decodeHtmlEntities(descMatch[1]) : '';

            // Extract publish date from uploadDate
            const dateMatch = html.match(/"uploadDate":"([^"]+)"/);
            const publishedAt = dateMatch ? new Date(dateMatch[1]) : new Date();

            // Extract duration (optional)
            const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
            const duration = durationMatch ? this.formatDuration(parseInt(durationMatch[1])) : undefined;

            // Extract channel name
            const channelMatch = html.match(/"author":"([^"]+)"/);
            const channelName = channelMatch ? this.decodeHtmlEntities(channelMatch[1]) : undefined;

            return {
                videoId,
                title,
                description,
                publishedAt,
                duration,
                channelName,
            };
        } catch (error) {
            console.error('Error fetching video metadata:', error);
            throw new Error('Failed to fetch video metadata. The video may be private or deleted.');
        }
    }

    /**
     * Analyze video using Gemini AI
     */
    async analyzeVideoWithGemini(metadata: VideoMetadata): Promise<VideoSummary> {
        try {
            console.log('[YouTube] Analyzing with Gemini AI...');

            const analysis = await geminiService.analyzeYoutubeMetadata(
                metadata.title,
                metadata.description
            );

            return {
                topics: analysis.topics,
                summary: analysis.summary,
                fullTranscript: analysis.keyPoints.join('\n'), // Store key points as "transcript"
            };
        } catch (error: any) {
            console.error('[YouTube] Gemini analysis failed:', error);
            throw new Error(`Failed to analyze video: ${error.message}`);
        }
    }

    /**
     * Extract headline from video data and summary
     */
    extractHeadline(metadata: VideoMetadata, summary: VideoSummary): YoutubeHeadline {
        return {
            title: metadata.title,
            description: summary.summary,
            url: `https://www.youtube.com/watch?v=${metadata.videoId}`,
            publishedAt: metadata.publishedAt,
            source: 'youtube' as const,
            metadata: {
                videoId: metadata.videoId,
                duration: metadata.duration,
                topics: summary.topics,
                transcriptSummary: summary.fullTranscript,
            },
        };
    }

    /**
     * Preview video with Gemini AI analysis
     * This is the main method used by the UI
     */
    async previewVideo(url: string): Promise<{
        metadata: VideoMetadata;
        summary: VideoSummary;
        headline: YoutubeHeadline;
    }> {
        if (!this.isValidYoutubeUrl(url)) {
            throw new Error('Invalid YouTube URL');
        }

        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('Could not extract video ID from URL');
        }

        console.log('[YouTube] Fetching video:', videoId);

        // Fetch metadata
        const metadata = await this.fetchVideoMetadata(url);
        console.log('[YouTube] Metadata fetched:', metadata.title);

        // Analyze with Gemini
        let summary: VideoSummary;
        try {
            summary = await this.analyzeVideoWithGemini(metadata);
            console.log('[YouTube] Gemini analysis complete');
        } catch (error) {
            console.error('[YouTube] Gemini analysis failed:', error);
            console.warn('[YouTube] Using basic metadata as fallback');

            // Fallback to basic metadata if Gemini fails
            summary = {
                topics: [],
                summary: metadata.description,
                fullTranscript: '',
            };
        }

        // Create headline
        const headline = this.extractHeadline(metadata, summary);

        return {
            metadata,
            summary,
            headline,
        };
    }

    /**
     * Helper: Decode HTML entities
     */
    private decodeHtmlEntities(text: string): string {
        const entities: Record<string, string> = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&apos;': "'",
        };

        return text.replace(/&[^;]+;/g, match => entities[match] || match);
    }

    /**
     * Helper: Format duration in seconds to HH:MM:SS or MM:SS
     */
    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
