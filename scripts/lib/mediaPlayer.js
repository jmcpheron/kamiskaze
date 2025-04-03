/**
 * Media Player
 * Handles audio and video playback functionality
 */

class MediaPlayer {
  constructor(options = {}) {
    // Elements
    this.audioEl = options.audioElement || document.createElement('audio');
    this.videoEl = options.videoElement || null;
    this.seekBarEl = options.seekBarElement || null;
    this.currentTimeEl = options.currentTimeElement || null;
    this.durationEl = options.durationElement || null;
    this.playPauseBtn = options.playPauseElement || null;
    this.playIcon = options.playIconElement || null;
    this.pauseIcon = options.pauseIconElement || null;
    
    // State
    this.isPlaying = false;
    this.currentTrack = null;
    this.currentFeed = null;
    this.currentTrackIndex = 0;
    this.tracks = [];
    
    // Options
    this.autoplay = options.autoplay || false;
    this.persistState = options.persistState !== false;
    this.localStorageKey = options.localStorageKey || 'mediaPlayerState';
    
    // Event callbacks
    this.onTrackChange = options.onTrackChange || (() => {});
    this.onPlayStateChange = options.onPlayStateChange || (() => {});
    this.onTimeUpdate = options.onTimeUpdate || (() => {});
    this.onError = options.onError || ((error) => { console.error('Player error:', error); });
    
    // Initialize
    this.setupEventListeners();
    
    if (this.persistState) {
      this.restoreState();
    }
  }

  /**
   * Set up event listeners for player elements
   */
  setupEventListeners() {
    // Audio element events
    this.audioEl.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audioEl.addEventListener('loadedmetadata', () => this.handleMetadataLoaded());
    this.audioEl.addEventListener('ended', () => this.handleTrackEnded());
    this.audioEl.addEventListener('error', (e) => this.handleError(e));
    this.audioEl.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateUIState();
      this.onPlayStateChange(true);
    });
    this.audioEl.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUIState();
      this.onPlayStateChange(false);
    });
    
    // Seek bar
    if (this.seekBarEl) {
      this.seekBarEl.addEventListener('input', () => this.handleSeek());
    }
    
    // Play/Pause button
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    }
  }

  /**
   * Set the current feed and tracks
   * @param {Object} feed - Feed object
   */
  setFeed(feed) {
    if (!feed || !feed.tracks || !Array.isArray(feed.tracks)) {
      throw new Error('Invalid feed: must contain tracks array');
    }
    
    this.currentFeed = feed;
    this.tracks = feed.tracks;
    this.currentTrackIndex = 0;
    
    // If there are tracks, load the first one
    if (this.tracks.length > 0) {
      this.loadTrack(0);
    }
  }

  /**
   * Load a track by index
   * @param {number} index - Track index in current feed
   */
  loadTrack(index) {
    // Validate index
    if (index < 0 || index >= this.tracks.length) {
      this.onError(new Error(`Invalid track index: ${index}`));
      return;
    }
    
    try {
      // Update current index
      this.currentTrackIndex = index;
      this.currentTrack = this.tracks[index];
      
      // Check if track has a valid audio URL
      if (!this.currentTrack.audioUrl) {
        this.onError(new Error('Track has no audio URL'));
        return;
      }
      
      // Set audio source
      this.audioEl.src = this.currentTrack.audioUrl;
      this.audioEl.load();
      
      // Reset UI state
      if (this.seekBarEl) {
        this.seekBarEl.value = 0;
      }
      if (this.currentTimeEl) {
        this.currentTimeEl.textContent = this.formatTime(0);
      }
      
      // Detect if this is a video file
      const isVideo = this.isVideoFile(this.currentTrack.audioUrl);
      
      // Handle video if available
      if (isVideo && this.videoEl) {
        this.setupVideo();
      } else if (this.videoEl) {
        this.disableVideo();
      }
      
      // Notify track change
      this.onTrackChange(this.currentTrack, index);
      
      // Autoplay if enabled
      if (this.autoplay) {
        this.play();
      }
      
      // Save state
      if (this.persistState) {
        this.saveState();
      }
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * Play the current track
   */
  play() {
    if (!this.audioEl.src) {
      return;
    }
    
    this.audioEl.play().catch(error => {
      this.onError(error);
    });
  }

  /**
   * Pause the current track
   */
  pause() {
    this.audioEl.pause();
  }

  /**
   * Toggle play/pause state
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Play the next track
   * @returns {boolean} - Success status
   */
  next() {
    if (this.tracks.length === 0) {
      return false;
    }
    
    const nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.loadTrack(nextIndex);
    this.play();
    return true;
  }

  /**
   * Play the previous track
   * @returns {boolean} - Success status
   */
  previous() {
    if (this.tracks.length === 0) {
      return false;
    }
    
    // If current time is greater than 3 seconds, restart the current track
    if (this.audioEl.currentTime > 3) {
      this.audioEl.currentTime = 0;
      return true;
    }
    
    const prevIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack(prevIndex);
    this.play();
    return true;
  }

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  seekTo(time) {
    if (!this.audioEl.duration) {
      return;
    }
    
    // Ensure time is valid
    const validTime = Math.max(0, Math.min(time, this.audioEl.duration));
    this.audioEl.currentTime = validTime;
  }

  /**
   * Handle seek bar input
   */
  handleSeek() {
    if (!this.seekBarEl || !this.audioEl.duration) {
      return;
    }
    
    this.audioEl.currentTime = parseFloat(this.seekBarEl.value);
  }

  /**
   * Set playback speed
   * @param {number} rate - Playback rate (0.5-2.0)
   */
  setPlaybackSpeed(rate) {
    const validRate = Math.max(0.25, Math.min(rate, 2.5));
    this.audioEl.playbackRate = validRate;
    
    if (this.videoEl && !this.videoEl.paused) {
      this.videoEl.playbackRate = validRate;
    }
    
    if (this.persistState) {
      this.saveState();
    }
  }

  /**
   * Handle time update event
   */
  handleTimeUpdate() {
    const currentTime = this.audioEl.currentTime;
    const duration = this.audioEl.duration || 0;
    
    // Update seek bar
    if (this.seekBarEl && !isNaN(duration) && duration > 0) {
      this.seekBarEl.value = currentTime;
      
      // Update seek bar progress with CSS variable
      const progressPercent = (currentTime / duration) * 100;
      document.documentElement.style.setProperty('--seek-progress', `${progressPercent}%`);
    }
    
    // Update time display
    if (this.currentTimeEl) {
      this.currentTimeEl.textContent = this.formatTime(currentTime);
    }
    
    // Sync video if playing
    if (this.videoEl && !this.videoEl.paused) {
      // Keep video in sync with audio
      if (Math.abs(this.videoEl.currentTime - currentTime) > 0.2) {
        this.videoEl.currentTime = currentTime;
      }
    }
    
    // Save state periodically (every 5 seconds)
    if (this.persistState && Math.floor(currentTime) % 5 === 0) {
      this.saveState();
    }
    
    // Call time update callback
    this.onTimeUpdate(currentTime, duration);
  }

  /**
   * Handle metadata loaded event
   */
  handleMetadataLoaded() {
    const duration = this.audioEl.duration || 0;
    
    // Update duration display
    if (this.durationEl && !isNaN(duration)) {
      this.durationEl.textContent = this.formatTime(duration);
    }
    
    // Set seek bar max
    if (this.seekBarEl && !isNaN(duration)) {
      this.seekBarEl.max = duration;
    }
  }

  /**
   * Handle track ended event
   */
  handleTrackEnded() {
    this.next();
  }

  /**
   * Handle error event
   * @param {Event} event - Error event
   */
  handleError(event) {
    let message = 'Unknown playback error';
    
    if (this.audioEl.error) {
      switch (this.audioEl.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          message = 'Playback aborted by the user';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          message = 'Network error occurred while loading the media';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          message = 'Media decoding error or corrupted data';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Media format not supported by your browser';
          break;
        default:
          message = `Media error code: ${this.audioEl.error.code}`;
      }
    }
    
    this.onError(new Error(message));
  }

  /**
   * Update UI state based on playback state
   */
  updateUIState() {
    // Update play/pause button
    if (this.playPauseBtn) {
      if (this.isPlaying) {
        this.playPauseBtn.classList.add('playing');
      } else {
        this.playPauseBtn.classList.remove('playing');
      }
    }
    
    // Update play/pause icons
    if (this.playIcon && this.pauseIcon) {
      if (this.isPlaying) {
        this.playIcon.style.opacity = '0';
        this.playIcon.style.transform = 'translate(-43%, -50%) scale(0)';
        this.pauseIcon.style.opacity = '1';
        this.pauseIcon.style.transform = 'translate(-50%, -50%) scale(1)';
      } else {
        this.playIcon.style.opacity = '1';
        this.playIcon.style.transform = 'translate(-43%, -50%) scale(1)';
        this.pauseIcon.style.opacity = '0';
        this.pauseIcon.style.transform = 'translate(-50%, -50%) scale(0)';
      }
    }
  }

  /**
   * Set up video for playback
   */
  setupVideo() {
    if (!this.videoEl || !this.currentTrack) {
      return;
    }
    
    try {
      // Reset video element
      this.videoEl.pause();
      this.videoEl.style.display = 'block';
      this.videoEl.classList.remove('hidden');
      
      // Set video source to audio source (since they're the same for video files)
      this.videoEl.src = this.currentTrack.audioUrl;
      
      // Sync with audio element
      this.videoEl.currentTime = this.audioEl.currentTime;
      
      // Match play state
      if (this.isPlaying) {
        this.videoEl.play().catch(e => console.error('Video play error:', e));
      }
      
      // Add video-active class to container if it exists
      const container = document.getElementById('album-art');
      if (container) {
        container.classList.add('video-active');
      }
      
      // Show video controls if they exist
      const videoControls = document.getElementById('video-controls-overlay');
      if (videoControls) {
        videoControls.style.display = 'flex';
      }
      
      // Hide album art elements
      const albumArt = document.getElementById('custom-album-art');
      const defaultArt = document.getElementById('default-album-art');
      
      if (albumArt) {
        albumArt.classList.add('hidden');
        albumArt.style.display = 'none';
      }
      if (defaultArt) {
        defaultArt.classList.add('hidden');
        defaultArt.style.display = 'none';
      }
    } catch (error) {
      console.error('Error setting up video:', error);
      this.disableVideo(); // Fall back to audio-only mode
    }
  }

  /**
   * Disable video and switch to audio-only mode
   */
  disableVideo() {
    if (!this.videoEl) {
      return;
    }
    
    // Stop video playback
    this.videoEl.pause();
    this.videoEl.src = '';
    this.videoEl.style.display = 'none';
    
    // Remove video-active class from container if it exists
    const container = document.getElementById('album-art');
    if (container) {
      container.classList.remove('video-active');
    }
    
    // Hide video controls if they exist
    const videoControls = document.getElementById('video-controls-overlay');
    if (videoControls) {
      videoControls.style.display = 'none';
    }
    
    // Show appropriate album art
    const albumArt = document.getElementById('custom-album-art');
    const defaultArt = document.getElementById('default-album-art');
    
    if (this.currentTrack && this.currentTrack.albumArt) {
      if (albumArt) {
        albumArt.src = this.currentTrack.albumArt;
        albumArt.classList.remove('hidden');
        albumArt.style.display = 'block';
      }
      if (defaultArt) {
        defaultArt.classList.add('hidden');
        defaultArt.style.display = 'none';
      }
    } else {
      if (albumArt) {
        albumArt.classList.add('hidden');
        albumArt.style.display = 'none';
      }
      if (defaultArt) {
        defaultArt.classList.remove('hidden');
        defaultArt.style.display = 'block';
      }
    }
  }

  /**
   * Toggle fullscreen for video
   */
  toggleFullscreen() {
    if (!this.videoEl) {
      return;
    }
    
    try {
      if (!document.fullscreenElement) {
        // Use the container for fullscreen if available
        const container = document.getElementById('album-art');
        
        if (container) {
          container.requestFullscreen().catch(err => {
            // Fallback to just the video element
            this.videoEl.requestFullscreen().catch(innerErr => {
              console.error('Fullscreen error:', innerErr);
            });
          });
        } else {
          this.videoEl.requestFullscreen();
        }
      } else {
        document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  /**
   * Check if a file is a video based on extension
   * @param {string} url - File URL
   * @returns {boolean} - True if it's a video file
   */
  isVideoFile(url) {
    if (!url) return false;
    
    const videoExtensions = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];
    const lowercaseUrl = url.toLowerCase();
    
    return videoExtensions.some(ext => lowercaseUrl.endsWith(ext));
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
   * Save player state to localStorage
   */
  saveState() {
    if (!this.persistState) {
      return;
    }
    
    try {
      const state = {
        feedId: this.currentFeed ? this.currentFeed.id : null,
        trackIndex: this.currentTrackIndex,
        currentTime: this.audioEl.currentTime,
        playbackRate: this.audioEl.playbackRate
      };
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving player state:', error);
    }
  }

  /**
   * Restore player state from localStorage
   */
  restoreState() {
    try {
      const savedState = localStorage.getItem(this.localStorageKey);
      if (!savedState) {
        return;
      }
      
      const state = JSON.parse(savedState);
      
      // Store state for when feed is loaded
      this._restoredState = state;
    } catch (error) {
      console.error('Error restoring player state:', error);
    }
  }

  /**
   * Apply restored state if feed matches
   */
  applyRestoredState() {
    if (!this._restoredState || !this.currentFeed) {
      return;
    }
    
    // Check if feed ID matches
    if (this._restoredState.feedId === this.currentFeed.id) {
      // Restore track
      const trackIndex = this._restoredState.trackIndex || 0;
      if (trackIndex >= 0 && trackIndex < this.tracks.length) {
        this.loadTrack(trackIndex);
        
        // Restore position
        if (this._restoredState.currentTime) {
          this.audioEl.currentTime = this._restoredState.currentTime;
        }
        
        // Restore playback rate
        if (this._restoredState.playbackRate) {
          this.setPlaybackSpeed(this._restoredState.playbackRate);
        }
      }
    }
    
    // Clear restored state
    this._restoredState = null;
  }

  /**
   * Get current track
   * @returns {Object|null} - Current track object
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * Get current feed
   * @returns {Object|null} - Current feed object
   */
  getCurrentFeed() {
    return this.currentFeed;
  }

  /**
   * Get all tracks in current feed
   * @returns {Array} - Array of track objects
   */
  getTracks() {
    return this.tracks;
  }

  /**
   * Get current track index
   * @returns {number} - Current track index
   */
  getCurrentTrackIndex() {
    return this.currentTrackIndex;
  }

  /**
   * Check if player is currently playing
   * @returns {boolean} - True if playing
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}

export default MediaPlayer;