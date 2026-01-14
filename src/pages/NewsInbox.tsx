import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Search, ChevronRight, Filter, Globe, Loader2, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useRuns } from "@/hooks/useRuns";
import { useHeadlines } from "@/hooks/useHeadlines";
import type { RawHeadline } from "../../electron/main/db/schema";
import { useUser } from "@/hooks/useUser";

export default function NewsInbox() {
  const { startCollection } = useRuns();
  const { fetchHeadlinesByRun, toggleSelection, bulkSelect } = useHeadlines();
  // We need to fetch the current user ID properly.
  // For now, assume userId=1 as per the original mock logic.
  // Ideally, useAuth() or useUser() should provide this context.
  const userId = 1;

  const [runId, setRunId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [headlines, setHeadlines] = useState<RawHeadline[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery2, setSearchQuery2] = useState("");

  // Load headlines when runId changes
  useEffect(() => {
    if (runId) {
      loadHeadlines(runId);
    }
  }, [runId]);

  const loadHeadlines = async (id: number) => {
    try {
      const data = await fetchHeadlinesByRun(id);
      if (data) {
        setHeadlines(data);
        const count = data.filter(h => h.isSelected).length;
        setSelectedCount(count);
      }
    } catch (error) {
      console.error("[NewsInbox] Failed to load headlines:", error);
      toast.error("Failed to load headlines for this run");
    }
  };

  // Start a new run (Real Collection)
  const startNewRun = async () => {
    try {
      setIsInitializing(true);
      console.log("[NewsInbox] Starting new collection run...");

      // Call backend to start collection from all active sources
      // startCollection returns a RunResult { runId, ... }
      const result = await startCollection(userId);

      console.log("[NewsInbox] Collection Run started:", result);

      if (!result || !result.runId) {
        console.error("[NewsInbox] Failed to start run - result is invalid", result);
        toast.error("Failed to start collection run");
        setIsInitializing(false);
        return;
      }

      setRunId(result.runId);

      // The collection service creates headlines in the DB.
      // We need to fetch them now.
      await loadHeadlines(result.runId);

      toast.success(`Collection complete! Found ${result.totalHeadlines} headlines.`);

    } catch (error) {
      console.error("[NewsInbox] Failed to start new run:", error);
      toast.error("Failed to start new run. Check console for details.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Get unique categories (sources can serve as categories if actual category field is missing)
  // RawHeadline doesn't have 'category' field in schema, but 'source' (type) or we can use another way.
  // Schema: source (enum), title, description, url...
  // Wait, schema has 'source' enum: rss, gmail, youtube, etc.
  // But maybe we want to filter by the *name* of the source? 
  // RawHeadline only stores 'source' (type) and 'sourceId'.
  // We might want to fetch source names later, but for now filtering by type (source) is fine.
  // Or we can assume 'category' is not available yet without joining.
  // Let's filter by 'source' (type) for now as a proxy.
  const categories = Array.from(new Set(headlines.map((h) => h.source).filter(Boolean))) as string[];

  const handleSelectHeadline = async (id: number) => {
    const headline = headlines.find((h) => h.id === id);
    if (!headline) return;

    // Update database
    const result = await toggleSelection(id, !headline.isSelected);

    // Update local state
    setHeadlines(
      headlines.map((h) => {
        if (h.id === id) {
          const newSelected = !h.isSelected;
          setSelectedCount(newSelected ? selectedCount + 1 : selectedCount - 1);
          return { ...h, isSelected: newSelected };
        }
        return h;
      })
    );
  };

  const handleSelectAll = async () => {
    const allSelected = filteredHeadlines.every((h) => h.isSelected);
    const idsToUpdate = filteredHeadlines.map((h) => h.id);

    // Update database
    await bulkSelect(idsToUpdate, !allSelected);

    // Update local state
    const newHeadlines = headlines.map((h) => {
      if (filteredHeadlines.find((fh) => fh.id === h.id)) {
        return { ...h, isSelected: !allSelected };
      }
      return h;
    });
    setHeadlines(newHeadlines);
    const newCount = newHeadlines.filter((h) => h.isSelected).length;
    setSelectedCount(newCount);
  };

  const handleBroaderSearch = async () => {
    // Placeholder - implement search logic if needed
    toast.info("Web search is coming soon!");
    setIsSearchOpen(false);
  };

  const filteredHeadlines = headlines.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || h.source === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown date";
    // Convert string to Date if needed (SQLite returns strings or timestamps)
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">News Inbox</h1>
            <p className="text-muted-foreground mt-1">
              {runId ? (
                <>
                  Run #{runId} • {filteredHeadlines.length} of {headlines.length} headlines • {selectedCount} selected
                </>
              ) : (
                "Start a new run to collect headlines"
              )}
            </p>
          </div>
          {runId && (
            <Button
              onClick={startNewRun}
              disabled={isInitializing}
              variant="outline"
              className="border-border hover:bg-muted"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Run
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {!runId ? (
          // Empty state - no run started
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Search className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Active Run</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start a new run to collect headlines from your configured sources like RSS, YouTube, and more.
            </p>
            <Button
              onClick={startNewRun}
              disabled={isInitializing}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Collecting...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Run
                </>
              )}
            </Button>
          </div>
        ) : (
          // Active run - show headlines
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex gap-4 flex-col md:flex-row md:items-end">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-sm text-muted-foreground mb-2 block">
                    Search Headlines
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by title or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="w-full md:w-48">
                    <Label htmlFor="category" className="text-sm text-muted-foreground mb-2 block">
                      Source Type
                    </Label>
                    <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all">All types</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="border-border hover:bg-muted h-10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filteredHeadlines.length > 0 && filteredHeadlines.every((h) => h.isSelected) ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>

            {/* Headlines List */}
            {filteredHeadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg font-medium">No headlines found</p>
                <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHeadlines.map((headline) => (
                  <Card
                    key={headline.id}
                    className={`bg-card border-border cursor-pointer transition-all ${headline.isSelected ? "border-accent bg-accent/5 shadow-md" : "hover:border-muted-foreground"
                      }`}
                    onClick={() => handleSelectHeadline(headline.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex gap-4">
                        <Checkbox
                          checked={headline.isSelected}
                          onCheckedChange={() => handleSelectHeadline(headline.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <CardTitle className="text-base leading-tight">{headline.title}</CardTitle>
                            {/* RawHeadline uses 'source' (type) as label for now */}
                            <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded whitespace-nowrap flex-shrink-0">
                              {headline.source}
                            </span>
                          </div>
                          <CardDescription className="mt-2 line-clamp-2">{headline.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-xs text-muted-foreground flex-wrap gap-2">
                        <div className="flex gap-3">
                          <span className="font-medium capitalize">{headline.source}</span>
                          <span>{formatDate(headline.publishedAt)}</span>
                        </div>
                        <a
                          href={headline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Read more
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 border-t border-border flex justify-between items-center gap-4 flex-wrap">
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-border hover:bg-muted">
              <Globe className="w-4 h-4 mr-2" />
              Broader Web Search
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Search for Additional Headlines</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webSearch" className="text-sm font-medium text-foreground mb-2 block">
                  Search Query
                </Label>
                <Input
                  id="webSearch"
                  placeholder="Enter search terms (e.g., 'AI breakthroughs 2026')"
                  value={searchQuery2}
                  onChange={(e) => setSearchQuery2(e.target.value)}
                  className="bg-input border-border"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      handleBroaderSearch();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsSearchOpen(false)}
                  className="border-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBroaderSearch}
                  disabled={isSearching || !searchQuery2.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Headlines
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Link href={runId ? `/compile?runId=${runId}` : "#"}>
          <Button
            disabled={selectedCount === 0 || isInitializing || !runId}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Continue to Compile ({selectedCount})
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}
