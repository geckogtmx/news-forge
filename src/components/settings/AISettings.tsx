import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useUserContext } from '../../contexts/UserContext';
import { useAI, AIModel } from '../../hooks/useAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Check, Loader2, RefreshCw, Key, Server, Database } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ProviderConfig {
    apiKey: string;
    enabled: boolean;
    baseUrl?: string;
    model?: string;
    isConfigured?: boolean;
}

const PROVIDERS = [
    { id: 'ollama', name: 'Ollama (Local)', type: 'local', needsKey: false, defaultUrl: 'http://localhost:11434' },
    { id: 'openai', name: 'OpenAI', type: 'cloud', needsKey: true },
    { id: 'google', name: 'Google Gemini', type: 'cloud', needsKey: true },
    { id: 'anthropic', name: 'Anthropic', type: 'cloud', needsKey: true },
    { id: 'deepseek', name: 'DeepSeek', type: 'cloud', needsKey: true },
];

export function AISettings() {
    const { currentUser } = useUserContext();
    const { getSettings, updateAIProvider, updateSettings } = useSettings();
    const { getModels, generate } = useAI();

    const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({});
    const [workflowPrefs, setWorkflowPrefs] = useState<any>({});
    const [status, setStatus] = useState<Record<string, 'idle' | 'saving' | 'success' | 'error'>>({});
    const [availableModels, setAvailableModels] = useState<Record<string, AIModel[]>>({});
    const [allAvailableModels, setAllAvailableModels] = useState<AIModel[]>([]);
    const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
    const [loadingAllModels, setLoadingAllModels] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadSettings();
            fetchAllModels();
        }
    }, [currentUser]);

    const loadSettings = async () => {
        if (!currentUser) return;
        const settings = await getSettings(currentUser.id);
        if (settings) {
            if (settings.aiProviders) {
                setConfigs(settings.aiProviders as any);
            }
            if (settings.aiPreferences) {
                // aiPreferences is JSON column, might technically come as string if not auto-parsed?
                // Drizzle schema mode: 'json' usually handles parsing.
                // Safely handle it.
                let prefs = settings.aiPreferences;
                if (typeof prefs === 'string') {
                    try { prefs = JSON.parse(prefs); } catch (e) { prefs = {}; }
                }
                setWorkflowPrefs(prefs || {});
            }
        }
    };

    const fetchAllModels = async () => {
        setLoadingAllModels(true);
        try {
            const models = await getModels();
            if (models) {
                setAllAvailableModels(models);

                // Also organize by provider for the other view
                const modelsByProvider: Record<string, AIModel[]> = {};
                models.forEach((m: AIModel) => {
                    if (!modelsByProvider[m.providerId]) modelsByProvider[m.providerId] = [];
                    modelsByProvider[m.providerId].push(m);
                });
                setAvailableModels(modelsByProvider);
            }
        } catch (error) {
            console.error("Failed to fetch all models", error);
        } finally {
            setLoadingAllModels(false);
        }
    }

    const handleWorkflowChange = (key: string, value: string) => {
        setWorkflowPrefs((prev: any) => ({ ...prev, [key]: value }));
    }

    const saveWorkflowPrefs = async () => {
        if (!currentUser) return;
        setStatus(prev => ({ ...prev, 'workflow': 'saving' }));
        try {
            await updateSettings(currentUser.id, { aiPreferences: workflowPrefs });
            setStatus(prev => ({ ...prev, 'workflow': 'success' }));
            setTimeout(() => setStatus(prev => ({ ...prev, 'workflow': 'idle' })), 2000);
        } catch (error) {
            console.error(error);
            setStatus(prev => ({ ...prev, 'workflow': 'error' }));
        }
    }

    const fetchModels = async (providerId: string) => {
        setLoadingModels(prev => ({ ...prev, [providerId]: true }));
        try {
            // For now, getModels fetches ALL models from registry. 
            // We filter them by providerId.
            const allModels = await getModels(providerId);
            if (allModels) {
                const providerModels = allModels.filter((m: AIModel) => m.providerId === providerId);
                setAvailableModels(prev => ({ ...prev, [providerId]: providerModels }));

                // If current model is not set, set to first available
                if (providerModels.length > 0 && !configs[providerId]?.model) {
                    handleConfigChange(providerId, 'model', providerModels[0].id);
                }
            }
        } catch (error) {
            console.error(`Failed to fetch models for ${providerId}`, error);
        } finally {
            setLoadingModels(prev => ({ ...prev, [providerId]: false }));
        }
    };

    const handleToggleProvider = async (providerId: string, checked: boolean) => {
        if (!checked) {
            // Turning OFF: Confirm reset
            if (window.confirm("Disabling this provider will remove the saved API key. Are you sure?")) {
                handleConfigChange(providerId, 'enabled', false);
                handleConfigChange(providerId, 'apiKey', '');
                handleConfigChange(providerId, 'isConfigured', false);

                // Immediately save the disabled/cleared state to DB
                if (currentUser) {
                    try {
                        const resetConfig = { apiKey: '', enabled: false, isConfigured: false } as any;
                        await updateAIProvider(currentUser.id, providerId, resetConfig);
                    } catch (e) {
                        console.error("Failed to reset provider", e);
                    }
                }
            }
        } else {
            // Turning ON
            handleConfigChange(providerId, 'enabled', true);
        }
    };

    const handleConfigChange = (providerId: string, field: keyof ProviderConfig, value: any) => {
        setConfigs(prev => ({
            ...prev,
            [providerId]: {
                ...prev[providerId] || { apiKey: '', enabled: false },
                [field]: value
            }
        }));
    };

    const saveProvider = async (providerId: string) => {
        if (!currentUser) return;
        setStatus(prev => ({ ...prev, [providerId]: 'saving' }));
        try {
            const config = { ...configs[providerId] };
            if (!config) throw new Error("Config not found");

            // If key is masked, set to specific string that backend recognizes (or keep as is since backend now handles '********')
            // But if we want to be clean, we can just send it.
            // The backend check for '********' handles this.
            // Let's just ensure we don't accidentally send a PARTIAL mask if user edited it? No, assume user knows.
            const updatedSettings = await updateAIProvider(currentUser.id, providerId, config);

            // Update local state with result (which includes isConfigured=true)
            if (updatedSettings && updatedSettings.aiProviders) {
                const newConfigs = updatedSettings.aiProviders as any;
                setConfigs(prev => ({ ...prev, [providerId]: newConfigs[providerId] }));
            }

            setStatus(prev => ({ ...prev, [providerId]: 'success' }));

            // Auto-fetch models if we just saved successfully (and it's a cloud provider)
            if (config.enabled && providerId !== 'ollama') {
                fetchModels(providerId);
            }

            setTimeout(() => setStatus(prev => ({ ...prev, [providerId]: 'idle' })), 2000);
        } catch (error) {
            console.error(error);
            setStatus(prev => ({ ...prev, [providerId]: 'error' }));
        }
    };

    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

    const handleTestConnection = async (providerId: string) => {
        if (!currentUser) return;

        // Save first if there are unsaved changes? 
        // Or just rely on what's in state? 
        // Actually, we should test what's SAVED in DB because `generate` uses DB settings (unless we pass api Key in options).
        // If user typed a key but didn't save, testing via DB will fail.
        // Option A: Force save before test.
        // Option B: Pass current form state apiKey in options to `generate`.
        // Let's go with B for better UX (Test before Save).

        setTestStatus(prev => ({ ...prev, [providerId]: 'testing' }));
        try {
            const config = configs[providerId];
            const apiKey = config?.apiKey;

            // If the key is masked (saved in DB), don't send it back to the server.
            // Sending undefined causes the backend to look up the decrypted key from Secure Settings.
            // If the user typed a new key (unsaved), it won't be masked, so we send it.
            const isMasked = apiKey?.includes('***');
            const keyToSend = isMasked ? undefined : apiKey;

            const result = await generate(
                currentUser.id,
                "Say 'Connection Successful' if you can read this.",
                {
                    apiKey: keyToSend,
                    maxTokens: 20,
                    modelId: config?.model // Pass selected model explicitly
                },
                providerId
            );

            // Some models might blocked content due to safety, but that means connection worked.
            if (result) {
                setTestStatus(prev => ({ ...prev, [providerId]: 'success' }));
                setTimeout(() => setTestStatus(prev => ({ ...prev, [providerId]: 'idle' })), 3000);
            } else {
                throw new Error("No response object returned");
            }
        } catch (error) {
            console.error("Test failed", error);
            setTestStatus(prev => ({ ...prev, [providerId]: 'error' }));
            setTimeout(() => setTestStatus(prev => ({ ...prev, [providerId]: 'idle' })), 3000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Providers</h2>
                    <p className="text-muted-foreground">Configure local and cloud AI models for compilation and content generation.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {PROVIDERS.map(provider => (
                    <Card key={provider.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {provider.name}
                                    <Badge variant={provider.type === 'local' ? 'secondary' : 'default'}>
                                        {provider.type}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    {provider.id === 'ollama'
                                        ? 'Run open-source models locally. Requires Ollama to be installed and running.'
                                        : `Connect to ${provider.name} API for high-quality generation.`}
                                </CardDescription>
                            </div>
                            <Switch
                                checked={configs[provider.id]?.enabled || false}
                                onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                            />
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {/* Step 1: Configuration (Key Input) */}
                            {provider.needsKey && configs[provider.id]?.enabled && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id={`${provider.id}-key`}
                                                    type="password"
                                                    placeholder={configs[provider.id]?.apiKey ? '********' : `sk-...`}
                                                    className="pl-9"
                                                    value={configs[provider.id]?.apiKey || ''}
                                                    onChange={(e) => handleConfigChange(provider.id, 'apiKey', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Keys are encrypted at rest using AES-256 and never exposed in the UI.
                                        </p>
                                    </div>

                                    {/* Show Verify button only if NOT configured yet */}
                                    {!configs[provider.id]?.isConfigured && (
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => saveProvider(provider.id)}
                                                disabled={status[provider.id] === 'saving' || !configs[provider.id]?.apiKey}
                                            >
                                                {status[provider.id] === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                Verify & Save
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {provider.id === 'ollama' && configs[provider.id]?.enabled && (
                                <div className="space-y-2">
                                    <Label htmlFor="ollama-url">Base URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="ollama-url"
                                            value={configs[provider.id]?.baseUrl || provider.defaultUrl}
                                            onChange={(e) => handleConfigChange(provider.id, 'baseUrl', e.target.value)}
                                        />
                                        <Button
                                            variant="secondary"
                                            type="button"
                                            onClick={() => fetchModels('ollama')}
                                            disabled={loadingModels['ollama']}
                                        >
                                            {loadingModels['ollama'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                            <span className="ml-2 hidden sm:inline">Fetch Models</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Model Selection (Only show if configured OR it's Ollama) */}
                            {(configs[provider.id]?.enabled && (configs[provider.id]?.isConfigured || provider.id === 'ollama')) && (
                                <div className="space-y-2 mt-4">
                                    <Label>Default Model</Label>
                                    <div className="flex gap-2 items-center">
                                        {availableModels[provider.id]?.length > 0 ? (
                                            <Select
                                                value={configs[provider.id]?.model || ''}
                                                onValueChange={(val) => handleConfigChange(provider.id, 'model', val)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableModels[provider.id]?.map(model => (
                                                        <SelectItem key={model.id} value={model.id}>
                                                            {model.name} ({model.id})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Enter model name (e.g. gpt-4o, llama3)"
                                                    value={configs[provider.id]?.model || ''}
                                                    onChange={(e) => handleConfigChange(provider.id, 'model', e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {/* Allow manual refresh for cloud providers too if we implement fetching */}
                                        {provider.id !== 'ollama' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => fetchModels(provider.id)}
                                                disabled={loadingModels[provider.id]}
                                                title="Fetch available models"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${loadingModels[provider.id] ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {availableModels[provider.id]?.length > 0
                                            ? 'Select from detected models.'
                                            : 'Click refresh to detect models, or enter manually.'}
                                    </p>
                                </div>
                            )}

                        </CardContent>

                        {/* Footer - Only show if configured (and thus able to Test/Save normally) OR if it's Ollama */}
                        {(configs[provider.id]?.enabled && (configs[provider.id]?.isConfigured || provider.id === 'ollama')) && (
                            <CardFooter className="justify-between border-t bg-muted/50 px-6 py-3">
                                <div className="text-sm text-muted-foreground">
                                    {status[provider.id] === 'success' && <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>}
                                    {status[provider.id] === 'error' && <span className="text-red-600">Failed to save</span>}

                                    {testStatus[provider.id] === 'success' && <span className="text-green-600 flex items-center gap-1 ml-4"><Check className="h-3 w-3" /> Connected</span>}
                                    {testStatus[provider.id] === 'error' && <span className="text-red-600 ml-4">Connection Failed</span>}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleTestConnection(provider.id)}
                                        disabled={testStatus[provider.id] === 'testing' || !configs[provider.id]?.enabled}
                                    >
                                        {testStatus[provider.id] === 'testing' ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Server className="mr-2 h-3 w-3" />}
                                        Test
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => saveProvider(provider.id)}
                                        disabled={status[provider.id] === 'saving'}
                                    >
                                        {status[provider.id] === 'saving' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>

            {/* Workflow Configuration */}
            <div className="pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Workflow Configuration</h2>
                        <p className="text-muted-foreground">Assign specific AI models to different steps of the compilation workflow.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Task Defaults
                        </CardTitle>
                        <CardDescription>
                            Configure which models handle specific tasks. You can override these during run-time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Helper to refresh all */}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAllModels}
                                disabled={loadingAllModels}
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${loadingAllModels ? 'animate-spin' : ''}`} />
                                Refresh All Models
                            </Button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Headline Clustering</Label>
                                <Select
                                    value={workflowPrefs.clusteringModel || ''}
                                    onValueChange={(val) => handleWorkflowChange('clusteringModel', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAvailableModels.length > 0 ? (
                                            allAvailableModels.map(model => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.name} ({model.providerId})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="default" disabled>No models found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Used for grouping similar news items. Faster/Cheaper models recommended.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Summarization</Label>
                                <Select
                                    value={workflowPrefs.summaryModel || ''}
                                    onValueChange={(val) => handleWorkflowChange('summaryModel', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAvailableModels.length > 0 ? (
                                            allAvailableModels.map(model => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.name} ({model.providerId})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="default" disabled>No models found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Used for summarizing article groups. High-context models recommended.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Script Writing</Label>
                                <Select
                                    value={workflowPrefs.scriptModel || ''}
                                    onValueChange={(val) => handleWorkflowChange('scriptModel', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAvailableModels.length > 0 ? (
                                            allAvailableModels.map(model => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.name} ({model.providerId})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="default" disabled>No models found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Used for generating final content. High-quality models recommended.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between border-t bg-muted/50 px-6 py-3">
                        <div className="text-sm text-muted-foreground">
                            {status['workflow'] === 'success' && <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Preferences Saved</span>}
                            {status['workflow'] === 'error' && <span className="text-red-600">Failed to save preferences</span>}
                        </div>
                        <Button
                            onClick={saveWorkflowPrefs}
                            disabled={status['workflow'] === 'saving'}
                        >
                            {status['workflow'] === 'saving' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Save Preferences
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
