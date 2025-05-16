
export interface ProcessedTweet {
  accountBio?: string;
  tweetText?: string;
  tweetUrl?: string;
  likes?: number;
  replies?: number;
  retweets?: number;
  quotes?: number;
  views?: number; // Adding views as it's a common reaction metric
}

export const processAndFilterTwitterData = (rawData: any[]): ProcessedTweet[] => {
  if (!rawData || rawData.length === 0) {
    return [];
  }

  return rawData.map(item => {
    const user = item.user || {};
    return {
      accountBio: user.description,
      tweetText: item.text,
      tweetUrl: item.url,
      likes: item.likes,
      replies: item.replies,
      retweets: item.retweets,
      quotes: item.quotes,
      views: item.views, // Apify sometimes provides 'views'
    };
  });
};

export const convertTwitterDataToJson = (data: ProcessedTweet[]): string => {
  if (!data || data.length === 0) {
    return '';
  }
  return JSON.stringify(data, null, 2);
};

export const downloadJson = (jsonContent: string, filename: string): void => {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

