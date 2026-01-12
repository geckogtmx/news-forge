import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';

export interface VideoMetadata {
    videoId: string;
    title: string;
    description: string;
    publishedAt: Date;
    duration?: string;
    channelName?: string;
    thumbnailUrl?: string;
}

export interface VideoSummary {
    topics: string[];
    summary: string;
    fullTranscript: string;
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

export interface VideoPreview {
    metadata: VideoMetadata;
    summary: VideoSummary;
    headline: YoutubeHeadline;
}

export function useYoutube() {
    const { invoke, loading, error } = useIpc<boolean | string | VideoMetadata | string | VideoPreview | YoutubeHeadline>();

    const validateUrl = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.YOUTUBE.VALIDATE_URL, url) as boolean | undefined;
    }, [invoke]);

    const extractVideoId = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.YOUTUBE.EXTRACT_VIDEO_ID, url) as string | undefined;
    }, [invoke]);

    const fetchVideo = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.YOUTUBE.FETCH_VIDEO, url) as VideoMetadata | undefined;
    }, [invoke]);

    const fetchTranscript = useCallback(async (videoId: string) => {
        return await invoke(IPC_CHANNELS.YOUTUBE.FETCH_TRANSCRIPT, videoId) as string | undefined;
    }, [invoke]);

    const previewVideo = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.YOUTUBE.PREVIEW_VIDEO, url) as VideoPreview | undefined;
    }, [invoke]);

    const extractHeadline = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.YOUTUBE.EXTRACT_HEADLINE, url) as YoutubeHeadline | undefined;
    }, [invoke]);

    return {
        validateUrl,
        extractVideoId,
        fetchVideo,
        fetchTranscript,
        previewVideo,
        extractHeadline,
        loading,
        error,
    };
}
