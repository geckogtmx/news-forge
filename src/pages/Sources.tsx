import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2, Rss, RefreshCw, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useSources } from "@/hooks/useSources";
import { useUser } from "@/hooks/useUser";
import { RssSourceForm } from "@/components/sources/RssSourceForm";
import type { NewsSource } from "../../electron/main/db/schema";

export default function Sources() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const { getSourcesByUser, toggleSourceActive, deleteSource } = useSources();
  const { getUserById, createUser } = useUser();

  // Bootstrap default user and load sources
  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to get user 1, create if doesn't exist
      let user = await getUserById(1);
      if (!user) {
        user = await createUser({
          openId: 'local-user',
          name: 'Local User',
          email: 'user@localhost',
          loginMethod: 'local',
          role: 'user',
        });
      }

      if (user) {
        setUserId(user.id);
        const userSources = await getSourcesByUser(user.id);
        setSources(userSources || []);
      }
    } catch (err) {
      console.error('Failed to initialize:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getUserById, createUser, getSourcesByUser]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleRefreshSources = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const userSources = await getSourcesByUser(userId);
      setSources(userSources || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    const updated = await toggleSourceActive(id, !currentActive);
    if (updated) {
      setSources(sources.map(s => s.id === id ? { ...s, isActive: !currentActive } : s));
    }
  };

  const handleDeleteSource = async (id: number) => {
    const success = await deleteSource(id);
    if (success) {
      setSources(sources.filter(s => s.id !== id));
    }
  };

  const handleSourceAdded = () => {
    setIsAddDialogOpen(false);
    handleRefreshSources();
  };

  const sourceTypeLabels: Record<string, string> = {
    rss: "RSS Feed",
    gmail: "Gmail Newsletter",
    youtube: "YouTube Channel",
    website: "Website",
  };

  const sourceTypeIcons: Record<string, React.ReactNode> = {
    rss: <Rss className="w-4 h-4" />,
  };

  const getSourceUrl = (source: NewsSource): string | null => {
    const config = source.config as { url?: string } | null;
    return config?.url || null;
  };

  if (isLoading && sources.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading sources...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">News Sources</h1>
          <p className="text-muted-foreground mt-1">
            Configure your trusted news sources ({sources.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshSources}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-5 h-5 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add RSS Source</DialogTitle>
                <DialogDescription>
                  Enter a feed URL or website to discover and add an RSS source
                </DialogDescription>
              </DialogHeader>
              {userId ? (
                <RssSourceForm
                  userId={userId}
                  onSuccess={handleSourceAdded}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Unable to load form. Please ensure you're running in Electron.</p>
                  <p className="text-sm mt-2">Database operations require the Electron environment.</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-muted-foreground space-y-2">
              <Rss className="w-16 h-16 mx-auto opacity-30" />
              <p className="text-lg font-medium">No sources configured yet</p>
              <p className="text-sm">Add your first news source to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {sources.map((source) => (
              <Card key={source.id} className={`bg-card border-border ${!source.isActive ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-md">
                        {sourceTypeIcons[source.type] || <Rss className="w-4 h-4" />}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {source.name}
                          {!source.isActive && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {sourceTypeLabels[source.type] || source.type}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={source.isActive}
                        onCheckedChange={() => handleToggleActive(source.id, source.isActive)}
                      />
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Source</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{source.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSource(source.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getSourceUrl(source) && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">URL</p>
                      <a
                        href={getSourceUrl(source)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground break-all hover:text-accent flex items-center gap-1"
                      >
                        {getSourceUrl(source)}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                  {Array.isArray(source.topics) && source.topics.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {(source.topics as string[]).map((topic: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
