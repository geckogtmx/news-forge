import React, { useState, useEffect } from 'react';
import { useSources } from '@/hooks/useSources';
import { useYoutube, VideoPreview } from '@/hooks/useYoutube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Search, Video, User, Clock } from 'lucide-react';

interface YoutubeSourceFormProps {
    userId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: any;
}

export function YoutubeSourceForm({ userId, onSuccess, onCancel, initialValues }: YoutubeSourceFormProps) {
    const { createSource, updateSource } = useSources();
    const { previewVideo, loading: previewLoading, error: previewError } = useYoutube();

    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [topics, setTopics] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [preview, setPreview] = useState<VideoPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load initial values if editing
    useEffect(() => {
        if (initialValues) {
            setName(initialValues.name);
            setIsActive(initialValues.isActive === 1 || initialValues.isActive === true);

            // Parse topics
            try {
                const parsedTopics = typeof initialValues.topics === 'string'
                    ? JSON.parse(initialValues.topics)
                    : initialValues.topics;
                setTopics(Array.isArray(parsedTopics) ? parsedTopics.join(', ') : '');
            } catch (e) {
                setTopics('');
            }

            // Parse config for URL
            try {
                const config = typeof initialValues.config === 'string'
                    ? JSON.parse(initialValues.config)
                    : initialValues.config;
                setUrl(config.url || '');
            } catch (e) {
                setUrl('');
            }
        }
    }, [initialValues]);

    const handlePreview = async () => {
        if (!url) return;
        setError(null);
        setPreview(null);

        try {
            const result = await previewVideo(url);
            if (result) {
                setPreview(result);

                // Auto-fill name and topics if user hasn't typed anything
                if (!name) {
                    setName(result.metadata.title);
                }

                if (!topics && result.summary.topics && result.summary.topics.length > 0) {
                    setTopics(result.summary.topics.join(', '));
                }
            }
        } catch (err) {
            // Error is handled by hook and displayed below
        }
    };

    const handleSave = async () => {
        if (!url.trim() || !name.trim()) return;

        // If we have a preview, use its metadata, otherwise try to extract videoId from URL if possible
        // Ideally user should preview first.
        if (!preview && !initialValues) {
            setError('Please preview the video first to verify it.');
            return;
        }

        setIsSaving(true);
        setError(null);

        const topicsArray = topics
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        // Extract video ID safely if we have preview, otherwise from URL
        let videoId = '';
        if (preview) {
            videoId = preview.metadata.videoId;
        } else if (initialValues) {
            // When editing, keep existing ID if we can't extract new one effectively without preview
            const config = typeof initialValues.config === 'string'
                ? JSON.parse(initialValues.config)
                : initialValues.config;
            videoId = config.videoId;
        }

        const config = {
            url,
            videoId,
            channelName: preview?.metadata.channelName,
            thumbnailUrl: preview?.metadata.thumbnailUrl
        };

        try {
            let result;

            if (initialValues) {
                result = await updateSource(initialValues.id, {
                    name,
                    config,
                    topics: topicsArray,
                    isActive,
                });
            } else {
                result = await createSource({
                    userId,
                    name,
                    type: 'youtube',
                    config,
                    topics: topicsArray,
                    isActive,
                });
            }

            if (result) {
                onSuccess?.();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save source');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="url">YouTube Video URL</Label>
                    <div className="flex gap-2">
                        <Input
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={previewLoading || isSaving}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !previewLoading) {
                                    handlePreview();
                                }
                            }}
                        />
                        <Button
                            variant="secondary"
                            onClick={handlePreview}
                            disabled={previewLoading || !url || isSaving}
                        >
                            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Supports: youtube.com/watch, youtu.be, youtube.com/embed
                    </p>
                </div>

                {(error || previewError) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error || previewError}</AlertDescription>
                    </Alert>
                )}

                {preview && (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-start gap-4">
                            {preview.metadata.thumbnailUrl && (
                                <img
                                    src={preview.metadata.thumbnailUrl}
                                    alt={preview.metadata.title}
                                    className="w-32 h-auto rounded-md object-cover shadow-sm hidden sm:block"
                                />
                            )}
                            <div className="space-y-1 flex-1">
                                <h4 className="font-semibold text-sm line-clamp-2">{preview.metadata.title}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" /> {preview.metadata.channelName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {formatDate(preview.metadata.publishedAt)}
                                    </span>
                                    {preview.metadata.duration && (
                                        <span className="flex items-center gap-1">
                                            <Video className="h-3 w-3" /> {preview.metadata.duration}
                                        </span>
                                    )}
                                </div>
                                {preview.summary?.summary && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                                        {preview.summary.summary}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-2">
                    <Label htmlFor="name">Source Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Project Management Tutorial"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="topics">Topics</Label>
                    <Input
                        id="topics"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="tech, ai, tutorial (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                        Auto-generated tags can be edited here
                    </p>
                </div>

                <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                    <Label htmlFor="active-mode" className="flex flex-col space-y-1">
                        <span>Active Status</span>
                        <span className="font-normal text-xs text-muted-foreground">Enable this source for news compilation</span>
                    </Label>
                    <Switch
                        id="active-mode"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={!url || !name || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialValues ? 'Update Source' : 'Save Source'}
                </Button>
            </div>
        </div>
    );
}
