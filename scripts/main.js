// Kamiskaze Media Player - Simplified
document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const audioPlayer = document.getElementById('audio-player');
  const videoElement = document.getElementById('video-element');
  const audioDisplayFallback = document.getElementById('audio-display-fallback');
  const videoControlsOverlay = document.getElementById('video-controls-overlay');
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
  const trackList = document.getElementById('track-list');
  const notificationArea = document.getElementById('notification-area');
  const playlistButtons = document.getElementById('playlist-buttons');
  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
  const themeToggle = document.getElementById('theme-toggle');
  const videoWrapper = document.querySelector('.video-wrapper');

  // ============================================
  // STATE
  // ============================================
  let currentFeed = null;
  let currentTrackIndex = 0;
  let isPlaying = false;
  let feeds = [];
  let videoControls = null;
  let videoSyncCleanup = null;

  // ============================================
  // INITIALIZATION
  // ============================================
  async function initializeApp() {
    try {
      await loadFeeds();
      setupEventListeners();
      initializeTheme();

      if (feeds.length > 0) {
        setCurrentFeed(feeds[0]);
        renderPlaylistButtons();
      }

      restorePlayerState();
      updatePlayPauseButton();
      updateArchiveStats();

      window.addEventListener('popstate', handleInitialHash);
      setTimeout(handleInitialHash, 100);
    } catch (error) {
      showNotification('Error initializing app: ' + error.message, 'error');
      console.error('Initialization error:', error);
    }
  }

  // ============================================
  // FEED MANAGEMENT
  // ============================================
  async function loadFeeds() {
    try {
      const response = await fetch('feed.json');
      if (!response.ok) throw new Error('Failed to load feeds');
      const data = await response.json();
      feeds = data.feeds || [];
    } catch (error) {
      showNotification('Failed to load feeds', 'error');
      console.error('Error loading feeds:', error);
    }
  }

  function setCurrentFeed(feed) {
    currentFeed = feed;
    currentTrackIndex = 0;
    renderTrackList();
    updateActivePlaylistButton();
    loadTrack(0);
  }

  // ============================================
  // PLAYBACK CONTROLS
  // ============================================
  function isVideoFile(url) {
    return /\.(mp4|webm|mkv)$/i.test(url);
  }

  function loadTrack(index) {
    if (!currentFeed?.tracks?.[index]) return;

    const track = currentFeed.tracks[index];
    currentTrackIndex = index;

    // Clean up previous video sync
    if (videoSyncCleanup) {
      videoSyncCleanup();
      videoSyncCleanup = null;
    }

    // Set audio source
    audioPlayer.src = track.audioUrl;
    audioPlayer.load();

    // Update track info
    if (trackInfoElement) {
      trackInfoElement.innerHTML = `
        <h2>${track.title || 'Unknown Track'}</h2>
        <p>${track.description || ''}</p>
      `;
    }

    // Handle video vs audio display
    if (isVideoFile(track.audioUrl)) {
      setupVideoPlayback(track.audioUrl);
    } else {
      showAudioFallback(track);
    }

    highlightCurrentTrack();
    savePlayerState();
  }

  function setupVideoPlayback(src) {
    if (!videoElement) return;

    // Initialize VideoControls if needed
    if (!videoControls && window.VideoControls) {
      videoControls = new VideoControls();
    }

    // Reset and set new source
    videoElement.pause();
    videoElement.src = src;
    videoElement.style.display = 'block';

    // Show video controls, hide audio fallback
    if (videoControlsOverlay) videoControlsOverlay.style.display = 'block';
    if (audioDisplayFallback) audioDisplayFallback.style.display = 'none';

    // Sync video with audio
    const syncTime = () => {
      if (Math.abs(videoElement.currentTime - audioPlayer.currentTime) > 0.3) {
        videoElement.currentTime = audioPlayer.currentTime;
      }
    };

    const syncPlay = () => {
      videoElement.play().catch(() => {});
    };

    const syncPause = () => {
      videoElement.pause();
    };

    audioPlayer.addEventListener('timeupdate', syncTime);
    audioPlayer.addEventListener('play', syncPlay);
    audioPlayer.addEventListener('pause', syncPause);

    // Store cleanup function
    videoSyncCleanup = () => {
      audioPlayer.removeEventListener('timeupdate', syncTime);
      audioPlayer.removeEventListener('play', syncPlay);
      audioPlayer.removeEventListener('pause', syncPause);
    };

    // Keep video muted (audio comes from audioPlayer)
    videoElement.muted = true;
  }

  function showAudioFallback(track) {
    // Hide video
    if (videoElement) {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
      videoElement.style.display = 'none';
    }
    if (videoControlsOverlay) videoControlsOverlay.style.display = 'none';

    // Show audio fallback
    if (audioDisplayFallback) audioDisplayFallback.style.display = 'flex';

    // Set album art
    if (albumArt) {
      albumArt.src = track.albumArt || 'images/cassette-single.png';
      albumArt.onerror = () => { albumArt.src = 'images/cassette-single.png'; };
      albumArt.style.display = 'block';
    }
    if (defaultArt) defaultArt.style.display = 'none';
  }

  function togglePlayPause() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function playAudio() {
    audioPlayer.play().then(() => {
      isPlaying = true;
      updatePlayPauseButton();
    }).catch(error => {
      showNotification('Error playing audio: ' + error.message, 'error');
    });
  }

  function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayPauseButton();
  }

  function playPreviousTrack() {
    if (!currentFeed?.tracks) return;

    if (audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
    } else {
      currentTrackIndex = (currentTrackIndex - 1 + currentFeed.tracks.length) % currentFeed.tracks.length;
      loadTrack(currentTrackIndex);
      playAudio();
    }
  }

  function playNextTrack() {
    if (!currentFeed?.tracks) return;
    currentTrackIndex = (currentTrackIndex + 1) % currentFeed.tracks.length;
    loadTrack(currentTrackIndex);
    playAudio();
  }

  // ============================================
  // PROGRESS & TIME
  // ============================================
  function seekTrack() {
    if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
    audioPlayer.currentTime = seekBar.value;
  }

  function updateProgress() {
    if (!audioPlayer.duration || isNaN(audioPlayer.duration)) {
      if (seekBar) seekBar.value = 0;
      if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(0);
      return;
    }

    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    const progressPercent = (currentTime / duration) * 100;

    if (seekBar) seekBar.value = currentTime;

    document.documentElement.style.setProperty('--seek-progress', `${progressPercent}%`);

    const seekProgressBar = document.querySelector('.seek-progress-bar');
    if (seekProgressBar) seekProgressBar.style.width = `${progressPercent}%`;

    if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);

    // Save state periodically
    if (Math.floor(currentTime) % 5 === 0) savePlayerState();

    updateTrackProgress();
  }

  function updateDuration() {
    const duration = audioPlayer.duration;
    if (durationDisplay) durationDisplay.textContent = formatTime(duration);
    if (seekBar && !isNaN(duration)) seekBar.max = duration;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================
  // UI UPDATES
  // ============================================
  function updatePlayPauseButton() {
    if (!playIcon || !pauseIcon || !playPauseButton) return;

    if (isPlaying) {
      playIcon.style.opacity = '0';
      playIcon.style.transform = 'translate(-43%, -50%) scale(0)';
      pauseIcon.style.opacity = '1';
      pauseIcon.style.transform = 'translate(-50%, -50%) scale(1)';
      playPauseButton.classList.add('playing');
      if (videoWrapper) videoWrapper.classList.add('playing');
    } else {
      playIcon.style.opacity = '1';
      playIcon.style.transform = 'translate(-43%, -50%) scale(1)';
      pauseIcon.style.opacity = '0';
      pauseIcon.style.transform = 'translate(-50%, -50%) scale(0)';
      playPauseButton.classList.remove('playing');
      if (videoWrapper) videoWrapper.classList.remove('playing');
    }
  }

  function renderPlaylistButtons() {
    if (!playlistButtons) return;
    playlistButtons.innerHTML = '';

    feeds.forEach(feed => {
      const button = document.createElement('button');
      button.className = 'playlist-button';
      button.dataset.feedId = feed.id;
      if (currentFeed?.id === feed.id) button.classList.add('active');
      button.textContent = feed.title;
      button.addEventListener('click', () => setCurrentFeed(feed));
      playlistButtons.appendChild(button);
    });
  }

  function updateActivePlaylistButton() {
    if (!playlistButtons) return;
    playlistButtons.querySelectorAll('.playlist-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.feedId === currentFeed?.id);
    });
  }

  function renderTrackList() {
    if (!trackList || !currentFeed?.tracks) return;
    trackList.innerHTML = '';

    // Update header
    const titleEl = document.querySelector('.tracklist-title');
    const descEl = document.querySelector('.tracklist-description');
    if (titleEl) titleEl.innerHTML = `${currentFeed.title} <span class="track-count">(${currentFeed.tracks.length} tracks)</span>`;
    if (descEl) descEl.textContent = currentFeed.description || '';

    // Render tracks
    currentFeed.tracks.forEach((track, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      li.dataset.trackNum = index + 1;
      if (index === currentTrackIndex) li.classList.add('playing');

      // Thumbnail
      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'track-thumbnail';
      if (isVideoFile(track.audioUrl)) thumbContainer.classList.add('video-track');

      const thumb = document.createElement('img');
      thumb.className = 'track-thumbnail-image';
      thumb.src = track.thumbnail || track.albumArt || 'images/cassette-single.png';
      thumb.onerror = () => { thumb.src = 'images/cassette-single.png'; };
      thumbContainer.appendChild(thumb);

      // Info
      const info = document.createElement('div');
      info.className = 'track-info';
      info.innerHTML = `<h4>${track.title || 'Unknown Track'}</h4>${track.artist ? `<p>${track.artist}</p>` : ''}`;

      // Progress
      const progress = document.createElement('div');
      progress.className = 'track-progress';
      progress.textContent = 'Not played';

      li.append(thumbContainer, info, progress);
      li.addEventListener('click', () => {
        currentTrackIndex = index;
        loadTrack(index);
        playAudio();
      });

      trackList.appendChild(li);
    });
  }

  function highlightCurrentTrack() {
    if (!trackList) return;
    trackList.querySelectorAll('li').forEach((item, index) => {
      item.classList.toggle('playing', index === currentTrackIndex);
    });
  }

  function updateTrackProgress() {
    if (!audioPlayer.duration || !trackList) return;

    const currentItem = trackList.querySelectorAll('li')[currentTrackIndex];
    const progress = currentItem?.querySelector('.track-progress');
    if (progress) {
      const percent = Math.floor((audioPlayer.currentTime / audioPlayer.duration) * 100);
      progress.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)} (${percent}%)`;
    }
  }

  // ============================================
  // PERSISTENCE
  // ============================================
  function savePlayerState() {
    if (!currentFeed) return;
    localStorage.setItem('playerState', JSON.stringify({
      feedId: currentFeed.id,
      trackIndex: currentTrackIndex,
      currentTime: audioPlayer.currentTime,
      playbackSpeed: audioPlayer.playbackRate
    }));
  }

  function restorePlayerState() {
    const saved = localStorage.getItem('playerState');
    if (!saved) return;

    try {
      const state = JSON.parse(saved);
      const feed = feeds.find(f => f.id === state.feedId);
      if (feed) {
        setCurrentFeed(feed);
        currentTrackIndex = state.trackIndex || 0;
        renderTrackList();
        loadTrack(currentTrackIndex);
        if (state.currentTime) audioPlayer.currentTime = state.currentTime;
        if (state.playbackSpeed) audioPlayer.playbackRate = state.playbackSpeed;
      }
    } catch (error) {
      console.error('Error restoring player state:', error);
    }
  }

  // ============================================
  // THEME
  // ============================================
  function initializeTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      applyTheme(saved);
    } else {
      applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    showNotification(`Switched to ${newTheme} mode`, 'success');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // ============================================
  // NAVIGATION & STATS
  // ============================================
  function switchTab(targetTab) {
    navLinks.forEach(link => link.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const targetLink = document.querySelector(`[data-tab="${targetTab}"]`);
    const targetContent = document.getElementById(`${targetTab}-tab`);

    if (targetLink && targetContent) {
      targetLink.classList.add('active');
      targetContent.classList.add('active');
      history.pushState(null, null, `#${targetTab}`);
      if (targetTab === 'about') updateArchiveStats();
    }
  }

  function handleInitialHash() {
    const hash = window.location.hash.substring(1);
    if (hash === 'player' || hash === 'about') switchTab(hash);
  }

  function updateArchiveStats() {
    const totalTracks = feeds.reduce((sum, feed) => sum + (feed.tracks?.length || 0), 0);
    const tracksEl = document.getElementById('total-tracks');
    const collectionsEl = document.getElementById('total-collections');
    if (tracksEl) tracksEl.textContent = totalTracks;
    if (collectionsEl) collectionsEl.textContent = feeds.length;
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  let notification = null;

  function showNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    if (!notificationArea) return;

    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      notificationArea.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    if (type !== 'error') {
      setTimeout(() => { notification.style.display = 'none'; }, 3000);
    }
  }

  // ============================================
  // KEYBOARD CONTROLS
  // ============================================
  function handleKeyboardControls(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          playPreviousTrack();
        } else {
          audioPlayer.currentTime -= 10;
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          playNextTrack();
        } else {
          audioPlayer.currentTime += 10;
        }
        break;
      case 'f':
        if (videoWrapper && document.fullscreenElement !== videoWrapper) {
          videoWrapper.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        break;
      case '1': case '2': case '3': case '4': case '5':
        const speeds = [0.5, 0.75, 1, 1.5, 2];
        audioPlayer.playbackRate = speeds[parseInt(e.key) - 1];
        break;
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  function setupEventListeners() {
    // Player controls
    if (playPauseButton) playPauseButton.addEventListener('click', togglePlayPause);
    if (prevButton) prevButton.addEventListener('click', playPreviousTrack);
    if (nextButton) nextButton.addEventListener('click', playNextTrack);
    if (seekBar) seekBar.addEventListener('input', seekTrack);

    // Audio events
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('ended', playNextTrack);
    audioPlayer.addEventListener('play', () => { isPlaying = true; updatePlayPauseButton(); });
    audioPlayer.addEventListener('pause', () => { isPlaying = false; updatePlayPauseButton(); });

    // Theme toggle
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Tab navigation
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Keyboard controls
    document.addEventListener('keydown', handleKeyboardControls);
  }

  // ============================================
  // ERROR HANDLING
  // ============================================
  window.addEventListener('error', (e) => {
    showNotification('Error: ' + e.message, 'error');
    console.error('Global error:', e);
  });

  window.addEventListener('unhandledrejection', (e) => {
    showNotification('Error: ' + e.reason, 'error');
    console.error('Unhandled rejection:', e);
  });

  // ============================================
  // START
  // ============================================
  initializeApp();
});
