import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Edit2, Copy, Download, Loader2, Play, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useContentPackages } from "@/hooks/useContentPackages";
import { useCompiled } from "@/hooks/useCompiled";
import { useRuns } from "@/hooks/useRuns";
import type { ContentPackage, CompiledItem } from "../../electron/main/db/schema";

export default function ContentPackagePage() {
  const [location] = useLocation();
  const runId = new URLSearchParams(window.location.search).get('runId');

  const {
    packages,
    fetchPackagesByRun,
    createPackage,
    updatePackage,
    generatePackageContent,
    finalizePackage,
    loading: packagesLoading
  } = useContentPackages();

  const { compiledItems, getSelectedCompiledItems } = useCompiled();

  const [selectedAsset, setSelectedAsset] = useState<ContentPackage | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ContentPackage>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<number>>(new Set());

  // specialized hook/function missing in useCompiled, implementing generic fetch for now
  // Assuming useCompiled has a way to get selected items or we filter them
  const [selectedCompiledItems, setSelectedCompiledItems] = useState<CompiledItem[]>([]);

  useEffect(() => {
    const initData = async () => {
      if (!runId) return;
      const rId = parseInt(runId);

      setIsInitializing(true);
      try {
        // 1. Fetch Selected Compiled Items
        const items = await getSelectedCompiledItems(rId);
        if (items) setSelectedCompiledItems(items);

        // 2. Fetch Existing Packages
        const existingPackages = await fetchPackagesByRun(rId);

        // 3. Create Drafts for missing items
        if (items && existingPackages) {
          const missingItems = items.filter(
            item => !existingPackages.find(p => p.compiledItemId === item.id)
          );

          if (missingItems.length > 0) {
            toast.info(`Initializing ${missingItems.length} content packages...`);
            for (const item of missingItems) {
              await createPackage({
                runId: rId,
                compiledItemId: item.id,
                status: 'draft',
                youtubeTitle: '',
                youtubeDescription: '',
                scriptOutline: ''
              });
            }
            // Refresh packages after creation
            await fetchPackagesByRun(rId);
          }
        }
      } catch (error) {
        console.error("Failed to initialize content packages", error);
        toast.error("Failed to load content packages");
      } finally {
        setIsInitializing(false);
      }
    };

    initData();
  }, [runId]);

  // Set default selection
  useEffect(() => {
    if (!selectedAsset && packages.length > 0) {
      setSelectedAsset(packages[0]);
    } else if (selectedAsset) {
      // Update selected asset reference when packages change
      const updated = packages.find(p => p.id === selectedAsset.id);
      if (updated) setSelectedAsset(updated);
    }
  }, [packages, selectedAsset]);

  const handleEditStart = (asset: ContentPackage) => {
    setEditingId(asset.id);
    setEditValues({ ...asset });
  };

  const handleEditSave = async () => {
    if (editingId && editValues.id === editingId) {
      try {
        await updatePackage(editingId, {
          youtubeTitle: editValues.youtubeTitle,
          youtubeDescription: editValues.youtubeDescription,
          scriptOutline: editValues.scriptOutline
        });
        setEditingId(null);
        setEditValues({});
        toast.success("Asset updated successfully");
      } catch (e) {
        toast.error("Failed to save changes");
      }
    }
  };

  const handleRegenerate = async (id: number) => {
    if (!runId) return;

    setRegeneratingIds(prev => new Set(prev).add(id));
    try {
      // TODO: Get userId from auth context
      const userId = 1;
      await generatePackageContent(id, userId);
      toast.success("Content generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate content");
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleFinalize = async (id: number) => {
    try {
      await finalizePackage(id);
      toast.success("Package finalized");
    } catch (e) {
      toast.error("Failed to finalize package");
    }
  };

  const handleCopy = (text: string | null | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Helper to get topic from compiled item
  const getTopic = (pkg: ContentPackage) => {
    const item = selectedCompiledItems.find(i => i.id === pkg.compiledItemId);
    return item?.topic || "Unknown Topic";
  };

  const getSummary = (pkg: ContentPackage) => {
    const item = selectedCompiledItems.find(i => i.id === pkg.compiledItemId);
    return item?.summary || "";
  };

  if (!runId) return <div className="p-8">Missing Run ID</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Content Package</h1>
        <p className="text-muted-foreground mt-1">
          {packages.length} YouTube-ready content packages • {packages.filter((a) => a.status === "ready").length} finalized
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isInitializing ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="ml-3 text-muted-foreground">Loading packages...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assets List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Content Assets</h3>
              <div className="space-y-2">
                {packages.map((asset) => (
                  <Card
                    key={asset.id}
                    className={`bg-card border-border cursor-pointer transition-all ${selectedAsset?.id === asset.id ? "border-accent bg-accent/5" : "hover:border-muted-foreground"
                      }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm line-clamp-1">{getTopic(asset)}</CardTitle>
                        <Badge
                          variant={asset.status === "ready" || asset.status === "exported" ? "default" : "outline"}
                          className={asset.status === "ready" || asset.status === "exported" ? "bg-accent text-accent-foreground" : ""}
                        >
                          {asset.status === "ready" || asset.status === "exported" ? "✓" : "Draft"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {asset.youtubeTitle ? "Content Generated" : "Pending Generation"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                {packages.length === 0 && (
                  <div className="text-muted-foreground text-sm italic">
                    No packages found. Ensure you have selected items in the Compilation Review.
                  </div>
                )}
              </div>
            </div>

            {/* Asset Details */}
            {selectedAsset && (
              <div className="lg:col-span-2 space-y-6">
                {/* Context Card */}
                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base text-accent">Source Topic: {getTopic(selectedAsset)}</CardTitle>
                    <CardDescription className="line-clamp-2">{getSummary(selectedAsset)}</CardDescription>
                  </CardHeader>
                </Card>

                {editingId === selectedAsset.id ? (
                  <div className="space-y-4">
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle>Edit Content Asset</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                            YouTube Title
                          </Label>
                          <Input
                            id="title"
                            value={editValues.youtubeTitle || ""}
                            onChange={(e) => setEditValues({ ...editValues, youtubeTitle: e.target.value })}
                            className="bg-input border-border"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {(editValues.youtubeTitle || "").length}/60 characters
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-sm font-medium text-foreground mb-2 block">
                            YouTube Description
                          </Label>
                          <Textarea
                            id="description"
                            value={editValues.youtubeDescription || ""}
                            onChange={(e) => setEditValues({ ...editValues, youtubeDescription: e.target.value })}
                            className="bg-input border-border min-h-32"
                          />
                        </div>

                        <div>
                          <Label htmlFor="script" className="text-sm font-medium text-foreground mb-2 block">
                            Script Outline
                          </Label>
                          <Textarea
                            id="script"
                            value={editValues.scriptOutline || ""}
                            onChange={(e) => setEditValues({ ...editValues, scriptOutline: e.target.value })}
                            className="bg-input border-border min-h-32 font-mono text-xs"
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
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Generation State Check */}
                    {!selectedAsset.youtubeTitle ? (
                      <Card className="border-dashed border-2 p-8 text-center">
                        <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Generate Content</h3>
                        <p className="text-muted-foreground mb-4">
                          Use AI to generate a title, description, and script outline for this topic.
                        </p>
                        <Button
                          onClick={() => handleRegenerate(selectedAsset.id)}
                          disabled={regeneratingIds.has(selectedAsset.id)}
                          className="bg-accent text-accent-foreground"
                        >
                          {regeneratingIds.has(selectedAsset.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Package
                            </>
                          )}
                        </Button>
                      </Card>
                    ) : (
                      <>
                        {/* YouTube Title */}
                        <Card className="bg-card border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Play className="w-5 h-5 text-accent" />
                                <CardTitle>YouTube Title</CardTitle>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(selectedAsset.youtubeTitle)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm font-medium text-foreground">{selectedAsset.youtubeTitle}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {selectedAsset.youtubeTitle.length}/60 characters
                            </p>
                          </CardContent>
                        </Card>

                        {/* YouTube Description */}
                        <Card className="bg-card border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-accent" />
                                <CardTitle>YouTube Description</CardTitle>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(selectedAsset.youtubeDescription)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                              {selectedAsset.youtubeDescription}
                            </p>
                          </CardContent>
                        </Card>

                        {/* Script Outline */}
                        <Card className="bg-card border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle>Script Outline</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(selectedAsset.scriptOutline)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap line-clamp-8">
                              {selectedAsset.scriptOutline}
                            </p>
                          </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            onClick={() => handleRegenerate(selectedAsset.id)}
                            disabled={regeneratingIds.has(selectedAsset.id)}
                            className="border-border hover:bg-muted"
                          >
                            {regeneratingIds.has(selectedAsset.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-2" />
                                Regenerate with LLM
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleEditStart(selectedAsset)}
                            className="border-border hover:bg-muted"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="border-border hover:bg-muted"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {selectedAsset.status !== "ready" && selectedAsset.status !== "exported" && (
                            <Button
                              onClick={() => handleFinalize(selectedAsset.id)}
                              className="bg-accent hover:bg-accent/90 text-accent-foreground"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Finalize
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 border-t border-border flex justify-between items-center gap-4 flex-wrap">
        <Link href={`/compilation?runId=${runId}`}>
          <Button variant="outline" className="border-border hover:bg-muted">
            Back to Compilation
          </Button>
        </Link>
        <Link href="/review">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Review & Export
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

