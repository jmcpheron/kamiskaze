/**
 * UI Manager
 * Handles UI updates and interactions
 */

class UIManager {
  constructor(options = {}) {
    // Elements
    this.albumArtEl = options.albumArtElement || document.getElementById('custom-album-art');
    this.defaultArtEl = options.defaultArtElement || document.getElementById('default-album-art');
    this.trackInfoEl = options.trackInfoElement || document.getElementById('track-info-text');
    this.trackListEl = options.trackListElement || document.getElementById('track-list');
    this.playlistButtonsEl = options.playlistButtonsElement || document.getElementById('playlist-buttons');
    this.notificationAreaEl = options.notificationAreaElement || document.getElementById('notification-area');
    this.trackListTitleEl = options.trackListTitleElement || document.querySelector('#track-list-container h3');
    this.trackListDescEl = options.trackListDescElement || document.querySelector('#track-list-container .playlist-description');
    
    // State
    this.currentFeed = null;
    this.currentTrackIndex = 0;
    this.notification = null;
    
    // Callbacks
    this.onFeedSelect = options.onFeedSelect || (() => {});
    this.onTrackSelect = options.onTrackSelect || (() => {});
  }

  /**
   * Initialize UI
   */
  initialize() {
    // Create notification element if it doesn't exist
    if (this.notificationAreaEl && !this.notification) {
      this.notification = document.createElement('div');
      this.notification.className = 'notification';
      this.notificationAreaEl.appendChild(this.notification);
    }
  }

  /**
   * Update track info display
   * @param {Object} track - Track object
   */
  updateTrackInfo(track) {
    if (!this.trackInfoEl || !track) {
      return;
    }
    
    // Clear existing content
    this.trackInfoEl.innerHTML = '';
    
    // Create and add title
    const title = document.createElement('h2');
    title.textContent = track.title || 'Unknown Track';
    this.trackInfoEl.appendChild(title);
    
    // Add artist if available
    if (track.artist) {
      const artist = document.createElement('p');
      artist.className = 'track-artist';
      artist.textContent = track.artist;
      this.trackInfoEl.appendChild(artist);
    }
    
    // Add description if available
    const description = document.createElement('p');
    description.textContent = track.description || '';
    this.trackInfoEl.appendChild(description);
  }

  /**
   * Update album art
   * @param {Object} track - Track object
   */
  updateAlbumArt(track) {
    if (!this.albumArtEl || !this.defaultArtEl) {
      return;
    }
    
    if (track && track.albumArt) {
      // Show custom album art
      this.albumArtEl.src = track.albumArt;
      this.albumArtEl.classList.remove('hidden');
      this.albumArtEl.style.display = 'block';
      this.defaultArtEl.classList.add('hidden');
      this.defaultArtEl.style.display = 'none';
    } else {
      // Show default art
      this.albumArtEl.classList.add('hidden');
      this.albumArtEl.style.display = 'none';
      this.defaultArtEl.classList.remove('hidden');
      this.defaultArtEl.style.display = 'block';
    }
  }

  /**
   * Render track list for current feed
   * @param {Array} tracks - Array of track objects
   * @param {number} currentIndex - Current track index
   */
  renderTrackList(tracks, currentIndex = 0) {
    if (!this.trackListEl) {
      return;
    }
    
    // Clear existing tracks
    this.trackListEl.innerHTML = '';
    
    if (!tracks || tracks.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-message';
      emptyItem.textContent = 'No tracks available';
      this.trackListEl.appendChild(emptyItem);
      return;
    }
    
    // Add each track
    tracks.forEach((track, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      
      if (index === currentIndex) {
        li.classList.add('playing');
      }
      
      // Track info section
      const titleDiv = document.createElement('div');
      titleDiv.className = 'track-info';
      
      const title = document.createElement('h4');
      title.textContent = track.title || 'Unknown Track';
      
      titleDiv.appendChild(title);
      
      // Add artist if available
      if (track.artist) {
        const artist = document.createElement('p');
        artist.textContent = track.artist;
        titleDiv.appendChild(artist);
      }
      
      // Progress section
      const progress = document.createElement('div');
      progress.className = 'track-progress';
      
      // Duration if available
      if (track.duration) {
        progress.textContent = this.formatDuration(track.duration);
      } else {
        progress.textContent = 'Not played';
      }
      
      // Add pub date if available
      if (track.pubDate) {
        const date = document.createElement('div');
        date.className = 'track-date';
        date.textContent = this.formatDate(track.pubDate);
        progress.appendChild(date);
      }
      
      li.appendChild(titleDiv);
      li.appendChild(progress);
      
      // Add click handler
      li.addEventListener('click', () => {
        this.onTrackSelect(index);
      });
      
      this.trackListEl.appendChild(li);
    });
  }

  /**
   * Update progress for the current track
   * @param {number} currentTime - Current time in seconds
   * @param {number} duration - Duration in seconds
   */
  updateTrackProgress(currentTime, duration) {
    if (!this.trackListEl) {
      return;
    }
    
    const items = this.trackListEl.querySelectorAll('li');
    const currentItem = items[this.currentTrackIndex];
    
    if (currentItem && duration) {
      const progress = currentItem.querySelector('.track-progress');
      if (progress) {
        const percent = Math.floor((currentTime / duration) * 100) || 0;
        progress.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(duration)} (${percent}%)`;
      }
    }
  }

  /**
   * Highlight the current track in the track list
   * @param {number} index - Track index
   */
  highlightCurrentTrack(index) {
    if (!this.trackListEl) {
      return;
    }
    
    this.currentTrackIndex = index;
    
    const items = this.trackListEl.querySelectorAll('li');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('playing');
      } else {
        item.classList.remove('playing');
      }
    });
  }

  /**
   * Render feed list/buttons
   * @param {Array} feeds - Array of feed objects
   * @param {string} currentFeedId - ID of current feed
   */
  renderFeedButtons(feeds, currentFeedId) {
    if (!this.playlistButtonsEl) {
      return;
    }
    
    // Clear existing buttons
    this.playlistButtonsEl.innerHTML = '';
    
    if (!feeds || feeds.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No feeds available';
      this.playlistButtonsEl.appendChild(emptyMessage);
      return;
    }
    
    // Add a button for each feed
    feeds.forEach(feed => {
      const button = document.createElement('button');
      button.className = 'playlist-button';
      button.dataset.feedId = feed.id;
      
      if (currentFeedId && feed.id === currentFeedId) {
        button.classList.add('active');
      }
      
      button.textContent = feed.title || 'Untitled Feed';
      
      button.addEventListener('click', () => {
        this.onFeedSelect(feed.id);
      });
      
      this.playlistButtonsEl.appendChild(button);
    });
  }

  /**
   * Update the active feed button
   * @param {string} feedId - ID of current feed
   */
  updateActiveFeedButton(feedId) {
    if (!this.playlistButtonsEl) {
      return;
    }
    
    const buttons = this.playlistButtonsEl.querySelectorAll('.playlist-button');
    buttons.forEach(button => {
      if (button.dataset.feedId === feedId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  /**
   * Update feed info in track list container
   * @param {Object} feed - Feed object
   */
  updateFeedInfo(feed) {
    if (!feed) {
      return;
    }
    
    this.currentFeed = feed;
    
    // Update track list title
    if (this.trackListTitleEl) {
      this.trackListTitleEl.textContent = feed.title || 'Playlist';
      
      // Add track count if not present
      if (!this.trackListTitleEl.querySelector('.track-count')) {
        const trackCount = document.createElement('span');
        trackCount.className = 'track-count';
        trackCount.textContent = feed.tracks ? ` (${feed.tracks.length} tracks)` : '';
        this.trackListTitleEl.appendChild(trackCount);
      } else {
        // Update existing track count
        const trackCount = this.trackListTitleEl.querySelector('.track-count');
        trackCount.textContent = feed.tracks ? ` (${feed.tracks.length} tracks)` : '';
      }
    }
    
    // Update track list description
    if (this.trackListDescEl) {
      this.trackListDescEl.textContent = feed.description || '';
    }
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {number} duration - Duration in ms (0 for no auto-hide)
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Log all notifications to console
    console.log(`[${type}] ${message}`);
    
    if (!this.notification || !this.notificationAreaEl) {
      return;
    }
    
    // Set message and type
    this.notification.textContent = message;
    this.notification.className = `notification ${type}`;
    
    // Show notification
    this.notification.style.display = 'block';
    
    // Auto-hide after specified duration (if not zero and not error)
    if (duration > 0 && type !== 'error') {
      setTimeout(() => {
        this.notification.style.display = 'none';
      }, duration);
    }
  }

  /**
   * Format time in seconds to MM:SS string
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format duration string (from podcast feeds)
   * @param {string} duration - Duration string (HH:MM:SS or MM:SS)
   * @returns {string} - Formatted duration
   */
  formatDuration(duration) {
    if (!duration) return '';
    
    // If it's already in seconds, convert to string
    if (typeof duration === 'number') {
      return this.formatTime(duration);
    }
    
    // Handle different duration formats
    if (duration.includes(':')) {
      // Already in time format, may need normalization
      const parts = duration.split(':').map(p => parseInt(p, 10));
      
      if (parts.length === 3) {
        // HH:MM:SS format
        const hours = parts[0];
        const mins = parts[1];
        const secs = parts[2];
        
        if (hours > 0) {
          return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
      } else if (parts.length === 2) {
        // MM:SS format
        return `${parts[0]}:${parts[1].toString().padStart(2, '0')}`;
      }
    }
    
    // Just return as is if we can't parse it
    return duration;
  }

  /**
   * Format date string to readable format
   * @param {string} dateString - Date string
   * @returns {string} - Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Format as MMM D, YYYY (e.g. Jan 1, 2023)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }
}

export default UIManager;