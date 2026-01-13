import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AISettings } from "@/components/settings/AISettings";

export default function Settings() {
  // TODO: Fetch from API
  const [settings, setSettings] = useState({
    tone: "professional",
    format: "standard",
    obsidianVaultPath: "/Users/gecko/Obsidian/NewsForge",
    llmModel: "gpt-4",
    outputStructure: `# {title}

## Hook
{hook}

## Summary
{summary}

## Key Points
{keyPoints}

## Sources
{sources}`,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Call API to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const toneOptions = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "technical", label: "Technical" },
    { value: "creative", label: "Creative" },
  ];

  const formatOptions = [
    { value: "standard", label: "Standard" },
    { value: "detailed", label: "Detailed" },
    { value: "brief", label: "Brief" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your NewsForge preferences</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="ai">AI & Models</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              {/* Output Structure */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Output Structure Template</CardTitle>
                  <CardDescription>Define the structure for generated content items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="structure" className="text-sm font-medium text-foreground mb-2 block">
                      Template
                    </Label>
                    <Textarea
                      id="structure"
                      value={settings.outputStructure}
                      onChange={(e) => setSettings({ ...settings, outputStructure: e.target.value })}
                      className="bg-input border-border font-mono text-xs min-h-48"
                      placeholder="Enter your custom output template..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use placeholders like {"{title}"}, {"{hook}"}, {"{summary}"}, {"{keyPoints}"}, {"{sources}"} to customize the output format
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Export Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Export Settings</CardTitle>
                  <CardDescription>Configure where your content is exported</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Obsidian Vault Path */}
                  <div>
                    <Label htmlFor="obsidianPath" className="text-sm font-medium text-foreground mb-2 block">
                      Obsidian Vault Path
                    </Label>
                    <Input
                      id="obsidianPath"
                      value={settings.obsidianVaultPath}
                      onChange={(e) => setSettings({ ...settings, obsidianVaultPath: e.target.value })}
                      placeholder="/path/to/your/obsidian/vault"
                      className="bg-input border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The path where your Obsidian vault is located. Content will be exported here.
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Obsidian Integration</p>
                      <p>
                        Make sure your Obsidian vault is accessible from this location. Content will be organized in a
                        dated folder structure (e.g., 2026-01-09).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button for General */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="border-border hover:bg-muted">
                  Reset to Defaults
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ai">
              <AISettings />
            </TabsContent>

            <TabsContent value="advanced">
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                Advanced settings coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
