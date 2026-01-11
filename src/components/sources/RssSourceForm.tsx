import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useRss } from '@/hooks/useRss';
import { useSources } from '@/hooks/useSources';

interface FeedItem {
    title?: string;
    link?: string;
    contentSnippet?: string;
}

interface Feed {
    title?: string;
    description?: string;
    link?: string;
    items: FeedItem[];
}

interface DiscoveredFeed {
    url: string;
    title?: string;
    type: 'rss' | 'atom' | 'json';
}

interface RssSourceFormProps {
    userId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function RssSourceForm({ userId, onSuccess, onCancel }: RssSourceFormProps) {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [topics, setTopics] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [feedPreview, setFeedPreview] = useState<Feed | null>(null);
    const [discoveredFeeds, setDiscoveredFeeds] = useState<DiscoveredFeed[]>([]);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; title?: string } | null>(null);

    const { previewFeed, discoverFeeds, validateFeed, loading: rssLoading, error: rssError } = useRss();
    const { createSource, loading: sourceLoading } = useSources();

    const handleDiscoverFeeds = async () => {
        if (!url.trim()) return;

        setDiscoveredFeeds([]);
        setFeedPreview(null);
        setValidationResult(null);

        const feeds = await discoverFeeds(url);
        if (feeds && feeds.length > 0) {
            setDiscoveredFeeds(feeds);
        }
    };

    const handlePreviewFeed = async (feedUrl?: string) => {
        const urlToPreview = feedUrl || url;
        if (!urlToPreview.trim()) return;

        setFeedPreview(null);
        setValidationResult(null);

        // Validate first
        const validation = await validateFeed(urlToPreview);
        setValidationResult(validation || null);

        if (validation?.valid) {
            const preview = await previewFeed(urlToPreview);
            if (preview) {
                setFeedPreview(preview);
                // Auto-fill name from feed title
                if (preview.title) {
                    setName(preview.title);
                }
            }
        }
    };

    const handleSelectDiscoveredFeed = (feed: DiscoveredFeed) => {
        setUrl(feed.url);
        if (feed.title && !name) {
            setName(feed.title);
        }
        setDiscoveredFeeds([]);
        handlePreviewFeed(feed.url);
    };

    const handleSave = async () => {
        if (!url.trim() || !name.trim()) return;

        const topicsArray = topics
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const source = await createSource({
            userId,
            name,
            type: 'rss',
            config: { url },
            topics: topicsArray,
            isActive,
        });

        if (source) {
            onSuccess?.();
        }
    };

    const isFormValid = url.trim() && name.trim() && validationResult?.valid;

    return (
        <div className="space-y-6">
            {/* URL Input and Discovery */}
            <div className="space-y-2">
                <Label htmlFor="url">Feed URL or Website</Label>
                <div className="flex gap-2">
                    <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com/feed or https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePreviewFeed();
                            }
                        }}
                    />
                    <Button
                        variant="outline"
                        onClick={handleDiscoverFeeds}
                        disabled={rssLoading || !url.trim()}
                    >
                        {rssLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Discover
                    </Button>
                    <Button
                        onClick={() => handlePreviewFeed()}
                        disabled={rssLoading || !url.trim()}
                    >
                        {rssLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Preview'
                        )}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Enter a feed URL directly or a website URL to discover feeds
                </p>
            </div>

            {/* Validation Status */}
            {validationResult && (
                <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                    <div className="flex items-center gap-2">
                        {validationResult.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                            {validationResult.valid
                                ? `Valid feed${validationResult.title ? `: ${validationResult.title}` : ''}`
                                : `Invalid feed: ${validationResult.error}`}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            {/* Discovered Feeds */}
            {discoveredFeeds.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Discovered Feeds</CardTitle>
                        <CardDescription>Select a feed to preview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {discoveredFeeds.map((feed, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectDiscoveredFeed(feed)}
                                className="w-full text-left p-3 rounded-md border hover:bg-accent transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{feed.title || 'Untitled Feed'}</p>
                                        <p className="text-sm text-muted-foreground truncate">{feed.url}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                        {feed.type.toUpperCase()}
                                    </Badge>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Feed Preview */}
            {feedPreview && (
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-base">{feedPreview.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {feedPreview.description}
                                </CardDescription>
                            </div>
                            {feedPreview.link && (
                                <a
                                    href={feedPreview.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-muted-foreground hover:text-foreground"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium mb-2">Recent Items ({feedPreview.items.length})</p>
                        <div className="space-y-2">
                            {feedPreview.items.slice(0, 5).map((item, index) => (
                                <div key={index} className="p-2 rounded-md border">
                                    <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                                    {item.contentSnippet && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {item.contentSnippet}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Source Details */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Source Name *</Label>
                    <Input
                        id="name"
                        placeholder="e.g., TechCrunch"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="topics">Topics (comma-separated)</Label>
                    <Input
                        id="topics"
                        placeholder="e.g., tech, startups, AI"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                        Add topics to help organize and filter headlines
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                        Active (fetch headlines from this source)
                    </Label>
                </div>
            </div>

            {/* Error Display */}
            {rssError && (
                <Alert variant="destructive">
                    <AlertDescription>{rssError}</AlertDescription>
                </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleSave}
                    disabled={!isFormValid || sourceLoading}
                >
                    {sourceLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Source'
                    )}
                </Button>
            </div>
        </div>
    );
}
