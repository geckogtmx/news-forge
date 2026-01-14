import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Edit2, RefreshCw, Loader2, Zap, Sparkles, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useCompilation } from "@/hooks/useCompilation";
import { useCompiled } from "@/hooks/useCompiled";
import { useHeadlines } from "@/hooks/useHeadlines";
import { useRuns } from "@/hooks/useRuns";
import { useAI, type AIModel } from "@/hooks/useAI";
import { useSettings } from "@/hooks/useSettings";
import type { CompiledItem } from "../../electron/main/db/schema";

export default function Compilation() {
  const [location] = useLocation();
  const runId = new URLSearchParams(window.location.search).get('runId');

  const { compileRun, generateCompilation, isLoading: isCompiling, error: compileError } = useCompilation();
  const { compiledItems, fetchCompiledItemsByRun, updateCompiledItem, deleteCompiledItem, toggleSelection } = useCompiled();
  const { headlines, getSelectedHeadlines } = useHeadlines();
  const { run, fetchRunById } = useRuns();
  const { getModels } = useAI();
  const { getSettings: fetchSettings } = useSettings();

  const [items, setItems] = useState<CompiledItem[]>([]);
  const [selectedHeadlines, setSelectedHeadlines] = useState<typeof headlines>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<CompiledItem>>({});
  const [showCompileDialog, setShowCompileDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);
  // Local state for settings since hook is imperative
  const [settings, setSettings] = useState<any>(null);

  // Load run and compilations
  useEffect(() => {
    console.log("[Compilation] useEffect triggered. Location:", location, "RunId from URL:", runId);
    const loadData = async () => {
      if (runId) {
        const id = parseInt(runId);
        console.log("[Compilation] Loading data for runId:", id);
        fetchRunById(id);
        fetchCompiledItemsByRun(id);

        // Fetch user settings to get preferences
        try {
          const userSettings = await fetchSettings(1); // TODO: Get userId from auth
          setSettings(userSettings);
        } catch (e) {
          console.error("Failed to load settings", e);
        }

        // Use dedicated getSelectedHeadlines IPC instead of filter
        console.log("[Compilation] Calling getSelectedHeadlines for runId:", id);
        const headlineResult = await getSelectedHeadlines(id);
        console.log("[Compilation] getSelectedHeadlines result:", headlineResult, "count:", headlineResult?.length);
        setSelectedHeadlines(headlineResult || []);
      } else {
        console.warn("[Compilation] No runId in URL! Location:", location);
      }
    };
    loadData();
  }, [runId]);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await getModels();
        console.log("[Compilation] Fetched models:", models);
        setAvailableModels(models);
      } catch (error) {
        console.error("[Compilation] Failed to fetch models:", error);
      }
    };
    loadModels();
  }, [getModels]);

  // Set default model from settings when both are available
  useEffect(() => {
    if (availableModels.length > 0 && settings?.aiPreferences && !selectedModel) {
      const defaultModelId = (settings.aiPreferences as any).summarization;
      if (defaultModelId && availableModels.some(m => m.id === defaultModelId)) {
        setSelectedModel(defaultModelId);
      } else if (availableModels.length > 0) {
        setSelectedModel(availableModels[0].id);
      }
    }
  }, [availableModels, settings, selectedModel]);


  // Update local state when compiledItems change
  useEffect(() => {
    console.log("[Compilation] compiledItems changed:", compiledItems);
    if (compiledItems) {
      setItems(compiledItems);
      setSelectedCount(compiledItems.filter(item => item.isSelected).length);
    }
  }, [compiledItems]);

  // Log selectedHeadlines when they change
  useEffect(() => {
    console.log("[Compilation] selectedHeadlines changed:", selectedHeadlines);
  }, [selectedHeadlines]);

  // Estimate cost based on model and headline count
  useEffect(() => {
    if (selectedHeadlines && selectedModel) {
      const headlineCount = selectedHeadlines.length;
      // Rough estimation: ~100 tokens per headline, ~500 tokens output per group
      const estimatedTokens = headlineCount * 100 + (headlineCount / 3) * 500;

      // Cost per 1M tokens (approximate)
      const costs: Record<string, number> = {
        'qwen2.5:7b': 0,
        'qwen2.5:14b': 0,
        'gpt-4o-mini': 0.15,
        'gpt-4o': 2.5,
        'claude-3.5-sonnet': 3.0,
        'deepseek-chat': 0.14,
      };

      // Try to find exact match or default to standard API pricing
      let costPer1M = costs[selectedModel];

      // If not known, try to guess based on provider
      if (costPer1M === undefined) {
        const model = availableModels.find(m => m.id === selectedModel);
        if (model?.providerId === 'ollama' || model?.isLocal) {
          costPer1M = 0;
        } else {
          costPer1M = 1.0; // Fallback
        }
      }

      setEstimatedCost((estimatedTokens * costPer1M) / 1_000_000);
    }
  }, [selectedHeadlines, selectedModel, availableModels]);

  const handleSelectItem = async (id: number) => {
    // Optimistic update
    setItems(items.map(item =>
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    ));

    // Update count immediately based on new state
    const item = items.find(i => i.id === id);
    if (item) {
      const newSelected = !item.isSelected;
      setSelectedCount(prev => newSelected ? prev + 1 : prev - 1);

      // Perform backend update
      try {
        await toggleSelection(id, newSelected);
      } catch (error) {
        // Revert on failure
        console.error("Selection failed", error);
        setItems(items.map(i => i.id === id ? item : i));
        setSelectedCount(prev => newSelected ? prev - 1 : prev + 1);
        toast.error("Failed to update selection");
      }
    }
  };

  const handleSelectAll = async () => {
    const allSelected = items.every((item) => item.isSelected);
    for (const item of items) {
      await toggleSelection(item.id, !allSelected);
    }
    setSelectedCount(allSelected ? 0 : items.length);
  };

  const handleEditStart = (item: CompiledItem) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  };

  const handleEditSave = async () => {
    if (editingId && editValues.id === editingId) {
      await updateCompiledItem(editingId, {
        topic: editValues.topic,
        hook: editValues.hook,
        summary: editValues.summary,
      });
      setEditingId(null);
      setEditValues({});
      toast.success("Item updated successfully");
    }
  };

  const handleRegenerate = async (id: number) => {
    if (!runId) return;

    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      // Mark as regenerating
      setItems(items.map(i => i.id === id ? { ...i, isRegenerating: true } : i));

      // Get the source headlines for this compilation
      const sourceHeadlineIds = item.sourceHeadlineIds as number[];
      const sourceHeadlines = selectedHeadlines?.filter(h => sourceHeadlineIds.includes(h.id)) || [];

      // Determine provider from model
      const model = availableModels.find(m => m.id === selectedModel);
      const providerId = model?.providerId || 'ollama';

      // Regenerate using the compilation service
      const result = await generateCompilation(
        {
          headlines: sourceHeadlines,
          topic: item.topic,
          similarity: 1.0,
        },
        parseInt(runId),
        {
          userId: 1, // TODO: Get from auth
          modelId: selectedModel,
          providerId
        }
      );

      if (result) {
        // Update the item with new content
        await updateCompiledItem(id, {
          topic: result.compiledItem.topic,
          hook: result.compiledItem.hook,
          summary: result.compiledItem.summary,
        });
        toast.success(`Regenerated with ${selectedModel} ($${result.cost.toFixed(4)})`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate item");
    } finally {
      setItems(items.map(i => i.id === id ? { ...i, isRegenerating: false } : i));
    }
  };

  const handleCompileNow = async () => {
    if (!runId) return;

    try {
      // Find provider ID from available models
      const model = availableModels.find(m => m.id === selectedModel);
      let providerId = model?.providerId;

      // Fallback inference if somehow modellist is empty but selectedModel is set
      if (!providerId) {
        if (selectedModel.includes('gpt')) providerId = 'openai';
        else if (selectedModel.includes('claude')) providerId = 'anthropic';
        else if (selectedModel.includes('gemini')) providerId = 'google';
        else if (selectedModel.includes('deepseek')) providerId = 'deepseek';
        else providerId = 'ollama';
      }

      const results = await compileRun(parseInt(runId), {
        userId: 1, // TODO: Get from auth
        modelId: selectedModel,
        providerId,
        maxGroups: 10,
        similarityThreshold: 0.3,
      });

      if (results && results.length > 0) {
        const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
        const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);

        toast.success(
          `Generated ${results.length} compilations using ${selectedModel}`,
          {
            description: `${totalTokens} tokens • $${totalCost.toFixed(4)}`,
          }
        );

        setShowCompileDialog(false);
        // Refresh compilations
        await fetchCompiledItemsByRun(parseInt(runId));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to compile headlines");
    }
  };

  const selectedHeadlineCount = selectedHeadlines?.length || 0;
  const hasCompiledItems = items.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Compilation Review</h1>
        <p className="text-muted-foreground mt-1">
          {items.length} compiled items • {selectedCount} selected for content package
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          {/* Info Box */}
          <Card className="bg-accent/10 border-accent/20">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-base text-accent">AI-Powered Compilation</CardTitle>
                  <CardDescription className="text-accent/80 mt-1">
                    {hasCompiledItems
                      ? "These items were automatically compiled from your selected headlines. Review, edit, and select the ones you want to turn into YouTube content."
                      : `You have ${selectedHeadlineCount} selected headlines ready to compile. Click "Compile Headlines" to generate AI-powered summaries.`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Compile Button (if no compilations yet) */}
          {!hasCompiledItems && selectedHeadlineCount > 0 && (
            <Card className="border-2 border-dashed border-accent/30">
              <CardContent className="pt-6 text-center">
                <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Compile</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedHeadlineCount} headlines selected • Click below to generate AI compilations
                </p>
                <Dialog open={showCompileDialog} onOpenChange={setShowCompileDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Compile Headlines
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Compile Headlines with AI</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>AI Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name} {model.isLocal ? '(Local)' : '(Cloud)'}
                              </SelectItem>
                            ))}
                            {availableModels.length === 0 && (
                              <SelectItem value="loading" disabled>Loading models...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Headlines:</span>
                          <span className="font-medium">{selectedHeadlineCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Cost:</span>
                          <span className="font-medium flex items-center gap-1">
                            {estimatedCost === 0 ? (
                              'Free (Local)'
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3" />
                                {estimatedCost.toFixed(4)}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCompileDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCompileNow}
                        disabled={isCompiling || !selectedModel}
                        className="bg-accent hover:bg-accent/90"
                      >
                        {isCompiling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Compiling...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Compile Now
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Select All Button */}
          {hasCompiledItems && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {items.length} items available
              </p>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="border-border hover:bg-muted"
              >
                {items.every((item) => item.isSelected) ? "Deselect All" : "Select All"}
              </Button>
            </div>
          )}

          {/* Compiled Items */}
          {hasCompiledItems && (
            <div className="space-y-4">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`bg-card border-border transition-all ${item.isSelected ? "border-accent bg-accent/5 shadow-md" : "hover:border-muted-foreground"
                    }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex gap-4">
                      <Checkbox
                        checked={item.isSelected}
                        onCheckedChange={() => handleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <CardTitle className="text-lg">{item.topic}</CardTitle>
                          <Badge variant="outline" className="border-muted-foreground text-muted-foreground flex-shrink-0">
                            {(item.sourceHeadlineIds as number[])?.length || 0} sources
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-accent mb-2">{item.hook}</p>
                        <CardDescription className="line-clamp-2 text-muted-foreground">
                          {item.summary}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {editingId === item.id ? (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                        <div>
                          <Label htmlFor={`topic-${item.id}`} className="text-sm font-medium text-foreground mb-2 block">
                            Topic
                          </Label>
                          <Input
                            id={`topic-${item.id}`}
                            value={editValues.topic || ""}
                            onChange={(e) => setEditValues({ ...editValues, topic: e.target.value })}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`hook-${item.id}`} className="text-sm font-medium text-foreground mb-2 block">
                            Hook
                          </Label>
                          <Input
                            id={`hook-${item.id}`}
                            value={editValues.hook || ""}
                            onChange={(e) => setEditValues({ ...editValues, hook: e.target.value })}
                            className="bg-input border-border"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`summary-${item.id}`} className="text-sm font-medium text-foreground mb-2 block">
                            Summary
                          </Label>
                          <Textarea
                            id={`summary-${item.id}`}
                            value={editValues.summary || ""}
                            onChange={(e) => setEditValues({ ...editValues, summary: e.target.value })}
                            className="bg-input border-border min-h-24"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="border-border hover:bg-muted"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleEditSave}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate(item.id)}
                          disabled={(item as any).isRegenerating}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {(item as any).isRegenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(item)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 border-t border-border flex justify-between items-center gap-4 flex-wrap">
        <Link href="/run">
          <Button variant="outline" className="border-border hover:bg-muted">
            Back to Inbox
          </Button>
        </Link>
        <Link href={`/content?runId=${runId}`}>
          <Button
            disabled={selectedCount === 0}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Create Content Package ({selectedCount})
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
