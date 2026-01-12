import React, { useState } from 'react';
import { useYoutube, VideoPreview } from '@/hooks/useYoutube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Video, AlertCircle, Check, Clock, User } from 'lucide-react';

interface AddYoutubeVideoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVideoAdded?: (headline: any) => void;
    userId?: number;
}

export function AddYoutubeVideoDialog({ open, onOpenChange, onVideoAdded, userId }: AddYoutubeVideoDialogProps) {
    const { previewVideo, loading, error: hookError } = useYoutube();

    const [url, setUrl] = useState('');
    const [preview, setPreview] = useState<VideoPreview | null>(null);
    const [topics, setTopics] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const handleFetchAndAnalyze = async () => {
        if (!url.trim()) {
            setError('Please enter a YouTube URL');
            return;
        }

        setError(null);
        setIsFetching(true);
        setPreview(null);

        try {
            const result = await previewVideo(url);
            if (result) {
                setPreview(result);
                // Auto-populate topics from AI analysis
                if (result.summary.topics && result.summary.topics.length > 0) {
                    setTopics(result.summary.topics.join(', '));
                }
            } else {
                setError('Failed to fetch video information');
            }
        } catch (err) {
            console.error('Error fetching video:', err);
            setError('Failed to fetch video. Please check the URL and try again.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleAddToRun = () => {
        if (!preview) return;

        // Create headline object with topics
        const topicsArray = topics
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const headline = {
            ...preview.headline,
            metadata: {
                ...preview.headline.metadata,
                topics: topicsArray,
            },
        };

        onVideoAdded?.(headline);
        handleClose();
    };

    const handleClose = () => {
        setUrl('');
        setPreview(null);
        setTopics('');
        setError(null);
        setIsFetching(false);
        onOpenChange(false);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Add YouTube Video
                    </DialogTitle>
                    <DialogDescription>
                        Paste a YouTube video URL to analyze with Google Gemini AI
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="youtube-url">YouTube URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="youtube-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                disabled={isFetching}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isFetching) {
                                        handleFetchAndAnalyze();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleFetchAndAnalyze}
                                disabled={isFetching || !url.trim()}
                            >
                                {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isFetching ? 'Analyzing with AI...' : 'Analyze Video'}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Supports: youtube.com/watch, youtu.be, youtube.com/embed
                        </p>
                    </div>

                    {/* Error Display */}
                    {(error || hookError) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error || hookError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Loading State */}
                    {isFetching && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Analyzing video with Gemini AI...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    This may take 5-15 seconds
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Preview Section */}
                    {preview && !isFetching && (
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground">Video Preview</h4>

                                {/* Video Title */}
                                <div>
                                    <h3 className="font-medium text-lg">{preview.metadata.title}</h3>
                                </div>

                                {/* Video Metadata */}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {preview.metadata.channelName && (
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>{preview.metadata.channelName}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(preview.metadata.publishedAt)}</span>
                                    </div>
                                    {preview.metadata.duration && (
                                        <div className="flex items-center gap-1">
                                            <Video className="h-3 w-3" />
                                            <span>{preview.metadata.duration}</span>
                                        </div>
                                    )}
                                </div>

                                {/* AI-Generated Topics */}
                                {preview.summary.topics && preview.summary.topics.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Key Topics</Label>
                                        <div className="flex flex-wrap gap-1">
                                            {preview.summary.topics.map((topic, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* AI-Generated Summary */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Summary</Label>
                                    <p className="text-sm leading-relaxed">
                                        {preview.summary.summary || preview.metadata.description}
                                    </p>
                                </div>
                            </div>

                            {/* Topics Input (Editable) */}
                            <div className="space-y-2">
                                <Label htmlFor="topics">Topics / Tags</Label>
                                <Input
                                    id="topics"
                                    value={topics}
                                    onChange={(e) => setTopics(e.target.value)}
                                    placeholder="tech, ai, tutorial (comma separated)"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Edit or add additional topics for categorization
                                </p>
                            </div>

                            {/* Success Indicator */}
                            <Alert className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20">
                                <Check className="h-4 w-4" />
                                <AlertTitle>Ready to Add</AlertTitle>
                                <AlertDescription>
                                    Video analyzed successfully. Click "Add to Run" to include this video.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {preview && (
                        <Button onClick={handleAddToRun}>
                            Add to Run
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
