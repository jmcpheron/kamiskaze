/**
 * Feed Manager
 * Handles feed operations, caching, and storage
 */

import RSSParser from './rssParser.js';

class FeedManager {
  constructor() {
    this.feeds = [];
    this.defaultFeeds = [];
    this.customFeeds = [];
    this.cacheTime = 60 * 60 * 1000; // 1 hour cache by default
  }

  /**
   * Initialize the feed manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load default feeds
      await this.loadDefaultFeeds();
      
      // Load custom feeds from local storage
      this.loadCustomFeeds();
      
      // Merge feeds
      this.updateFeedsList();
    } catch (error) {
      console.error('Error initializing FeedManager:', error);
      throw error;
    }
  }

  /**
   * Load default feeds from feed.json
   * @returns {Promise<void>}
   */
  async loadDefaultFeeds() {
    try {
      const response = await fetch('feed.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      // Check if we have the feeds array structure
      if (data && Array.isArray(data.feeds)) {
        this.defaultFeeds = data.feeds;
      } else if (data && Array.isArray(data)) {
        // Handle alternative format where feeds are the top-level array
        this.defaultFeeds = data;
      } else {
        // If it's a single feed, wrap it in an array
        this.defaultFeeds = [data];
      }
    } catch (error) {
      console.error('Error loading default feeds:', error);
      this.defaultFeeds = [];
    }
  }

  /**
   * Load custom feeds from localStorage
   */
  loadCustomFeeds() {
    try {
      const savedFeeds = localStorage.getItem('customFeeds');
      if (savedFeeds) {
        this.customFeeds = JSON.parse(savedFeeds);
        
        // Validate custom feeds structure
        if (!Array.isArray(this.customFeeds)) {
          console.warn('Invalid custom feeds format, resetting');
          this.customFeeds = [];
          localStorage.setItem('customFeeds', JSON.stringify(this.customFeeds));
        }
      } else {
        this.customFeeds = [];
      }
    } catch (error) {
      console.error('Error loading custom feeds:', error);
      this.customFeeds = [];
    }
  }

  /**
   * Update the combined feeds list
   */
  updateFeedsList() {
    // Combine default and custom feeds
    this.feeds = [...this.defaultFeeds, ...this.customFeeds];
  }

  /**
   * Get all available feeds
   * @returns {Array} - Array of feed objects
   */
  getAllFeeds() {
    return this.feeds;
  }

  /**
   * Get a feed by ID
   * @param {string} id - Feed ID
   * @returns {Object|null} - Feed object or null if not found
   */
  getFeedById(id) {
    return this.feeds.find(feed => feed.id === id) || null;
  }

  /**
   * Add a new feed from URL
   * @param {string} url - Feed URL
   * @returns {Promise<Object>} - The newly added feed
   */
  async addFeed(url) {
    try {
      // Validate URL
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid feed URL');
      }
      
      // Check if this feed already exists by URL
      const existing = this.customFeeds.find(feed => feed.url === url);
      if (existing) {
        throw new Error('This feed is already in your library');
      }
      
      // Special case for sample feed
      if (url === 'palm-springs-feed.json') {
        console.log('Using sample feed - skipping validation');
      } else {
        // First try to detect if it's a valid feed
        const isValidFeed = await RSSParser.detectFeedType(url);
        if (!isValidFeed) {
          throw new Error('URL does not appear to be a valid feed');
        }
      }
      
      // Parse feed
      const feed = await RSSParser.parseFeed(url);
      
      // Add URL to the feed object for future reference
      feed.url = url;
      feed.lastUpdated = new Date().toISOString();
      
      // Add to custom feeds
      this.customFeeds.push(feed);
      
      // Save to storage
      this.saveCustomFeeds();
      
      // Update combined list
      this.updateFeedsList();
      
      return feed;
    } catch (error) {
      console.error('Error adding feed:', error);
      throw error;
    }
  }

  /**
   * Remove a feed by ID
   * @param {string} id - Feed ID
   * @returns {boolean} - Success status
   */
  removeFeed(id) {
    try {
      // Only custom feeds can be removed
      const index = this.customFeeds.findIndex(feed => feed.id === id);
      if (index === -1) {
        return false;
      }
      
      // Remove the feed
      this.customFeeds.splice(index, 1);
      
      // Save to storage
      this.saveCustomFeeds();
      
      // Update combined list
      this.updateFeedsList();
      
      return true;
    } catch (error) {
      console.error('Error removing feed:', error);
      return false;
    }
  }

  /**
   * Save custom feeds to localStorage
   */
  saveCustomFeeds() {
    try {
      localStorage.setItem('customFeeds', JSON.stringify(this.customFeeds));
    } catch (error) {
      console.error('Error saving custom feeds:', error);
    }
  }

  /**
   * Refresh a feed to get updated content
   * @param {string} id - Feed ID
   * @returns {Promise<Object>} - Updated feed
   */
  async refreshFeed(id) {
    try {
      // Find the feed
      const feed = this.feeds.find(f => f.id === id);
      if (!feed || !feed.url) {
        throw new Error('Feed not found or missing URL');
      }
      
      // Check if it's a custom feed (only custom feeds can be refreshed)
      const isCustom = this.customFeeds.some(f => f.id === id);
      if (!isCustom) {
        throw new Error('Only custom feeds can be refreshed');
      }
      
      // Check if cache is still valid
      const now = new Date();
      const lastUpdated = feed.lastUpdated ? new Date(feed.lastUpdated) : new Date(0);
      const timeDiff = now - lastUpdated;
      
      // If cache is valid, return existing feed
      if (timeDiff < this.cacheTime) {
        return feed;
      }
      
      // Parse feed again
      const updatedFeed = await RSSParser.parseFeed(feed.url);
      
      // Update the feed
      updatedFeed.url = feed.url;
      updatedFeed.lastUpdated = now.toISOString();
      
      // Replace in custom feeds
      const index = this.customFeeds.findIndex(f => f.id === id);
      if (index !== -1) {
        this.customFeeds[index] = updatedFeed;
      }
      
      // Save to storage
      this.saveCustomFeeds();
      
      // Update combined list
      this.updateFeedsList();
      
      return updatedFeed;
    } catch (error) {
      console.error('Error refreshing feed:', error);
      throw error;
    }
  }

  /**
   * Clear all custom feeds
   * @returns {boolean} - Success status
   */
  clearCustomFeeds() {
    try {
      this.customFeeds = [];
      this.saveCustomFeeds();
      this.updateFeedsList();
      return true;
    } catch (error) {
      console.error('Error clearing custom feeds:', error);
      return false;
    }
  }

  /**
   * Discover RSS feeds on a webpage
   * @param {string} url - Webpage URL
   * @returns {Promise<Array>} - Array of discovered feed URLs
   */
  async discoverFeeds(url) {
    try {
      // Create a proxy request or use a CORS-enabled endpoint
      // In a real app, you might need a server-side proxy
      const response = await fetch(url);
      const html = await response.text();
      
      // Create a temporary DOM to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for RSS link elements
      const links = doc.querySelectorAll('link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]');
      
      const feedUrls = [];
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, url).href;
          feedUrls.push({
            url: absoluteUrl,
            title: link.getAttribute('title') || 'Untitled Feed'
          });
        }
      });
      
      return feedUrls;
    } catch (error) {
      console.error('Error discovering feeds:', error);
      return [];
    }
  }
}

export default FeedManager;