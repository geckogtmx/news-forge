import React, { useState, useEffect } from 'react';
import { useSources } from '@/hooks/useSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Search } from 'lucide-react';

declare global {
    interface Window {
        electron: any;
    }
}

interface RssSourceFormProps {
    userId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: any;
}

export function RssSourceForm({ userId, onSuccess, onCancel, initialValues }: RssSourceFormProps) {
    const { createSource, updateSource } = useSources();
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [topics, setTopics] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [preview, setPreview] = useState<{ title: string; description?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);
        setError(null);
        try {
            console.log('[RSS Form] Fetching feed:', url);
            // Invoke IPC handler - returns { success: true, data: feed } or { success: false, error: string }
            const response = await window.ipcRenderer.invoke('rss:fetch-feed', url);

            console.log('[RSS Form] Response received:', response);

            if (!response) {
                setError('No response from server');
                return;
            }

            if (!response.success) {
                setError(response.error || 'Failed to fetch feed');
                return;
            }

            const feed = response.data;
            console.log('[RSS Form] Feed data:', feed);

            if (!feed) {
                setError('No feed data in response');
                return;
            }

            if (!feed.items || !Array.isArray(feed.items)) {
                setError('Invalid feed structure - missing items array');
                return;
            }

            if (feed.items.length === 0) {
                setError('No items found in feed');
                return;
            }

            const firstItem = feed.items[0];
            console.log('[RSS Form] First item:', firstItem);

            setPreview({
                title: firstItem?.title || 'Feed Preview',
                description: firstItem?.contentSnippet?.substring(0, 100) + '...' || ''
            });

            // Auto-fill name if empty using feed title
            if (!name && !initialValues && feed.title) {
                setName(feed.title);
            }

            // Auto-populate topics from feed categories if topics field is empty
            if (!topics && !initialValues) {
                const extractedTopics = new Set<string>();

                // Try to get categories from feed level
                if (feed.categories && Array.isArray(feed.categories)) {
                    feed.categories.forEach((cat: string) => extractedTopics.add(cat));
                }

                // Also check first few items for categories
                feed.items.slice(0, 5).forEach((item: any) => {
                    if (item.categories && Array.isArray(item.categories)) {
                        item.categories.forEach((cat: string) => extractedTopics.add(cat));
                    }
                });

                // Set topics if we found any
                if (extractedTopics.size > 0) {
                    setTopics(Array.from(extractedTopics).slice(0, 5).join(', '));
                }
            }
        } catch (err: any) {
            console.error('[RSS Form] Error:', err);
            setError(err?.message || 'Failed to fetch feed. Please check the URL.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!url.trim() || !name.trim()) return;

        const topicsArray = topics
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const config = { url };
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
                type: 'rss',
                config,
                topics: topicsArray,
                isActive,
            });
        }

        if (result) {
            onSuccess?.();
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="url">RSS Feed URL</Label>
                    <div className="flex gap-2">
                        <Input
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/feed.xml"
                            disabled={isLoading}
                        />
                        <Button variant="secondary" onClick={handlePreview} disabled={isLoading || !url}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {preview && (
                    <Alert className="bg-muted/50">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle>Valid Feed Found</AlertTitle>
                        <AlertDescription className="mt-2 text-xs text-muted-foreground">
                            <strong>Latest:</strong> {preview.title}
                            <div className="mt-1 line-clamp-2">{preview.description}</div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-2">
                    <Label htmlFor="name">Source Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Tech News"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="topics">Topics</Label>
                    <Input
                        id="topics"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="tech, ai, startups (comma separated)"
                    />
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
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave} disabled={!url || !name}>
                    {initialValues ? 'Update Source' : 'Save Source'}
                </Button>
            </div>
        </div>
    );
}
