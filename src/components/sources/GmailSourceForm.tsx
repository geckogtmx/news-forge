import React, { useState, useEffect } from 'react';
import { useGmail, GmailFilters, GmailLabel } from '@/hooks/useGmail';
import { useSources } from '@/hooks/useSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GmailSourceFormProps {
    userId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: any;
}

export function GmailSourceForm({ userId, onSuccess, onCancel, initialValues }: GmailSourceFormProps) {
    const {
        isConfigured,
        isAuthenticated,
        openAuthUrl,
        revokeAuth,
        getLabels,
        testConnection,
        loading: gmailLoading
    } = useGmail();

    const { createSource, updateSource, getSourcesByUser } = useSources();

    const [isEnvConfigured, setIsEnvConfigured] = useState<boolean>(false);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [labels, setLabels] = useState<GmailLabel[]>([]);

    // Form state
    const [name, setName] = useState('My Newsletters');
    const [selectedLabel, setSelectedLabel] = useState<string>('INBOX');
    const [senderFilter, setSenderFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [topics, setTopics] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Status state
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; count: number } | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        checkStatus();
    }, [userId]);

    // Load initial values
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

            // Parse config for Filters
            try {
                const config = typeof initialValues.config === 'string'
                    ? JSON.parse(initialValues.config)
                    : initialValues.config;

                if (config.filters) {
                    if (config.filters.labels && config.filters.labels.length > 0) {
                        setSelectedLabel(config.filters.labels[0]);
                    }
                    if (config.filters.senders) {
                        setSenderFilter(config.filters.senders.join(', '));
                    }
                    if (config.filters.subjects) {
                        setSubjectFilter(config.filters.subjects.join(', '));
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [initialValues]);

    const checkStatus = async () => {
        try {
            const configured = await isConfigured();
            setIsEnvConfigured(!!configured);

            if (configured) {
                const auth = await isAuthenticated(userId);
                setIsAuth(!!auth);

                if (auth) {
                    loadLabels();
                }
            }
        } catch (err) {
            console.error('Failed to check status:', err);
            setError('Failed to check Gmail status');
        }
    };

    const loadLabels = async () => {
        try {
            const userLabels = await getLabels(userId);
            if (userLabels) {
                setLabels(userLabels);
            }
        } catch (err) {
            console.error('Failed to load labels:', err);
        }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const success = await openAuthUrl(userId);
            if (success) {
                setIsAuth(true);
                loadLabels();
            } else {
                setError('Authentication failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred during authentication.');
            console.error(err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await revokeAuth(userId);
            setIsAuth(false);
            setLabels([]);
        } catch (err) {
            setError('Failed to disconnect account.');
        }
    };

    const handleTest = async () => {
        // Find label name
        const labelObj = labels.find(l => l.id === selectedLabel);
        const labelVal = labelObj ? labelObj.name : selectedLabel;

        // Quote if contains spaces
        const labelQuery = labelVal.includes(' ') ? `"${labelVal}"` : labelVal;

        const filters: GmailFilters = {
            labels: [labelQuery],
            senders: senderFilter ? senderFilter.split(',').map(s => s.trim()).filter(s => !!s) : undefined,
            subjects: subjectFilter ? subjectFilter.split(',').map(s => s.trim()).filter(s => !!s) : undefined,
        };

        try {
            const result = await testConnection(userId, filters);
            if (result) {
                setTestResult({
                    success: result.success,
                    count: result.emailCount
                });

                if (!result.success && result.error) {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError('Test connection failed.');
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Source name is required');
            return;
        }

        if (!isAuth) {
            setError('Please connect your Gmail account first');
            return;
        }

        // Check for duplicates
        try {
            const existingSources = await getSourcesByUser(userId);
            if (existingSources) {
                const isDuplicate = existingSources.some((s: any) => {
                    if (initialValues && s.id === initialValues.id) return false; // Ignore self
                    if (s.type !== 'gmail') return false;

                    try {
                        const cfg = typeof s.config === 'string' ? JSON.parse(s.config) : s.config;
                        if (!cfg.filters?.labels) return false;
                        return cfg.filters.labels.includes(selectedLabel);
                    } catch {
                        return false;
                    }
                });

                if (isDuplicate) {
                    setError('A source with this label already exists.');
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to check duplicates', err);
            // Non-blocking but risky
        }

        // Find label name
        const labelObj = labels.find(l => l.id === selectedLabel);
        const labelName = labelObj ? labelObj.name : selectedLabel;
        const labelQuery = labelName.includes(' ') ? `"${labelName}"` : labelName;

        const config = {
            filters: {
                labels: [labelQuery],
                senders: senderFilter ? senderFilter.split(',').map(s => s.trim()).filter(s => !!s) : undefined,
                subjects: subjectFilter ? subjectFilter.split(',').map(s => s.trim()).filter(s => !!s) : undefined,
            },
            labelName: labelName
        };

        const topicsArray = topics
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

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
                type: 'gmail',
                config,
                topics: topicsArray,
                isActive,
            });
        }

        if (result) {
            onSuccess?.();
        }
    };

    if (!isEnvConfigured) {
        return (
            <div className="space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Configuration Missing</AlertTitle>
                    <AlertDescription>
                        Gmail API credentials are not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.
                    </AlertDescription>
                </Alert>
                <div className="flex justify-end">
                    <Button variant="outline" onClick={onCancel}>Close</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Authentication Section */}
            <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isAuth ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                            <Mail className={`h-5 w-5 ${isAuth ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">Gmail Account</h4>
                            <p className="text-xs text-muted-foreground">
                                {isAuth ? 'Connected and authorized' : 'Not connected'}
                            </p>
                        </div>
                    </div>
                    {isAuth ? (
                        <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive">
                            Disconnect
                        </Button>
                    ) : (
                        <Button size="sm" onClick={handleConnect} disabled={isConnecting}>
                            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Connect Gmail
                        </Button>
                    )}
                </div>
            </div>

            {isAuth && (
                <>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Source Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Tech Newsletters"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="label">Gmail Label</Label>
                                <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select label" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INBOX">Inbox</SelectItem>
                                        {labels.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sender">Sender (Optional)</Label>
                                <Input
                                    id="sender"
                                    value={senderFilter}
                                    onChange={(e) => setSenderFilter(e.target.value)}
                                    placeholder="newsletter@example.com"
                                />
                                <p className="text-[10px] text-muted-foreground">Comma-separated email addresses</p>
                            </div>
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

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {testResult && (
                        <Alert className={testResult.success ? "border-green-500 text-green-600" : "border-yellow-500"}>
                            <Check className="h-4 w-4" />
                            <AlertTitle>Connection Test</AlertTitle>
                            <AlertDescription>
                                {testResult.success
                                    ? `Found ${testResult.count} recent matching emails.`
                                    : "Could not fetch emails."}
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                {isAuth && (
                    <>
                        <Button variant="secondary" onClick={handleTest} disabled={gmailLoading}>
                            Test Configuration
                        </Button>
                        <Button onClick={handleSave} disabled={gmailLoading}>
                            {initialValues ? 'Update Source' : 'Save Source'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
