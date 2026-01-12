import React, { useState, useEffect } from 'react';
import { useSources } from '@/hooks/useSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface ArxivSourceFormProps {
    userId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: any;
}

const ARXIV_CATEGORIES = [
    { value: 'cs.AI', label: 'Artificial Intelligence' },
    { value: 'cs.LG', label: 'Machine Learning' },
    { value: 'cs.CL', label: 'Computation and Language' },
    { value: 'cs.CV', label: 'Computer Vision' },
    { value: 'cs.RO', label: 'Robotics' },
    { value: 'cs.SE', label: 'Software Engineering' },
    { value: 'cs.HC', label: 'Human-Computer Interaction' },
];

export function ArxivSourceForm({ userId, onSuccess, onCancel, initialValues }: ArxivSourceFormProps) {
    const { createSource, updateSource } = useSources();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('cs.AI');
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load initial values if editing
    useEffect(() => {
        if (initialValues) {
            setName(initialValues.name);
            setIsActive(initialValues.isActive === 1 || initialValues.isActive === true);

            try {
                const config = typeof initialValues.config === 'string'
                    ? JSON.parse(initialValues.config)
                    : initialValues.config;
                setCategory(config.category || 'cs.AI');
            } catch (e) {
                setCategory('cs.AI');
            }
        }
    }, [initialValues]);

    // Auto-generate name when category changes, if empty or default
    useEffect(() => {
        if (!initialValues && (!name || name.startsWith('ArXiv - '))) {
            const catLabel = ARXIV_CATEGORIES.find(c => c.value === category)?.label || category;
            setName(`ArXiv - ${catLabel}`);
        }
    }, [category]);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        const config = { category };
        let result;

        try {
            if (initialValues) {
                result = await updateSource(initialValues.id, {
                    name,
                    config, // updated category
                    topics: [category], // Basic topic tag
                    isActive,
                });
            } else {
                result = await createSource({
                    userId,
                    name,
                    type: 'arxiv',
                    config,
                    topics: [category],
                    isActive,
                });
            }

            if (result) {
                onSuccess?.();
            }
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
                    <Label htmlFor="category">ArXiv Category</Label>
                    <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {ARXIV_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.value} - {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="name">Source Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ArXiv Source Name"
                        disabled={isLoading}
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
                    {initialValues ? 'Update Source' : 'Save Source'}
                </Button>
            </div>
        </div>
    );
}
