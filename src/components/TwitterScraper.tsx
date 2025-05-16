
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { scrapeTwitterData } from "@/services/twitterScraperService";
import { processAndFilterTwitterData, convertTwitterDataToJson, downloadJson, ProcessedTweet } from "@/utils/jsonExport";

interface TwitterScraperProps {
  onDataScraped: (data: ProcessedTweet[]) => void;
}

// Важно: Этот токен предоставлен пользователем для тестирования.
// В реальном приложении его следует получать более безопасным способом.
const DEFAULT_TEST_APIFY_TOKEN = "apify_api_ExcsJBIeKbdBl75dLxYAHK9fAZkOQv2Ct73I";

const TwitterScraper: React.FC<TwitterScraperProps> = ({ onDataScraped }) => {
  const [apiToken, setApiToken] = useState<string>("");
  const [twitterUrls, setTwitterUrls] = useState<string>("");
  const [tweetsDesired, setTweetsDesired] = useState<number>(10);
  const [withReplies, setWithReplies] = useState<boolean>(true); // Keep as Apify param, though not in filtered output
  const [includeUserInfo, setIncludeUserInfo] = useState<boolean>(true); // Keep as Apify param for bio
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrapedData, setScrapedData] = useState<ProcessedTweet[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem("apify_token");
    if (storedToken) {
      setApiToken(storedToken);
    } else {
      // Use default test token if nothing is in local storage
      setApiToken(DEFAULT_TEST_APIFY_TOKEN); 
    }
  }, []);

  const handleApiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiToken(value);
    localStorage.setItem("apify_token", value);
  };

  const handleSubmit = async () => {
    if (!apiToken) {
      toast({
        title: "Missing API Token",
        description: "Please enter your Apify API token",
        variant: "destructive",
      });
      return;
    }

    if (!twitterUrls.trim()) {
      toast({
        title: "Missing Twitter URLs",
        description: "Please enter at least one Twitter URL",
        variant: "destructive",
      });
      return;
    }

    const urlList = twitterUrls
      .split("\n")
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length === 0) {
      toast({
        title: "Invalid Twitter URLs",
        description: "Please enter at least one valid Twitter URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setScrapedData(null); // Clear previous results before new scrape
    onDataScraped([]);    // Notify parent to clear its data too

    try {
      const rawData = await scrapeTwitterData({
        apiToken,
        twitterUrls: urlList,
        tweetsDesired,
        withReplies,
        includeUserInfo,
      });
      
      const processedData = processAndFilterTwitterData(rawData);

      setScrapedData(processedData);
      onDataScraped(processedData);
      
      toast({
        title: "Data scraped successfully!",
        description: `Retrieved ${processedData.length} tweets.`,
      });
    } catch (error) {
      console.error("Failed to scrape data:", error);
      // setScrapedData(null); // Already cleared at the beginning of try
      // onDataScraped([]);   // Already cleared at the beginning of try
      toast({
        title: "Failed to scrape data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!scrapedData || scrapedData.length === 0) {
      toast({
        title: "No data to download",
        description: "Please scrape data first",
        variant: "destructive",
      });
      return;
    }

    try {
      const jsonContent = convertTwitterDataToJson(scrapedData);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadJson(jsonContent, `twitter-data-${timestamp}.json`);
      
      toast({
        title: "JSON downloaded",
        description: "Twitter data has been exported as JSON",
      });
    } catch (error) {
      console.error("Failed to download JSON:", error);
      toast({
        title: "Failed to download JSON",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Twitter Data Scraper</CardTitle>
        <CardDescription>
          Scrape tweets from Twitter accounts using Apify API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="api-token">Apify API Token</Label>
          <Input
            id="api-token"
            type="password"
            value={apiToken}
            onChange={handleApiTokenChange}
            className="mt-1"
            placeholder="Enter your Apify API token"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your API token will be saved in your browser's local storage.
          </p>
        </div>

        <div>
          <Label htmlFor="twitter-urls">Twitter URLs/Handles</Label>
          <Textarea
            id="twitter-urls"
            value={twitterUrls}
            onChange={(e) => setTwitterUrls(e.target.value)}
            placeholder="Enter Twitter URLs or handles (one per line)
Example:
https://x.com/elonmusk
OpenAI
vitalikbuterin"
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tweets-desired">Tweets per Account</Label>
            <Input
              id="tweets-desired"
              type="number"
              min={1}
              max={3000} // Apify might have its own limits
              value={tweetsDesired}
              onChange={(e) => setTweetsDesired(parseInt(e.target.value) || 10)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="with-replies"
              checked={withReplies}
              onCheckedChange={(checked) => setWithReplies(checked as boolean)}
            />
            <Label htmlFor="with-replies" className="cursor-pointer">Include replies (for scraping)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-user-info"
              checked={includeUserInfo}
              onCheckedChange={(checked) => setIncludeUserInfo(checked as boolean)}
            />
            <Label htmlFor="include-user-info" className="cursor-pointer">Include user information (for scraping)</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 items-stretch">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !apiToken || !twitterUrls.trim()}
          className="w-full"
        >
          {isLoading ? "Scraping..." : "Scrape Twitter Data"}
        </Button>
        {scrapedData && scrapedData.length > 0 && (
          <Button
            variant="outline"
            onClick={handleDownloadJson}
            className="w-full"
          >
            Download as JSON
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TwitterScraper;

