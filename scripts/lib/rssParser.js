/**
 * Podcast RSS Feed Parser
 * Converts standard podcast RSS feeds to a format compatible with the player
 */

class RSSParser {
  /**
   * Parse a podcast RSS feed
   * @param {string} url - URL of the RSS feed to parse
   * @returns {Promise<Object>} - Parsed feed object in the player's format
   */
  static async parseFeed(url) {
    try {
      // Check if it's a remote URL or a local file
      const isRemote = url.startsWith('http') && !url.includes(window.location.hostname);
      
      // Use a CORS proxy for remote feeds
      let fetchUrl = url;
      if (isRemote) {
        // Try with a more reliable CORS proxy
        try {
          fetchUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          console.log('Using corsproxy.io as CORS proxy');
        } catch (e) {
          // Fallback to alternate proxy if encoding fails
          fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          console.log('Using allorigins.win as CORS proxy');
        }
      }
      
      console.log(`Fetching feed from: ${fetchUrl}`);
      
      // Fetch the feed with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let text;
      try {
        const response = await fetch(fetchUrl, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/xml, application/rss+xml, application/json, text/xml'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.statusText}`);
        }
        
        text = await response.text();
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Feed request timed out. The server might be down or responding too slowly.');
        }
        throw error;
      }
      
      // Check if it's JSON or XML
      if (text.trim().startsWith('{')) {
        // It's already JSON, attempt to parse it directly
        return this.parseJSON(text, url);
      } else {
        // It's XML, parse as RSS
        return this.parseXML(text, url);
      }
    } catch (error) {
      console.error('Error parsing feed:', error);
      throw error;
    }
  }

  /**
   * Parse JSON format (support for legacy feeds)
   * @param {string} text - JSON content as string
   * @param {string} url - Original URL for reference
   * @returns {Object} - Parsed feed in player format
   */
  static parseJSON(text, url) {
    try {
      const data = JSON.parse(text);
      
      // Handle our legacy format which had a "feeds" array with items
      if (data.feeds && Array.isArray(data.feeds)) {
        // We'll take the first feed from the array
        const firstFeed = data.feeds[0];
        return {
          id: firstFeed.id || `feed_${Date.now()}`,
          title: firstFeed.title || 'Untitled Feed',
          description: firstFeed.description || '',
          link: url,
          image: firstFeed.image || '',
          tracks: (firstFeed.tracks || []).map(track => ({
            id: track.id || `track_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            title: track.title || 'Untitled Track',
            description: track.description || '',
            audioUrl: track.audioUrl || '',
            albumArt: track.albumArt || '',
            pubDate: track.pubDate || new Date().toISOString(),
            duration: track.duration || '',
            artist: track.artist || ''
          }))
        };
      }
      
      // Handle case where the JSON directly represents a single feed
      return {
        id: data.id || `feed_${Date.now()}`,
        title: data.title || 'Untitled Feed',
        description: data.description || '',
        link: url,
        image: data.image || '',
        tracks: (data.tracks || []).map(track => ({
          id: track.id || `track_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          title: track.title || 'Untitled Track',
          description: track.description || '',
          audioUrl: track.audioUrl || '',
          albumArt: track.albumArt || '',
          pubDate: track.pubDate || new Date().toISOString(),
          duration: track.duration || '',
          artist: track.artist || ''
        }))
      };
    } catch (error) {
      console.error('Error parsing JSON feed:', error);
      throw new Error('Invalid feed format: not a valid JSON structure');
    }
  }

  /**
   * Parse XML/RSS format
   * @param {string} text - XML content as string
   * @param {string} url - Original URL for reference
   * @returns {Object} - Parsed feed in player format
   */
  static parseXML(text, url) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Check for parse errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error: ' + parserError.textContent);
      }

      // Get channel information (standard RSS structure)
      const channel = xmlDoc.querySelector('channel');
      if (!channel) {
        throw new Error('Invalid RSS feed: no channel element found');
      }

      // Extract feed metadata
      const title = this.getElementText(channel, 'title') || 'Untitled Podcast';
      const description = this.getElementText(channel, 'description') || '';
      const feedLink = this.getElementText(channel, 'link') || url;
      
      // Get podcast artwork (try multiple potential locations)
      let image = '';
      const itunesImage = channel.querySelector('itunes\\:image, image[href]');
      if (itunesImage && itunesImage.getAttribute('href')) {
        image = itunesImage.getAttribute('href');
      } else {
        const rssImage = channel.querySelector('image url');
        if (rssImage) {
          image = rssImage.textContent;
        }
      }

      // Generate unique ID for the feed
      const id = `rss_${this.slugify(title)}_${Date.now()}`;
      
      // Parse all episodes/items
      const items = xmlDoc.querySelectorAll('item');
      const tracks = Array.from(items).map(item => this.parseItem(item));
      
      return {
        id,
        title,
        description,
        link: feedLink,
        image,
        tracks
      };
    } catch (error) {
      console.error('Error parsing XML feed:', error);
      throw new Error(`Invalid RSS feed format: ${error.message}`);
    }
  }

  /**
   * Parse an individual podcast episode (item)
   * @param {Element} item - XML item element
   * @returns {Object} - Track object in the player format
   */
  static parseItem(item) {
    // Get basic episode info
    const title = this.getElementText(item, 'title') || 'Untitled Episode';
    const description = this.getElementText(item, 'description') || 
                        this.getElementText(item, 'itunes\\:summary') || '';
    const pubDate = this.getElementText(item, 'pubDate') || new Date().toISOString();
    
    // Generate unique ID
    const id = this.getElementText(item, 'guid') || 
               `track_${this.slugify(title)}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Find the audio URL from enclosure or media:content
    let audioUrl = '';
    const enclosure = item.querySelector('enclosure');
    if (enclosure && enclosure.getAttribute('url')) {
      audioUrl = enclosure.getAttribute('url');
    } else {
      const mediaContent = item.querySelector('media\\:content');
      if (mediaContent && mediaContent.getAttribute('url')) {
        audioUrl = mediaContent.getAttribute('url');
      }
    }

    // Get episode image (if different from feed image)
    let albumArt = '';
    const itunesImage = item.querySelector('itunes\\:image');
    if (itunesImage && itunesImage.getAttribute('href')) {
      albumArt = itunesImage.getAttribute('href');
    }

    // Get duration
    const duration = this.getElementText(item, 'itunes\\:duration') || '';
    
    // Get author/artist
    const artist = this.getElementText(item, 'itunes\\:author') || 
                  this.getElementText(item, 'author') || '';
    
    return {
      id,
      title,
      description: this.cleanDescription(description),
      audioUrl,
      albumArt,
      pubDate,
      duration,
      artist
    };
  }

  /**
   * Safely get element text content with namespace support
   * @param {Element} parent - Parent element to search within
   * @param {string} selector - Element selector, possibly with namespace
   * @returns {string} - Text content or empty string
   */
  static getElementText(parent, selector) {
    try {
      const element = parent.querySelector(selector);
      return element ? element.textContent.trim() : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Clean HTML description to simple text or sanitized HTML
   * @param {string} description - HTML or text description
   * @returns {string} - Cleaned description
   */
  static cleanDescription(description) {
    if (!description) return '';
    
    // Basic HTML tag removal for plain text
    // In a production app, you might want to use a sanitizer library
    return description
      .replace(/<\/?[^>]+(>|$)/g, ' ')  // Replace HTML tags with spaces
      .replace(/\s\s+/g, ' ')           // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Convert string to URL-friendly slug
   * @param {string} text - Text to slugify
   * @returns {string} - Slugified text
   */
  static slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove non-word characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
      .trim();
  }

  /**
   * Detect if a URL is likely to be a valid podcast feed
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} - True if likely a podcast feed
   */
  static async detectFeedType(url) {
    try {
      console.log('Detecting feed type for URL:', url);
      
      // Check if it's a remote URL or a local file
      const isRemote = url.startsWith('http') && !url.includes(window.location.hostname);
      console.log('Is remote URL:', isRemote);
      
      // Use a CORS proxy for remote feeds
      let fetchUrl = url;
      if (isRemote) {
        // Try with a more reliable CORS proxy
        try {
          fetchUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          console.log('Using corsproxy.io as CORS proxy');
        } catch (e) {
          // Fallback to alternate proxy if encoding fails
          fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          console.log('Using allorigins.win as CORS proxy');
        }
      }
      
      console.log('Using fetch URL:', fetchUrl);
      
      // Skip HEAD request as proxy might not support it
      // Instead rely on URL extension and content check
      if (
        url.endsWith('.rss') ||
        url.endsWith('.xml') ||
        url.endsWith('.json')
      ) {
        console.log('URL has valid extension');
        return true;
      }
      
      console.log('Fetching content to check feed type...');
      
      // Fetch a small part of the content
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let text;
      try {
        const textResponse = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/xml, application/rss+xml, application/json, text/xml'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!textResponse.ok) {
          console.error('Fetch response not OK:', textResponse.status, textResponse.statusText);
          return false;
        }
        
        text = await textResponse.text();
        console.log('Fetched content sample:', text.substring(0, 100) + '...');
      } catch (error) {
        console.error('Error fetching content sample:', error);
        return false;
      }
      
      // Check for RSS or JSON signatures
      return (
        text.includes('<rss') ||
        text.includes('<feed') ||
        text.includes('<channel') ||
        text.trim().startsWith('{')
      );
    } catch (error) {
      console.error('Error detecting feed type:', error);
      return false;
    }
  }
}

export default RSSParser;