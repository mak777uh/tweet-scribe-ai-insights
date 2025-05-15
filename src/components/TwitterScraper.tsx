
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { scrapeTwitterData } from "@/services/twitterScraperService";
import { convertTwitterDataToCsv, downloadCsv } from "@/utils/csvExport";

interface TwitterScraperProps {
  onDataScraped: (data: any[]) => void;
}

const TwitterScraper: React.FC<TwitterScraperProps> = ({ onDataScraped }) => {
  const [apiToken, setApiToken] = useState<string>("");
  const [twitterUrls, setTwitterUrls] = useState<string>("");
  const [tweetsDesired, setTweetsDesired] = useState<number>(10);
  const [withReplies, setWithReplies] = useState<boolean>(true);
  const [includeUserInfo, setIncludeUserInfo] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrapedData, setScrapedData] = useState<any[] | null>(null);
  const { toast } = useToast();

  // Load API token from local storage if available
  React.useEffect(() => {
    const storedToken = localStorage.getItem("apify_token");
    if (storedToken) {
      setApiToken(storedToken);
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

    // Parse Twitter URLs from textarea
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
    try {
      const data = await scrapeTwitterData({
        apiToken,
        twitterUrls: urlList,
        tweetsDesired,
        withReplies,
        includeUserInfo,
      });

      setScrapedData(data);
      onDataScraped(data);
      
      toast({
        title: "Data scraped successfully!",
        description: `Retrieved ${data.length} tweets from ${new Set(data.map(t => t.username)).size} accounts`,
      });
    } catch (error) {
      console.error("Failed to scrape data:", error);
      toast({
        title: "Failed to scrape data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!scrapedData) {
      toast({
        title: "No data to download",
        description: "Please scrape data first",
        variant: "destructive",
      });
      return;
    }

    try {
      const csvContent = convertTwitterDataToCsv(scrapedData);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadCsv(csvContent, `twitter-data-${timestamp}.csv`);
      
      toast({
        title: "CSV downloaded",
        description: "Twitter data has been exported as CSV",
      });
    } catch (error) {
      console.error("Failed to download CSV:", error);
      toast({
        title: "Failed to download CSV",
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
              max={3000}
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
            <Label htmlFor="with-replies" className="cursor-pointer">Include replies</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-user-info"
              checked={includeUserInfo}
              onCheckedChange={(checked) => setIncludeUserInfo(checked as boolean)}
            />
            <Label htmlFor="include-user-info" className="cursor-pointer">Include user information</Label>
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
        {scrapedData && (
          <Button
            variant="outline"
            onClick={handleDownloadCsv}
            className="w-full"
          >
            Download as CSV
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TwitterScraper;
