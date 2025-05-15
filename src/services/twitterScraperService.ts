
interface TwitterScraperParams {
  apiToken: string;
  twitterUrls: string[];
  tweetsDesired: number;
  withReplies?: boolean;
  includeUserInfo?: boolean;
}

export const scrapeTwitterData = async ({
  apiToken,
  twitterUrls,
  tweetsDesired,
  withReplies = true,
  includeUserInfo = true,
}: TwitterScraperParams): Promise<any> => {
  if (!apiToken) {
    throw new Error("Apify API token is required.");
  }
  if (!twitterUrls || twitterUrls.length === 0) {
    throw new Error("At least one Twitter URL is required.");
  }

  // Prepare the start URLs for the API request
  const startUrls = twitterUrls.map(url => ({ url, method: "GET" }));

  const payload = {
    includeUserInfo: includeUserInfo,
    profilesDesired: twitterUrls.length,
    proxyConfig: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"]
    },
    startUrls: startUrls,
    tweetsDesired: tweetsDesired,
    withReplies: withReplies,
    storeUserIfNoTweets: false,
    repliesDepth: 2
  };

  try {
    // Start the scraping task
    const startResponse = await fetch(
      `https://api.apify.com/v2/acts/web.harvester~twitter-scraper/runs?token=${apiToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!startResponse.ok) {
      throw new Error(`Failed to start scraping task: ${await startResponse.text()}`);
    }

    const startData = await startResponse.json();
    const runId = startData.data.id;

    // Poll for status until completion
    let status = null;
    while (status !== "SUCCEEDED" && status !== "FAILED" && status !== "TIMED-OUT" && status !== "ABORTED") {
      // Wait before checking status again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check run status
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`
      );
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${await statusResponse.text()}`);
      }
      
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      
      // If the run is still active, continue polling
      if (status !== "SUCCEEDED" && status !== "FAILED" && status !== "TIMED-OUT" && status !== "ABORTED") {
        continue;
      }
      
      // If the run failed, throw an error
      if (status !== "SUCCEEDED") {
        throw new Error(`Scraping task failed with status: ${status}`);
      }
      
      // Get the dataset ID
      const defaultDatasetId = statusData.data.defaultDatasetId;
      
      if (!defaultDatasetId) {
        throw new Error("No default dataset ID found in the run info");
      }
      
      // Get the dataset items
      const datasetResponse = await fetch(
        `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${apiToken}`
      );
      
      if (!datasetResponse.ok) {
        throw new Error(`Failed to retrieve dataset items: ${await datasetResponse.text()}`);
      }
      
      // Return the scraped data
      return await datasetResponse.json();
    }
  } catch (error) {
    console.error("Twitter scraping error:", error);
    throw new Error(`Failed to scrape Twitter data: ${error instanceof Error ? error.message : String(error)}`);
  }
};
