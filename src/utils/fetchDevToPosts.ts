export interface DevToPost {
  id: number;
  title: string;
  description: string;
  url: string;
  cover_image: string;
  published_at: string;
  published_timestamp: string;
  tag_list: string[];
  slug: string;
  path: string;
  canonical_url: string;
  public_reactions_count: number;
  comments_count: number;
  reading_time_minutes: number;
}

export async function fetchDevToPosts(username: string = 'jenlooper'): Promise<DevToPost[]> {
  try {
    const response = await fetch(`https://dev.to/api/articles?username=${username}&per_page=1000`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dev.to posts: ${response.status}`);
    }
    
    const posts: DevToPost[] = await response.json();
    
    // Sort posts by published date (newest first)
    return posts.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching dev.to posts:', error);
    return [];
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
