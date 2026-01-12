import React, { useState } from 'react';
import { useSources } from '@/hooks/useSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface HFSourceFormProps {
    userId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: any;
}

export function HFSourceForm({ userId, onSuccess, onCancel, initialValues }: HFSourceFormProps) {
    const { createSource, updateSource } = useSources();
    const [name, setName] = useState(initialValues?.name || 'Hugging Face Daily Papers');
    const [isActive, setIsActive] = useState(initialValues?.isActive !== false); // Default to true
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Config for HF is minimal, maybe just a placeholder or date preference in future
        const config = { type: 'daily_papers' };

        try {
            if (initialValues) {
                await updateSource(initialValues.id, {
                    name,
                    config,
                    topics: ['AI', 'Machine Learning', 'Research'],
                    isActive,
                });
            } else {
                await createSource({
                    userId,
                    name,
                    type: 'huggingface',
                    config,
                    topics: ['AI', 'Machine Learning', 'Research'],
                    isActive,
                });
            }

            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save source');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Source Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Hugging Face Daily Papers"
                        disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                        This source fetches trending AI papers daily from Hugging Face.
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
                        disabled={isLoading}
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

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                <Button onClick={handleSave} disabled={isLoading || !name}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialValues ? 'Update Source' : 'Add Source'}
                </Button>
            </div>
        </div>
    );
}
