// Modern Minimal Audio Player JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // CSS Variable Setup
  document.documentElement.style.setProperty('--space-xs', '4px');
  document.documentElement.style.setProperty('--space-sm', '8px');
  document.documentElement.style.setProperty('--space-md', '16px');
  document.documentElement.style.setProperty('--space-lg', '24px');
  document.documentElement.style.setProperty('--space-xl', '32px');
  document.documentElement.style.setProperty('--transition-fast', '150ms ease');
  document.documentElement.style.setProperty('--transition-normal', '250ms ease');
  document.documentElement.style.setProperty('--transition-slow', '350ms ease');
  document.documentElement.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.1)');
  document.documentElement.style.setProperty('--shadow-md', '0 4px 8px rgba(0, 0, 0, 0.12)');
  document.documentElement.style.setProperty('--shadow-lg', '0 8px 16px rgba(0, 0, 0, 0.14)');
  document.documentElement.style.setProperty('--header-height', '60px');
  document.documentElement.style.setProperty('--footer-height', '40px');
  document.documentElement.style.setProperty('--player-width-max', '500px');
  document.documentElement.style.setProperty('--border-radius-xl', '24px');

  // DOM Elements
  const audioPlayer = document.getElementById('audio-player');
  const videoArtDisplay = document.getElementById('video-art-display');
  const albumArt = document.getElementById('custom-album-art');
  const defaultArt = document.getElementById('default-album-art');
  const trackInfoElement = document.getElementById('track-info-text');
  const seekBar = document.getElementById('seek-bar');
  const currentTimeDisplay = document.getElementById('current-time');
  const durationDisplay = document.getElementById('duration');
  const playPauseButton = document.getElementById('play-pause-button');
  const playIcon = document.querySelector('#play-pause-button .play-icon');
  const pauseIcon = document.querySelector('#play-pause-button .pause-icon');
  const prevButton = document.getElementById('prev-button');
  const nextButton = document.getElementById('next-button');
  const videoFullscreenButton = document.getElementById('video-fullscreen');
  const speedButtons = document.querySelectorAll('.speed-button');
  const trackList = document.getElementById('track-list');
  const notificationArea = document.getElementById('notification-area');
  const playlistButtons = document.getElementById('playlist-buttons');
  
  // Optional elements that may not exist in the current simplified UI
  const feedsToggle = document.getElementById('toggle-playlists-button');
  const playlistSelector = document.getElementById('playlist-buttons-container');
  const settingsButton = document.getElementById('toggle-settings-button');
  const settingsPanel = document.getElementById('settings-section');
  const addFeedForm = document.getElementById('add-feed-form');
  const feedUrlInput = document.getElementById('feed-url');
  const customFeedsList = document.getElementById('custom-feeds-list');
  const clearDataButton = document.getElementById('clear-cache-button');
  const helpButton = document.getElementById('help-button');
  const helpDialog = document.getElementById('help-dialog');
  const closeHelpButton = document.getElementById('close-help-dialog');

  // State
  let currentFeed = null;
  let currentTrackIndex = 0;
  let isPlaying = false;
  let feeds = [];
  let customFeeds = [];
  let videoMode = false;
  let notification = null; // Will be created when needed

  // Initialize
  initializeApp();

  // Core Functions
  async function initializeApp() {
    try {
      // Load feeds
      await loadDefaultFeeds();
      loadCustomFeeds();
      
      // Set up event listeners
      setupEventListeners();
      
      // Initialize with first feed
      if (feeds.length > 0) {
        setCurrentFeed(feeds[0]);
        renderPlaylistButtons();
        renderTrackList();
      }
      
      // Check for saved state
      restorePlayerState();
      
      // Update UI
      updatePlayPauseButton();

      // Initialize Feather icons again (for dynamic content)
      if (window.feather) {
        feather.replace();
      }
    } catch (error) {
      showNotification('Error initializing app: ' + error.message, 'error');
      console.error('Initialization error:', error);
    }
  }

  async function loadDefaultFeeds() {
    try {
      const response = await fetch('feed.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      feeds = data.feeds || [];
    } catch (error) {
      showNotification('Failed to load feeds', 'error');
      console.error('Error loading feeds:', error);
    }
  }

  function loadCustomFeeds() {
    const savedFeeds = localStorage.getItem('customFeeds');
    if (savedFeeds) {
      try {
        customFeeds = JSON.parse(savedFeeds);
        customFeeds.forEach(feed => feeds.push(feed));
        renderCustomFeedsList();
      } catch (error) {
        console.error('Error parsing custom feeds:', error);
      }
    }
  }

  function setupEventListeners() {
    // Player controls
    if (playPauseButton) playPauseButton.addEventListener('click', togglePlayPause);
    if (prevButton) prevButton.addEventListener('click', playPreviousTrack);
    if (nextButton) nextButton.addEventListener('click', playNextTrack);
    if (seekBar) seekBar.addEventListener('input', seekTrack);
    
    // Audio player events
    if (audioPlayer) {
      audioPlayer.addEventListener('timeupdate', updateProgress);
      audioPlayer.addEventListener('loadedmetadata', updateDuration);
      audioPlayer.addEventListener('ended', handleTrackEnd);
    }
    
    // Video controls
    if (videoFullscreenButton) {
      videoFullscreenButton.addEventListener('click', toggleFullscreen);
    }
    
    // Video element events
    if (videoArtDisplay) {
      videoArtDisplay.addEventListener('error', (e) => {
        console.error('Video error:', e);
        showNotification('Error loading video: ' + (e.message || 'Unknown error'), 'error');
      });
    }
    
    // Speed controls
    if (speedButtons) {
      speedButtons.forEach(button => {
        button.addEventListener('click', () => {
          const speed = parseFloat(button.dataset.speed);
          setPlaybackSpeed(speed);
          
          // Update active button
          speedButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
        });
      });
    }
    
    // Playlist and feeds
    if (feedsToggle) feedsToggle.addEventListener('click', togglePlaylistSelector);
    
    // Settings
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        if (settingsPanel) {
          const isExpanded = settingsButton.getAttribute('aria-expanded') === 'true';
          
          if (isExpanded) {
            settingsButton.setAttribute('aria-expanded', 'false');
            settingsPanel.classList.add('hidden');
          } else {
            settingsButton.setAttribute('aria-expanded', 'true');
            settingsPanel.classList.remove('hidden');
          }
          
          if (window.feather) feather.replace();
        }
      });
    }
    if (closeHelpButton && settingsPanel) {
      closeHelpButton.addEventListener('click', () => settingsPanel.classList.add('hidden'));
    }
    
    // Add feed form
    if (addFeedForm) {
      addFeedForm.addEventListener('submit', handleAddFeed);
    }
    
    // Clear data button
    if (clearDataButton) {
      clearDataButton.addEventListener('click', confirmClearData);
    }
    
    // Help dialog
    if (helpButton && helpDialog) {
      helpButton.addEventListener('click', () => {
        helpDialog.classList.remove('hidden');
        if (window.feather) feather.replace();
      });
    }
    if (closeHelpButton && helpDialog) {
      closeHelpButton.addEventListener('click', () => helpDialog.classList.add('hidden'));
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });
    
    // Key controls
    document.addEventListener('keydown', handleKeyboardControls);

    // Add sample feed handler
    const feedSuggestion = document.getElementById('feed-suggestion');
    if (feedSuggestion) {
      feedSuggestion.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          e.preventDefault();
          if (feedUrlInput) feedUrlInput.value = 'palm-springs-feed.json';
        }
      });
    }
  }

  function restorePlayerState() {
    const savedState = localStorage.getItem('playerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.feedId) {
          const feed = feeds.find(f => f.id === state.feedId);
          if (feed) {
            setCurrentFeed(feed);
            currentTrackIndex = state.trackIndex || 0;
            renderTrackList();
            loadTrack(currentTrackIndex);
            
            // Restore playback position
            if (state.currentTime) {
              audioPlayer.currentTime = state.currentTime;
            }
            
            // Restore speed
            if (state.playbackSpeed) {
              setPlaybackSpeed(state.playbackSpeed);
            }
          }
        }
      } catch (error) {
        console.error('Error restoring player state:', error);
      }
    }
  }

  function savePlayerState() {
    if (!currentFeed) return;
    
    const state = {
      feedId: currentFeed.id,
      trackIndex: currentTrackIndex,
      currentTime: audioPlayer.currentTime,
      playbackSpeed: audioPlayer.playbackRate
    };
    
    localStorage.setItem('playerState', JSON.stringify(state));
  }

  // Playback Controls
  function togglePlayPause() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function playAudio() {
    // Play the audio
    audioPlayer.play().then(() => {
      isPlaying = true;
      updatePlayPauseButton();
      
      // Video is now handled via event listeners in loadTrack
    }).catch(error => {
      showNotification('Error playing audio: ' + error.message, 'error');
      console.error('Error playing audio:', error);
    });
  }

  function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayPauseButton();
    
    // Video is now handled via event listeners in loadTrack
  }

  function updatePlayPauseButton() {
    if (isPlaying) {
      playIcon.style.opacity = '0';
      playIcon.style.transform = 'translate(-43%, -50%) scale(0)';
      pauseIcon.style.opacity = '1';
      pauseIcon.style.transform = 'translate(-50%, -50%) scale(1)';
      playPauseButton.classList.add('playing');
    } else {
      playIcon.style.opacity = '1';
      playIcon.style.transform = 'translate(-43%, -50%) scale(1)';
      pauseIcon.style.opacity = '0';
      pauseIcon.style.transform = 'translate(-50%, -50%) scale(0)';
      playPauseButton.classList.remove('playing');
    }
  }

  function playPreviousTrack() {
    if (!currentFeed || !currentFeed.tracks) return;
    
    if (audioPlayer.currentTime > 3) {
      // If current track has played for more than 3 seconds, restart it
      audioPlayer.currentTime = 0;
    } else {
      // Play the previous track
      currentTrackIndex = (currentTrackIndex - 1 + currentFeed.tracks.length) % currentFeed.tracks.length;
      loadTrack(currentTrackIndex);
      playAudio();
    }
  }

  function playNextTrack() {
    if (!currentFeed || !currentFeed.tracks) return;
    
    currentTrackIndex = (currentTrackIndex + 1) % currentFeed.tracks.length;
    loadTrack(currentTrackIndex);
    playAudio();
  }

  function handleTrackEnd() {
    playNextTrack();
  }

  // Handle video playback
  function setupVideoPlayback(videoSource) {
    // Make sure we have the video element
    if (!videoArtDisplay) {
      console.error('Video element not found');
      return false;
    }
    
    try {
      console.log('Setting up video playback for source:', videoSource);
      
      // Reset previous video state
      videoArtDisplay.pause();
      
      // Clear any previous error handlers
      videoArtDisplay.onerror = null;
      
      // Add error handler before setting source
      videoArtDisplay.onerror = function(e) {
        const errorMessage = getVideoErrorMessage(videoArtDisplay.error);
        console.error(`Video error: ${errorMessage}`, videoArtDisplay.error);
        showNotification(`Video error: ${errorMessage}`, 'error');
        
        // Fall back to audio-only mode
        const albumArtContainer = document.getElementById('album-art');
        if (albumArtContainer) {
          albumArtContainer.classList.remove('video-active');
        }
        
        videoArtDisplay.style.display = 'none';
        
        // Show default art instead
        if (defaultArt) {
          defaultArt.classList.remove('hidden');
          defaultArt.style.display = 'block';
        }
        
        // Hide video controls
        const videoControlsOverlay = document.getElementById('video-controls-overlay');
        if (videoControlsOverlay) {
          videoControlsOverlay.style.display = 'none';
        }
        
        return false;
      };
      
      // Set new source
      videoArtDisplay.src = videoSource;
      
      // Show video element and controls
      videoArtDisplay.style.display = 'block';
      videoArtDisplay.classList.remove('hidden');
      
      // Show video controls overlay
      const videoControlsOverlay = document.getElementById('video-controls-overlay');
      if (videoControlsOverlay) {
        videoControlsOverlay.style.display = 'flex';
      }
      
      // Hide album art elements
      if (albumArt) {
        albumArt.classList.add('hidden');
        albumArt.style.display = 'none';
      }
      if (defaultArt) {
        defaultArt.classList.add('hidden');
        defaultArt.style.display = 'none';
      }
      
      // Add event listeners for synchronization
      const syncVideo = () => {
        if (Math.abs(videoArtDisplay.currentTime - audioPlayer.currentTime) > 0.3) {
          videoArtDisplay.currentTime = audioPlayer.currentTime;
        }
        
        // Update video time display
        const videoTimeDisplay = document.getElementById('video-time-display');
        if (videoTimeDisplay) {
          videoTimeDisplay.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
        }
      };
      
      // Clean up previous event listeners
      const oldSync = videoArtDisplay._syncFunction;
      if (oldSync) {
        audioPlayer.removeEventListener('timeupdate', oldSync);
        audioPlayer.removeEventListener('play', oldSync);
        audioPlayer.removeEventListener('pause', oldSync);
      }
      
      // Store the sync function for future cleanup
      videoArtDisplay._syncFunction = syncVideo;
      
      // Add our new timeupdate listener
      audioPlayer.addEventListener('timeupdate', syncVideo);
      
      const playHandler = () => {
        if (videoArtDisplay.paused) {
          videoArtDisplay.play().catch(e => {
            console.error('Video play error:', e);
            // Don't show notification here as it's likely already handled by onerror
          });
        }
        
        // Update play/pause button icon if it exists
        updateVideoPlayPauseButton(true);
      };
      
      const pauseHandler = () => {
        if (!videoArtDisplay.paused) {
          videoArtDisplay.pause();
        }
        
        // Update play/pause button icon if it exists
        updateVideoPlayPauseButton(false);
      };
      
      // Add play/pause event listeners
      audioPlayer.addEventListener('play', playHandler);
      audioPlayer.addEventListener('pause', pauseHandler);
      
      // Initial sync when metadata is loaded
      videoArtDisplay.addEventListener('loadedmetadata', () => {
        syncVideo();
        
        if (isPlaying) {
          videoArtDisplay.play().catch(e => {
            console.error('Initial video play error:', e);
            // Don't show notification here as it's likely already handled by onerror
          });
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error setting up video:', error);
      showNotification('Error setting up video: ' + error.message, 'error');
      return false;
    }
  }
  
  // Helper function to get meaningful error messages from video error codes
  function getVideoErrorMessage(error) {
    if (!error) return 'Unknown error';
    
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Playback aborted by the user';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Network error occurred while loading the video';
      case MediaError.MEDIA_ERR_DECODE:
        return 'Video decoding error or corrupted data';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Video format not supported by your browser';
      default:
        return `Error code: ${error.code}`;
    }
  }
  
  // Update video play/pause button based on play state
  function updateVideoPlayPauseButton(isPlaying) {
    const videoPlayPauseButton = document.getElementById('video-play-pause');
    if (videoPlayPauseButton) {
      // Update the icon based on playing state
      if (isPlaying) {
        videoPlayPauseButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        `;
      } else {
        videoPlayPauseButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
      }
    }
  }

  // Load a track by index
  function loadTrack(index) {
    if (!currentFeed || !currentFeed.tracks || !currentFeed.tracks[index]) return;
    
    const track = currentFeed.tracks[index];
    currentTrackIndex = index;
    
    // Temporarily disable play button during load
    if (playPauseButton) {
      playPauseButton.disabled = true;
      playPauseButton.style.opacity = '0.7';
    }
    
    // Update audio source with error handling
    try {
      audioPlayer.src = track.audioUrl;
      audioPlayer.load();
      
      // Re-enable play button after a short delay
      setTimeout(() => {
        if (playPauseButton) {
          playPauseButton.disabled = false;
          playPauseButton.style.opacity = '1';
        }
      }, 500);
    } catch (error) {
      console.error('Error loading track:', error);
      showNotification('Error loading track: ' + error.message, 'error');
    }
    
    // Update track info
    if (trackInfoElement) {
      const trackTitle = document.createElement('h2');
      trackTitle.textContent = track.title || 'Unknown Track';
      
      const trackDesc = document.createElement('p');
      trackDesc.textContent = track.description || '';
      
      // Clear existing content
      trackInfoElement.innerHTML = '';
      trackInfoElement.appendChild(trackTitle);
      trackInfoElement.appendChild(trackDesc);
    }
    
    // Get album art container
    const albumArtContainer = document.getElementById('album-art');
    
    // Check if this is a video file by extension
    const isVideoFile = track.audioUrl.toLowerCase().endsWith('.mp4') || 
                        track.audioUrl.toLowerCase().endsWith('.webm') || 
                        track.audioUrl.toLowerCase().endsWith('.mkv');
    
    console.log(`Track ${index} is ${isVideoFile ? 'a video file' : 'not a video file'}: ${track.audioUrl}`);
    
    // Handle media display
    if (isVideoFile) {
      console.log('Setting up video playback...');
      
      // Set up video playback
      const videoSetupSuccess = setupVideoPlayback(track.audioUrl);
      console.log(`Video setup ${videoSetupSuccess ? 'successful' : 'failed'}`);
      
      // Add video-active class to album art container
      if (albumArtContainer) {
        albumArtContainer.classList.add('video-active');
      }
      
    } else {
      console.log('Setting up audio-only playback...');
      
      // Not a video file - show album art instead
      // Remove video-active class from album art container
      if (albumArtContainer) {
        albumArtContainer.classList.remove('video-active');
      }
      
      // Hide video element
      if (videoArtDisplay) {
        videoArtDisplay.pause();
        videoArtDisplay.src = '';
        videoArtDisplay.style.display = 'none';
      }
      
      // Hide video controls overlay
      const videoControlsOverlay = document.getElementById('video-controls-overlay');
      if (videoControlsOverlay) {
        videoControlsOverlay.style.display = 'none';
      }
      
      // Show appropriate album art
      if (track.albumArt) {
        if (albumArt) {
          albumArt.src = track.albumArt;
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
    
    // Update track list highlighting
    highlightCurrentTrack();
    
    // Save state
    savePlayerState();
  }

  function seekTrack() {
    // Ensure duration is available and is a number greater than 0
    if (!audioPlayer.duration || isNaN(audioPlayer.duration) || audioPlayer.duration <= 0) return;
    // Directly set the audio's current time to the seek bar's value
    // The seek bar's max value should be set to the audio duration
    audioPlayer.currentTime = seekBar.value;
  }

  function updateProgress() {
    // Prevent NaN when duration is not available or zero
    if (!audioPlayer.duration || isNaN(audioPlayer.duration) || audioPlayer.duration <= 0) {
        // Reset progress if duration is invalid
        if (seekBar) seekBar.value = 0;
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(0);
        document.documentElement.style.setProperty('--seek-progress', '0%');
        return;
    }

    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    const progressPercent = (currentTime / duration) * 100 || 0;

    // Update the seek bar value directly to the current time
    if (seekBar) {
        seekBar.value = currentTime;
    }

    // Update the seek bar's custom progress styling using CSS variables
    document.documentElement.style.setProperty('--seek-progress', `${progressPercent}%`);
    
    // Update time display
    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(currentTime);
    }

    // Save state periodically (every 5 seconds)
    if (Math.floor(currentTime) % 5 === 0) {
      savePlayerState();
    }

    // Update track progress in list
    updateTrackProgress();
  }

  function updateDuration() {
    const duration = audioPlayer.duration;
    // Ensure durationDisplay and seekBar exist
    if (durationDisplay) {
        durationDisplay.textContent = formatTime(duration);
    }
    // Set the max attribute of the seek bar to the audio duration
    if (seekBar && !isNaN(duration)) {
        seekBar.max = duration;
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function setPlaybackSpeed(speed) {
    audioPlayer.playbackRate = speed;
    
    // Update UI
    speedButtons.forEach(button => {
      if (parseFloat(button.dataset.speed) === speed) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Save state
    savePlayerState();
  }

  // Video Controls
  function toggleVideoMode() {
    if (!currentFeed || !currentFeed.tracks || !currentFeed.tracks[currentTrackIndex]) return;
    
    const track = currentFeed.tracks[currentTrackIndex];
    if (!track.videoUrl) return;
    
    if (videoMode) {
      disableVideoMode();
    } else {
      enableVideoMode(track.videoUrl);
    }
  }

  function enableVideoMode(videoUrl) {
    videoMode = true;
    videoArtDisplay.src = videoUrl;
    videoArtDisplay.classList.remove('hidden');
    albumArt.classList.add('hidden');
    defaultArt.classList.add('hidden');
    
    // Connect to audio timeline
    videoArtDisplay.currentTime = audioPlayer.currentTime;
    
    // Sync play/pause state
    if (isPlaying) {
      videoArtDisplay.play().catch(e => console.error('Error playing video:', e));
    } else {
      videoArtDisplay.pause();
    }
  }

  function disableVideoMode() {
    videoMode = false;
    videoArtDisplay.classList.add('hidden');
    
    // Show album art
    if (currentFeed && currentFeed.tracks[currentTrackIndex].imageUrl) {
      albumArt.classList.remove('hidden');
      defaultArt.classList.add('hidden');
    } else {
      albumArt.classList.add('hidden');
      defaultArt.classList.remove('hidden');
    }
    
    // Stop video to save resources
    videoArtDisplay.pause();
    videoArtDisplay.src = '';
  }

  function toggleFullscreen() {
    if (!videoArtDisplay) return;
    
    try {
      if (!document.fullscreenElement) {
        // Set the album art container to be the fullscreen element for better styling
        const albumArtContainer = document.getElementById('album-art');
        
        if (albumArtContainer) {
          albumArtContainer.requestFullscreen().catch(err => {
            // Fallback to just the video element if container fails
            videoArtDisplay.requestFullscreen().catch(innerErr => {
              showNotification(`Error attempting to enable fullscreen: ${innerErr.message}`, 'error');
            });
          });
        } else {
          videoArtDisplay.requestFullscreen().catch(err => {
            showNotification(`Error attempting to enable fullscreen: ${err.message}`, 'error');
          });
        }
      } else {
        document.exitFullscreen();
      }
    } catch (error) {
      showNotification(`Fullscreen error: ${error.message}`, 'error');
    }
  }

  // Playlist and Feed Management
  function setCurrentFeed(feed) {
    currentFeed = feed;
    currentTrackIndex = 0;
    
    // Update UI
    renderTrackList();
    updateActivePlaylistButton();
    
    // Load first track
    loadTrack(0);
  }

  function renderPlaylistButtons() {
    // Check for new playlist buttons element first
    if (playlistButtons) {
      playlistButtons.innerHTML = '';
      
      feeds.forEach(feed => {
        const button = document.createElement('button');
        button.className = 'playlist-button';
        button.dataset.feedId = feed.id;
        
        if (currentFeed && feed.id === currentFeed.id) {
          button.classList.add('active');
        }
        
        button.textContent = feed.title;
        
        button.addEventListener('click', () => {
          setCurrentFeed(feed);
        });
        
        playlistButtons.appendChild(button);
      });
      
      return;
    }
    
    // Fall back to old playlist selector if it exists
    if (playlistSelector) {
      console.log('Using legacy playlist selector');
      playlistSelector.innerHTML = '';
      
      feeds.forEach(feed => {
        const button = document.createElement('button');
        button.className = 'playlist-button';
        button.dataset.feedId = feed.id;
        
        if (currentFeed && feed.id === currentFeed.id) {
          button.classList.add('active');
        }
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'playlist-name';
        titleSpan.textContent = feed.title;
        
        const tracksSpan = document.createElement('span');
        tracksSpan.className = 'playlist-tracks';
        tracksSpan.textContent = `${feed.tracks.length} tracks`;
        
        button.appendChild(titleSpan);
        button.appendChild(tracksSpan);
        
        button.addEventListener('click', () => {
          setCurrentFeed(feed);
          if (typeof togglePlaylistSelector === 'function') {
            togglePlaylistSelector();
          }
        });
        
        playlistSelector.appendChild(button);
      });
    } else {
      console.log('No playlist selector found, skipping renderPlaylistButtons');
    }
    
    // Refresh Feather icons
    if (window.feather) {
      feather.replace();
    }
  }

  function togglePlaylistSelector() {
    // Skip if required elements don't exist
    if (!feedsToggle || !playlistSelector) {
      console.log('Required elements for togglePlaylistSelector not found');
      return;
    }
    
    const isExpanded = feedsToggle.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      feedsToggle.setAttribute('aria-expanded', 'false');
      playlistSelector.classList.add('collapsed');
    } else {
      feedsToggle.setAttribute('aria-expanded', 'true');
      playlistSelector.classList.remove('collapsed');
    }
  }

  function updateActivePlaylistButton() {
    // Check for new playlist buttons element first
    if (playlistButtons) {
      const buttons = playlistButtons.querySelectorAll('.playlist-button');
      buttons.forEach(button => {
        if (button.dataset.feedId === currentFeed.id) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });
      return;
    }
    
    // Fall back to old playlist selector if it exists
    if (playlistSelector) {
      const buttons = playlistSelector.querySelectorAll('.playlist-button');
      buttons.forEach(button => {
        if (button.dataset.feedId === currentFeed.id) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });
    } else {
      console.log('No playlist selector found, skipping updateActivePlaylistButton');
    }
  }

  function renderTrackList() {
    trackList.innerHTML = '';
    
    if (!currentFeed || !currentFeed.tracks) return;
    
    // Update track list container title and description
    const trackListContainerTitle = document.querySelector('#track-list-container h2');
    const trackListContainerDesc = document.querySelector('#track-list-container .playlist-description');
    
    if (trackListContainerTitle) {
      trackListContainerTitle.textContent = currentFeed.title || 'Playlist';
      
      // Update track count if span exists
      const trackCountSpan = trackListContainerTitle.querySelector('#track-count');
      if (trackCountSpan) {
        trackCountSpan.textContent = `(${currentFeed.tracks.length} tracks)`;
      }
    }
    
    if (trackListContainerDesc) {
      trackListContainerDesc.textContent = currentFeed.description || '';
    }
    
    // Render tracks
    currentFeed.tracks.forEach((track, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      
      if (index === currentTrackIndex) {
        li.classList.add('playing');
      }
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'track-info';
      
      const title = document.createElement('h4');
      title.textContent = track.title || 'Unknown Track';
      
      const artist = document.createElement('p');
      artist.textContent = track.artist || '';
      
      titleDiv.appendChild(title);
      if (track.artist) titleDiv.appendChild(artist);
      
      const progress = document.createElement('div');
      progress.className = 'track-progress';
      progress.textContent = 'Not played';
      
      li.appendChild(titleDiv);
      li.appendChild(progress);
      
      li.addEventListener('click', () => {
        currentTrackIndex = index;
        loadTrack(index);
        playAudio();
      });
      
      trackList.appendChild(li);
    });
    
    // Refresh Feather icons
    if (window.feather) {
      feather.replace();
    }
  }

  function highlightCurrentTrack() {
    const items = trackList.querySelectorAll('li');
    items.forEach((item, index) => {
      if (index === currentTrackIndex) {
        item.classList.add('playing');
      } else {
        item.classList.remove('playing');
      }
    });
  }

  function updateTrackProgress() {
    if (!audioPlayer.duration) return;
    
    const items = trackList.querySelectorAll('li');
    const currentItem = items[currentTrackIndex];
    
    if (currentItem) {
      const progress = currentItem.querySelector('.track-progress');
      if (progress) {
        const percent = Math.floor((audioPlayer.currentTime / audioPlayer.duration) * 100) || 0;
        progress.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)} (${percent}%)`;
      }
    }
  }

  // Feed Management
  async function handleAddFeed(e) {
    e.preventDefault();
    const url = feedUrlInput.value.trim();
    
    if (!url) {
      showNotification('Please enter a feed URL', 'warning');
      return;
    }
    
    try {
      showNotification('Loading feed...', 'info');
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch feed: ' + response.statusText);
      }
      
      const feedData = await response.json();
      
      // Validate feed structure
      if (!feedData.title || !feedData.tracks || !Array.isArray(feedData.tracks)) {
        throw new Error('Invalid feed format');
      }
      
      // Check for duplicate
      if (customFeeds.some(feed => feed.url === url)) {
        showNotification('This feed is already in your library', 'warning');
        return;
      }
      
      // Create new feed object
      const newFeed = {
        id: 'custom_' + Date.now(),
        title: feedData.title,
        description: feedData.description || '',
        tracks: feedData.tracks,
        url: url
      };
      
      // Add to feeds
      customFeeds.push(newFeed);
      feeds.push(newFeed);
      
      // Save to local storage
      localStorage.setItem('customFeeds', JSON.stringify(customFeeds));
      
      // Update UI
      renderCustomFeedsList();
      renderPlaylistButtons();
      
      // Switch to new feed
      setCurrentFeed(newFeed);
      
      // Reset form
      feedUrlInput.value = '';
      
      showNotification(`Added new feed: ${newFeed.title}`, 'success');
    } catch (error) {
      showNotification('Error adding feed: ' + error.message, 'error');
      console.error('Error adding feed:', error);
    }
  }

  function renderCustomFeedsList() {
    // Skip if custom feeds list doesn't exist
    if (!customFeedsList) {
      console.log('Custom feeds list not found, skipping renderCustomFeedsList');
      return;
    }
    
    customFeedsList.innerHTML = '';
    
    if (customFeeds.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No custom feeds added yet.';
      emptyMessage.className = 'help-text';
      customFeedsList.appendChild(emptyMessage);
      return;
    }
    
    customFeeds.forEach(feed => {
      const li = document.createElement('li');
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'feed-info';
      
      const title = document.createElement('div');
      title.className = 'feed-title';
      title.textContent = feed.title;
      
      const url = document.createElement('div');
      url.className = 'feed-url';
      url.textContent = feed.url;
      
      infoDiv.appendChild(title);
      infoDiv.appendChild(url);
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-feed';
      deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
      deleteButton.title = 'Delete feed';
      deleteButton.addEventListener('click', () => deleteFeed(feed.id));
      
      li.appendChild(infoDiv);
      li.appendChild(deleteButton);
      
      customFeedsList.appendChild(li);
    });
    
    // Refresh Feather icons
    if (window.feather) {
      feather.replace();
    }
  }

  function deleteFeed(feedId) {
    const index = customFeeds.findIndex(feed => feed.id === feedId);
    if (index === -1) return;
    
    const feedTitle = customFeeds[index].title;
    
    // Remove from arrays
    customFeeds.splice(index, 1);
    feeds = feeds.filter(feed => feed.id !== feedId);
    
    // Save to local storage
    localStorage.setItem('customFeeds', JSON.stringify(customFeeds));
    
    // Update UI
    renderCustomFeedsList();
    renderPlaylistButtons();
    
    // If current feed was deleted, switch to first available feed
    if (currentFeed && currentFeed.id === feedId) {
      if (feeds.length > 0) {
        setCurrentFeed(feeds[0]);
      } else {
        currentFeed = null;
        trackList.innerHTML = '<li>No feeds available</li>';
      }
    }
    
    showNotification(`Deleted feed: ${feedTitle}`, 'success');
  }

  function confirmClearData() {
    if (confirm('This will delete all your custom feeds and player settings. This action cannot be undone. Continue?')) {
      clearAllData();
    }
  }

  function clearAllData() {
    // Clear local storage
    localStorage.clear();
    
    // Reset state
    customFeeds = [];
    feeds = feeds.filter(feed => !feed.id.startsWith('custom_'));
    
    // Update UI
    renderCustomFeedsList();
    renderPlaylistButtons();
    
    // Set to first default feed if available
    if (feeds.length > 0) {
      setCurrentFeed(feeds[0]);
    }
    
    showNotification('All custom data has been cleared', 'success');
  }

  // Keyboard Controls
  function handleKeyboardControls(e) {
    // Don't trigger if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
      case ' ': // Space
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          playPreviousTrack();
        } else {
          audioPlayer.currentTime -= 10; // Rewind 10 seconds
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          playNextTrack();
        } else {
          audioPlayer.currentTime += 10; // Forward 10 seconds
        }
        break;
      case 'f':
        if (videoMode) toggleFullscreen();
        break;
      case 'v':
        toggleVideoMode();
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
          setPlaybackSpeed(speeds[index]);
        }
        break;
    }
  }

  // Notification System
  function showNotification(message, type = 'info') {
    // Log message to console regardless
    console.log(`[${type}] ${message}`);
    
    // Skip DOM operations if notification area doesn't exist
    if (!notificationArea) {
      console.warn('Notification area not found in DOM');
      return;
    }
    
    // Create notification element if it doesn't exist
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      notificationArea.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        notification.style.display = 'none';
      }, 3000);
    }
  }

  // Error handling
  window.addEventListener('error', (e) => {
    showNotification('Error: ' + e.message, 'error');
    console.error('Global error:', e);
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (e) => {
    showNotification('Promise error: ' + e.reason, 'error');
    console.error('Unhandled promise rejection:', e);
  });
}); 