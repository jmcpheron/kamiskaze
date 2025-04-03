// Modern Media Player with RSS Support
// Main entry point for the application

import FeedManager from './lib/feedManager.js';
import MediaPlayer from './lib/mediaPlayer.js';
import UIManager from './lib/uiManager.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize managers
  const feedManager = new FeedManager();
  
  // Set up UI manager with DOM elements
  const uiManager = new UIManager({
    albumArtElement: document.getElementById('custom-album-art'),
    defaultArtElement: document.getElementById('default-album-art'),
    trackInfoElement: document.getElementById('track-info-text'),
    trackListElement: document.getElementById('track-list'),
    playlistButtonsElement: document.getElementById('playlist-buttons'),
    notificationAreaElement: document.getElementById('notification-area'),
    trackListTitleElement: document.querySelector('#track-list-container h3'),
    trackListDescElement: document.querySelector('#track-list-container .playlist-description'),
    onFeedSelect: (feedId) => handleFeedSelect(feedId),
    onTrackSelect: (index) => handleTrackSelect(index)
  });
  
  // Set up media player with DOM elements
  const mediaPlayer = new MediaPlayer({
    audioElement: document.getElementById('audio-player'),
    videoElement: document.getElementById('video-art-display'),
    seekBarElement: document.getElementById('seek-bar'),
    currentTimeElement: document.getElementById('current-time'),
    durationElement: document.getElementById('duration'),
    playPauseElement: document.getElementById('play-pause-button'),
    playIconElement: document.querySelector('#play-pause-button .play-icon'),
    pauseIconElement: document.querySelector('#play-pause-button .pause-icon'),
    persistState: true,
    onTrackChange: (track) => handleTrackChange(track),
    onPlayStateChange: (isPlaying) => handlePlayStateChange(isPlaying),
    onTimeUpdate: (currentTime, duration) => handleTimeUpdate(currentTime, duration),
    onError: (error) => handleError(error)
  });
  
  // Initialize UI
  uiManager.initialize();
  
  // Initialize app
  try {
    // Show loading message
    uiManager.showNotification('Loading feeds...', 'info');
    
    // Initialize feed manager
    await feedManager.initialize();
    
    // Get all feeds
    const feeds = feedManager.getAllFeeds();
    
    if (feeds.length === 0) {
      uiManager.showNotification('No feeds available', 'warning');
      return;
    }
    
    // Render feed buttons
    uiManager.renderFeedButtons(feeds);
    
    // Restore state or load first feed
    const savedState = localStorage.getItem('mediaPlayerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.feedId) {
          const feed = feedManager.getFeedById(state.feedId);
          if (feed) {
            loadFeed(feed);
            return;
          }
        }
      } catch (error) {
        console.error('Error restoring state:', error);
      }
    }
    
    // Load first feed as default
    loadFeed(feeds[0]);
    
  } catch (error) {
    uiManager.showNotification('Error initializing app: ' + error.message, 'error');
    console.error('Initialization error:', error);
  }
  
  // Set up event listeners for player controls
  setupEventListeners();
  
  // CORE FUNCTIONS
  
  /**
   * Handle feed selection
   * @param {string} feedId - Feed ID
   */
  function handleFeedSelect(feedId) {
    try {
      const feed = feedManager.getFeedById(feedId);
      if (feed) {
        loadFeed(feed);
      } else {
        uiManager.showNotification('Feed not found', 'error');
      }
    } catch (error) {
      uiManager.showNotification('Error loading feed: ' + error.message, 'error');
    }
  }
  
  /**
   * Load a feed into the player
   * @param {Object} feed - Feed object
   */
  function loadFeed(feed) {
    try {
      // Update UI with feed info
      uiManager.updateFeedInfo(feed);
      uiManager.updateActiveFeedButton(feed.id);
      
      // Load tracks into UI
      uiManager.renderTrackList(feed.tracks);
      
      // Set feed in media player
      mediaPlayer.setFeed(feed);
      
      // Apply any restored state
      mediaPlayer.applyRestoredState();
      
    } catch (error) {
      uiManager.showNotification('Error loading feed: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle track selection
   * @param {number} index - Track index
   */
  function handleTrackSelect(index) {
    try {
      mediaPlayer.loadTrack(index);
      mediaPlayer.play();
    } catch (error) {
      uiManager.showNotification('Error loading track: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle track change
   * @param {Object} track - Track object
   */
  function handleTrackChange(track) {
    try {
      // Update UI with track info
      uiManager.updateTrackInfo(track);
      uiManager.updateAlbumArt(track);
      uiManager.highlightCurrentTrack(mediaPlayer.getCurrentTrackIndex());
    } catch (error) {
      uiManager.showNotification('Error updating track info: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle play state change
   * @param {boolean} isPlaying - Is playing state
   */
  function handlePlayStateChange(isPlaying) {
    // No additional handling needed as MediaPlayer already updates its UI
  }
  
  /**
   * Handle time update
   * @param {number} currentTime - Current time in seconds
   * @param {number} duration - Duration in seconds
   */
  function handleTimeUpdate(currentTime, duration) {
    uiManager.updateTrackProgress(currentTime, duration);
  }
  
  /**
   * Handle errors
   * @param {Error} error - Error object
   */
  function handleError(error) {
    uiManager.showNotification('Player error: ' + error.message, 'error');
  }
  
  /**
   * Add event listeners for player controls
   */
  function setupEventListeners() {
    // Play/Pause button should already be handled by MediaPlayer
    
    // Previous button
    const prevButton = document.getElementById('prev-button');
    if (prevButton) {
      prevButton.addEventListener('click', () => mediaPlayer.previous());
    }
    
    // Next button
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
      nextButton.addEventListener('click', () => mediaPlayer.next());
    }
    
    // Video fullscreen button
    const fullscreenButton = document.getElementById('video-fullscreen');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => mediaPlayer.toggleFullscreen());
    }
    
    // Video play/pause button
    const videoPlayPauseButton = document.getElementById('video-play-pause');
    if (videoPlayPauseButton) {
      videoPlayPauseButton.addEventListener('click', () => mediaPlayer.togglePlayPause());
    }
    
    // Speed buttons
    const speedButtons = document.querySelectorAll('.speed-button');
    speedButtons.forEach(button => {
      button.addEventListener('click', () => {
        const speed = parseFloat(button.dataset.speed);
        mediaPlayer.setPlaybackSpeed(speed);
        
        // Update active button
        speedButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
    
    // Add feed form
    const addFeedForm = document.getElementById('add-feed-form');
    if (addFeedForm) {
      addFeedForm.addEventListener('submit', handleAddFeed);
    }
    
    // Clear data button
    const clearDataButton = document.getElementById('clear-cache-button');
    if (clearDataButton) {
      clearDataButton.addEventListener('click', confirmClearData);
    }
    
    // Key controls
    document.addEventListener('keydown', handleKeyboardControls);
    
    // Feed suggestion handler
    const feedSuggestion = document.getElementById('feed-suggestion');
    if (feedSuggestion) {
      console.log('Setting up feed suggestion handler');
      feedSuggestion.addEventListener('click', (e) => {
        const linkElem = e.target.tagName === 'A' ? e.target : e.target.closest('a');
        if (linkElem) {
          e.preventDefault();
          console.log('Sample feed clicked');
          const feedUrlInput = document.getElementById('feed-url');
          if (feedUrlInput) {
            feedUrlInput.value = 'palm-springs-feed.json';
            // Trigger the form submission
            const form = document.getElementById('add-feed-form');
            if (form) {
              console.log('Submitting form automatically');
              const submitEvent = new Event('submit', { cancelable: true });
              form.dispatchEvent(submitEvent);
            }
          }
        }
      });
    }
  }
  
  /**
   * Handle keyboard controls
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyboardControls(e) {
    // Don't trigger if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
      case ' ': // Space
        e.preventDefault();
        mediaPlayer.togglePlayPause();
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          mediaPlayer.previous();
        } else {
          // Rewind 10 seconds
          const currentTime = mediaPlayer.audioEl.currentTime;
          mediaPlayer.seekTo(currentTime - 10);
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          mediaPlayer.next();
        } else {
          // Forward 10 seconds
          const currentTime = mediaPlayer.audioEl.currentTime;
          mediaPlayer.seekTo(currentTime + 10);
        }
        break;
      case 'f':
        mediaPlayer.toggleFullscreen();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        // Speed shortcuts
        const speeds = [0.5, 0.75, 1, 1.5, 2];
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < speeds.length) {
          mediaPlayer.setPlaybackSpeed(speeds[index]);
          
          // Update speed buttons
          const speedButtons = document.querySelectorAll('.speed-button');
          speedButtons.forEach(btn => {
            if (parseFloat(btn.dataset.speed) === speeds[index]) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        }
        break;
    }
  }
  
  /**
   * Handle adding a new feed
   * @param {Event} e - Form submit event
   */
  async function handleAddFeed(e) {
    e.preventDefault();
    
    const feedUrlInput = document.getElementById('feed-url');
    if (!feedUrlInput) return;
    
    const url = feedUrlInput.value.trim();
    
    if (!url) {
      uiManager.showNotification('Please enter a feed URL', 'warning');
      return;
    }
    
    console.log('Attempting to add feed:', url);
    
    try {
      uiManager.showNotification('Loading feed...', 'info');
      
      // Add debug for CORS issues
      console.log('Adding feed to FeedManager...');
      
      // Add feed
      const feed = await feedManager.addFeed(url);
      console.log('Feed successfully loaded:', feed);
      
      // Update feed buttons
      uiManager.renderFeedButtons(feedManager.getAllFeeds(), feed.id);
      
      // Switch to new feed
      loadFeed(feed);
      
      // Reset form
      feedUrlInput.value = '';
      
      uiManager.showNotification(`Added new feed: ${feed.title}`, 'success');
      
    } catch (error) {
      console.error('Error adding feed:', error);
      uiManager.showNotification('Error adding feed: ' + error.message, 'error');
    }
  }
  
  /**
   * Confirm clearing all data
   */
  function confirmClearData() {
    if (confirm('This will delete all your custom feeds and player settings. This action cannot be undone. Continue?')) {
      clearAllData();
    }
  }
  
  /**
   * Clear all stored data
   */
  function clearAllData() {
    try {
      // Clear feeds
      feedManager.clearCustomFeeds();
      
      // Clear player state
      localStorage.removeItem('mediaPlayerState');
      
      // Update feed buttons
      uiManager.renderFeedButtons(feedManager.getAllFeeds());
      
      // Load first feed if available
      const feeds = feedManager.getAllFeeds();
      if (feeds.length > 0) {
        loadFeed(feeds[0]);
      }
      
      uiManager.showNotification('All custom data has been cleared', 'success');
      
    } catch (error) {
      uiManager.showNotification('Error clearing data: ' + error.message, 'error');
    }
  }
});