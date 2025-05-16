
import React, { useState } from "react";
import TwitterScraper from "@/components/TwitterScraper";
import AIAnalysis from "@/components/AIAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessedTweet, convertTwitterDataToJson } from "@/utils/jsonExport"; // Updated import

const Index = () => {
  const [twitterData, setTwitterData] = useState<ProcessedTweet[] | null>(null); // Store processed data
  const [jsonDataForAI, setJsonDataForAI] = useState<string | null>(null); // Store JSON string for AI tab
  
  const handleDataScraped = (data: ProcessedTweet[]) => {
    setTwitterData(data); // Store the processed, filtered data
    if (data && data.length > 0) {
      const jsonString = convertTwitterDataToJson(data);
      setJsonDataForAI(jsonString);
    } else {
      setJsonDataForAI(null); // Clear if no data or empty data
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-center my-6">Twitter Data Analysis Tool</h1>
        
        <Tabs defaultValue="scraper" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scraper">Twitter Data Scraper</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!jsonDataForAI}>AI Analysis</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="scraper">
              <TwitterScraper onDataScraped={handleDataScraped} />
            </TabsContent>
            <TabsContent value="analysis">
              {/* Assuming AIAnalysis expects a prop named jsonData, if it was csvData, it needs update in AIAnalysis.tsx */}
              <AIAnalysis jsonData={jsonDataForAI} /> 
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

