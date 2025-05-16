import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeTextWithOpenAI } from "@/services/openaiService";

interface AIAnalysisProps {
  jsonData: string | null;
}

export interface AnalysisProfile {
  id: string;
  name: string;
  prompt: string;
}

const DEFAULT_PROFILES: AnalysisProfile[] = [
  {
    id: "sentiment",
    name: "Анализ настроений",
    prompt: "Проанализируй следующие твиты и определи общее настроение авторов. Предоставь сводку о том, какие эмоции преобладают, и выдели ключевые темы, вызывающие положительные и отрицательные реакции.",
  },
  {
    id: "topics",
    name: "Выделение тем",
    prompt: "Проанализируй следующие твиты и выдели 5-7 основных тем, о которых говорят авторы. Для каждой темы укажи её важность и примеры цитат из твитов.",
  },
  {
    id: "engagement",
    name: "Анализ вовлеченности",
    prompt: "Проанализируй следующие твиты и определи, какие типы контента привлекают наибольшее внимание. Укажи факторы, которые влияют на количество лайков, ретвитов и комментариев.",
  },
];

const AIAnalysis: React.FC<AIAnalysisProps> = ({ jsonData }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("sentiment");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [profiles, setProfiles] = useState<AnalysisProfile[]>(DEFAULT_PROFILES);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const { toast } = useToast();

  // Load API key from local storage if available
  React.useEffect(() => {
    const storedApiKey = localStorage.getItem("openai_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  React.useEffect(() => {
    // Update custom prompt when profile changes
    const selectedProfile = profiles.find(p => p.id === selectedProfileId);
    if (selectedProfile) {
      setCustomPrompt(selectedProfile.prompt);
    }
  }, [selectedProfileId, profiles]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    localStorage.setItem("openai_api_key", value);
  };

  const handleSaveProfile = () => {
    if (!newProfileName || !customPrompt) {
      toast({
        title: "Missing information",
        description: "Profile name and prompt are required",
        variant: "destructive",
      });
      return;
    }

    // If editing existing profile
    if (isEditing) {
      setProfiles(profiles.map(p => 
        p.id === selectedProfileId ? { ...p, name: newProfileName, prompt: customPrompt } : p
      ));
      setIsEditing(false);
      toast({ title: "Profile updated", description: `Profile "${newProfileName}" has been updated` });
    } else {
      // Creating new profile
      const newId = `profile-${Date.now()}`;
      setProfiles([...profiles, { id: newId, name: newProfileName, prompt: customPrompt }]);
      setSelectedProfileId(newId);
      toast({ title: "Profile created", description: `New profile "${newProfileName}" created` });
    }
    
    setNewProfileName("");
  };

  const handleEditProfile = () => {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (profile) {
      setNewProfileName(profile.name);
      setIsEditing(true);
    }
  };

  const handleDeleteProfile = () => {
    // Don't allow deletion of default profiles
    const profileToDelete = profiles.find(p => p.id === selectedProfileId);
    if (!profileToDelete || DEFAULT_PROFILES.some(dp => dp.id === profileToDelete.id)) {
      toast({
        title: "Cannot delete",
        description: "Default profiles cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    setProfiles(profiles.filter(p => p.id !== selectedProfileId));
    setSelectedProfileId("sentiment"); // Reset to default
    toast({ title: "Profile deleted", description: `Profile "${profileToDelete.name}" has been deleted` });
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    if (!jsonData) {
      toast({
        title: "No data to analyze",
        description: "Please scrape Twitter data first or ensure JSON data is available",
        variant: "destructive",
      });
      return;
    }

    if (!customPrompt) {
      toast({
        title: "Missing prompt",
        description: "Please select a profile or enter a custom prompt",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult("");

    try {
      const result = await analyzeTextWithOpenAI({
        apiKey,
        prompt: customPrompt,
        textData: jsonData,
      });

      setAnalysisResult(result);
      toast({ title: "Analysis complete", description: "AI has analyzed the Twitter data" });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
        <CardDescription>
          Analyze Twitter data using OpenAI models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input
            id="openai-key"
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            className="mt-1"
            placeholder="Enter your OpenAI API key"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your API key will be saved in your browser's local storage.
          </p>
        </div>

        <div>
          <Label htmlFor="analysis-profile">Analysis Profile</Label>
          <Select
            value={selectedProfileId}
            onValueChange={setSelectedProfileId}
          >
            <SelectTrigger id="analysis-profile" className="mt-1">
              <SelectValue placeholder="Select a profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="custom-prompt">Custom Prompt</Label>
          <Textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom analysis prompt..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="border p-4 rounded-md space-y-4">
          <h3 className="font-medium">Save or Edit Profile</h3>
          <div>
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Enter profile name"
              className="mt-1"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSaveProfile}>
              {isEditing ? "Update Profile" : "Save as New Profile"}
            </Button>
            <Button variant="outline" onClick={handleEditProfile}>
              Edit Current Profile
            </Button>
            <Button variant="outline" onClick={handleDeleteProfile}>
              Delete Profile
            </Button>
          </div>
        </div>

        {analysisResult && (
          <div>
            <Label htmlFor="analysis-result">Analysis Result</Label>
            <Textarea
              id="analysis-result"
              value={analysisResult}
              readOnly
              className="mt-1 min-h-[200px]"
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !apiKey || !jsonData || !customPrompt}
          className="w-full"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Twitter Data"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIAnalysis;
