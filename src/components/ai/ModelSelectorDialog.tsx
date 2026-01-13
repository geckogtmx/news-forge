import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Zap, Cloud, DollarSign } from 'lucide-react';
import { useUserContext } from '../../contexts/UserContext';
import { useSettings } from '../../hooks/useSettings';

interface ModelSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (providerId: string, modelId: string) => void;
}

export function ModelSelectorDialog({ open, onOpenChange, onSelect }: ModelSelectorDialogProps) {
    const { currentUser } = useUserContext();
    const { getSettings } = useSettings();
    const [providers, setProviders] = React.useState<any>({});

    // Providers definition
    const MODELS = [
        {
            id: 'local-fast',
            providerId: 'ollama',
            modelId: 'llama3:latest', // Or whatever is configured
            name: 'Local Speed (Ollama)',
            description: 'Fastest. Free. Runs on your machine.',
            icon: Zap,
            color: 'text-yellow-500',
            type: 'local',
            cost: 'Free'
        },
        {
            id: 'cloud-smart',
            providerId: 'openai',
            modelId: 'gpt-4o', // Default recommendation
            name: 'Cloud Power (GPT-4o)',
            description: 'Highest quality. Best for complex reasoning.',
            icon: Cloud,
            color: 'text-blue-500',
            type: 'cloud',
            cost: '~$0.05 / run'
        },
        {
            id: 'cloud-balanced',
            providerId: 'anthropic',
            modelId: 'claude-3-5-sonnet-20240620',
            name: 'Cloud Balanced (Claude 3.5)',
            description: 'Great writing style and analysis.',
            icon: Cloud,
            color: 'text-orange-500',
            type: 'cloud',
            cost: '~$0.03 / run'
        }
    ];

    React.useEffect(() => {
        if (open && currentUser) {
            checkAvailability();
        }
    }, [open, currentUser]);

    const checkAvailability = async () => {
        if (!currentUser) return;
        const settings = await getSettings(currentUser.id);
        if (settings?.aiProviders) {
            setProviders(settings.aiProviders);
        }
    };

    const isAvailable = (model: typeof MODELS[0]) => {
        const config = providers[model.providerId];
        if (!config) return false;
        if (!config.enabled) return false;
        // checking key for cloud
        if (model.type === 'cloud' && !config.apiKey) return false;
        return true;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select Intelligence Model</DialogTitle>
                    <DialogDescription>
                        Choose the AI model for this compilation task.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {MODELS.map((model) => {
                        const available = isAvailable(model);
                        return (
                            <Card
                                key={model.id}
                                className={`cursor-pointer transition-all hover:border-primary/50 relative ${!available ? 'opacity-50 grayscale' : ''}`}
                                onClick={() => available && onSelect(model.providerId, model.modelId)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <model.icon className={`w-4 h-4 ${model.color}`} />
                                            {model.name}
                                        </CardTitle>
                                        <Badge variant={model.type === 'local' ? 'outline' : 'secondary'} className="text-xs">
                                            {model.cost}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {model.description}
                                    </p>
                                    {!available && (
                                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                            Not configured in Settings
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
