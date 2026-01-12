import { useState, useEffect } from 'react';
import { useSources } from '@/hooks/useSources';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, RefreshCw, Rss, Globe, Mail, Youtube } from 'lucide-react';
import { RssSourceForm } from '@/components/sources/RssSourceForm';
import { GmailSourceForm } from '@/components/sources/GmailSourceForm';
import { AddYoutubeVideoDialog } from '@/components/youtube/AddYoutubeVideoDialog';
import { YoutubeSourceForm } from '@/components/sources/YoutubeSourceForm';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Sources() {
  const { getSourcesByUser, deleteSource, toggleSourceActive, loading } = useSources();
  const { getUserById, createUser } = useUser();
  const [sources, setSources] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [sourceToEdit, setSourceToEdit] = useState<any | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<number | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // 1. Get or create default user
    let user = await getUserById(1);
    if (!user) {
      console.log('Bootstrapping default user...');
      user = await createUser({
        openId: 'local-user',
        name: 'Local User',
        email: 'user@localhost',
      });
    }

    if (user) {
      setUserId(user.id);
      loadSources(user.id);
    }
  };

  const loadSources = async (uid: number) => {
    const data = await getSourcesByUser(uid);
    if (data) setSources(data);
  };

  const handleSourceAdded = () => {
    setIsAddDialogOpen(false);
    setSourceToEdit(null);
    if (userId) loadSources(userId);
  };

  const handleEdit = (source: any) => {
    setSourceToEdit(source);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (sourceToDelete) {
      await deleteSource(sourceToDelete);
      setSourceToDelete(null);
      if (userId) loadSources(userId);
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    await toggleSourceActive(id, !current);
    if (userId) loadSources(userId);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'rss': return <Rss className="h-5 w-5 text-orange-500" />;
      case 'gmail': return <Mail className="h-5 w-5 text-red-500" />;
      case 'youtube': return <Youtube className="h-5 w-5 text-red-600" />;
      default: return <Globe className="h-5 w-5 text-blue-500" />;
    }
  };

  // Helper for safe JSON parsing
  const safeJsonParse = (jsonString: string | any, fallback: any = []) => {
    if (!jsonString) return fallback;
    if (typeof jsonString !== 'string') return jsonString;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse error:", e);
      return fallback;
    }
  };

  const getSourceMeta = (source: any) => {
    try {
      const config = safeJsonParse(source.config, {});
      if (source.type === 'rss') {
        return config.url || 'No URL';
      } else if (source.type === 'gmail') {
        if (config.labelName) {
          return `Label: ${config.labelName}`;
        }
        const labels = config.filters?.labels || [];
        if (labels.length > 0) {
          return `Label: ${labels.join(', ')}`;
        }
        return 'Gmail Integration';
      } else if (source.type === 'youtube') {
        return config.url || 'No URL';
      }
      return 'Unknown Source';
    } catch (e) {
      return 'Invalid Config';
    }
  };

  const getSourceUrl = (source: any) => {
    try {
      const config = safeJsonParse(source.config, {});
      return config.url || (source.type === 'gmail' ? 'Gmail Integration' : 'No URL');
    } catch (e) {
      return 'Invalid Config';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">News Sources</h1>
          <p className="text-muted-foreground">Configure your trusted news sources ({sources.length} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => userId && loadSources(userId)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setSourceToEdit(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setSourceToEdit(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{sourceToEdit ? 'Edit Source' : 'Add News Source'}</DialogTitle>
                <DialogDescription>
                  {sourceToEdit ? 'Update configuration for this source' : 'Connect a new source to gather content'}
                </DialogDescription>
              </DialogHeader>

              {userId ? (
                <Tabs defaultValue={sourceToEdit?.type || "rss"} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rss" className="flex items-center gap-2" disabled={sourceToEdit && sourceToEdit.type !== 'rss'}>
                      <Rss className="h-4 w-4" /> RSS Feed
                    </TabsTrigger>
                    <TabsTrigger value="gmail" className="flex items-center gap-2" disabled={sourceToEdit && sourceToEdit.type !== 'gmail'}>
                      <Mail className="h-4 w-4" /> Gmail
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="flex items-center gap-2" disabled={sourceToEdit && sourceToEdit.type !== 'youtube'}>
                      <Youtube className="h-4 w-4" /> YouTube
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4">
                    <TabsContent value="rss">
                      <RssSourceForm
                        userId={userId}
                        onSuccess={handleSourceAdded}
                        onCancel={() => {
                          setIsAddDialogOpen(false);
                          setSourceToEdit(null);
                        }}
                        initialValues={sourceToEdit}
                      />
                    </TabsContent>
                    <TabsContent value="gmail">
                      <GmailSourceForm
                        userId={userId}
                        onSuccess={handleSourceAdded}
                        onCancel={() => {
                          setIsAddDialogOpen(false);
                          setSourceToEdit(null);
                        }}
                        initialValues={sourceToEdit}
                      />
                    </TabsContent>
                    <TabsContent value="youtube">
                      <YoutubeSourceForm
                        userId={userId}
                        onSuccess={handleSourceAdded}
                        onCancel={() => {
                          setIsAddDialogOpen(false);
                          setSourceToEdit(null);
                        }}
                        initialValues={sourceToEdit}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
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

      {sources.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No sources configured yet</p>
          <p className="text-sm">Add your first news source to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sources.map((source) => (
            <Card key={source.id} className="transition-all hover:bg-accent/5">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-background rounded-full border shadow-sm">
                    {getSourceIcon(source.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {source.name}
                      {!source.isActive && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize bg-muted px-2 py-0.5 rounded text-xs">
                        {source.type}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {getSourceMeta(source)}
                        {source.type === 'rss' && <Globe className="h-3 w-3" />}
                      </span>
                    </div>
                    {safeJsonParse(source.topics).length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {safeJsonParse(source.topics).map((t: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={source.isActive === 1 || source.isActive === true}
                      onCheckedChange={() => handleToggleActive(source.id, source.isActive)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(source)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setSourceToDelete(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!sourceToDelete} onOpenChange={(open) => !open && setSourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source?</AlertDialogTitle>
            <AlertDialogDescription>
              are you sure you want to delete this news source? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
