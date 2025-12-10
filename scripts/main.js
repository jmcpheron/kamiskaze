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
      initializeChangelog();
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

    // Clear audio mode class
    if (videoWrapper) videoWrapper.classList.remove('audio-mode');

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
    // Hide video element but keep controls overlay visible
    if (videoElement) {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
      videoElement.style.display = 'none';
    }

    // Show controls overlay (works with audio via getActiveMedia())
    if (videoControlsOverlay) videoControlsOverlay.style.display = 'block';

    // Initialize VideoControls if needed
    if (!videoControls && window.VideoControls) {
      videoControls = new VideoControls();
    }

    // Mark as audio mode for potential CSS styling
    if (videoWrapper) videoWrapper.classList.add('audio-mode');

    // Show audio fallback with album art
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

        // Wait for metadata to load before setting currentTime
        // This fixes the race condition where currentTime was ignored
        if (state.currentTime || state.playbackSpeed) {
          const restorePosition = () => {
            if (state.currentTime && !isNaN(audioPlayer.duration)) {
              audioPlayer.currentTime = Math.min(state.currentTime, audioPlayer.duration);
            }
            if (state.playbackSpeed) {
              audioPlayer.playbackRate = state.playbackSpeed;
            }
            audioPlayer.removeEventListener('loadedmetadata', restorePosition);
          };

          // If metadata is already loaded, restore immediately
          if (audioPlayer.readyState >= 1) {
            restorePosition();
          } else {
            audioPlayer.addEventListener('loadedmetadata', restorePosition);
          }
        }
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
    if (hash === 'player' || hash === 'about' || hash === 'changelog') switchTab(hash);
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
  // LOADING & ERROR HANDLING
  // ============================================
  function showLoadingIndicator(show) {
    const loadingSpinner = document.querySelector('.video-loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.classList.toggle('visible', show);
    }
    // Also toggle on video wrapper for CSS styling
    if (videoWrapper) {
      videoWrapper.classList.toggle('loading', show);
    }
  }

  function handleMediaError(e) {
    const mediaElement = e.target;
    const error = mediaElement.error;

    let errorMessage = 'An error occurred during playback.';

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Playback was aborted.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'A network error occurred. Please check your connection.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'The media file could not be decoded.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'The media format is not supported.';
          break;
      }
    }

    console.error('Media error:', error);
    showNotification(errorMessage, 'error');
    showLoadingIndicator(false);
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

    // Buffering and loading indicators
    audioPlayer.addEventListener('waiting', () => showLoadingIndicator(true));
    audioPlayer.addEventListener('canplay', () => showLoadingIndicator(false));
    audioPlayer.addEventListener('playing', () => showLoadingIndicator(false));
    audioPlayer.addEventListener('stalled', () => showLoadingIndicator(true));

    // Error handling for media
    audioPlayer.addEventListener('error', handleMediaError);
    if (videoElement) {
      videoElement.addEventListener('error', handleMediaError);
    }

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
  // CHANGELOG FUNCTIONALITY
  // ============================================
  const GITHUB_REPO = 'jmcpheron/kamiskaze';
  const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
  let changelogLoaded = false;

  async function loadChangelog() {
    const loadingEl = document.getElementById('changelog-loading');
    const errorEl = document.getElementById('changelog-error');
    const entriesEl = document.getElementById('changelog-entries');

    if (!entriesEl) return;

    try {
      const response = await fetch(RELEASES_API, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const releases = await response.json();

      // Filter to only snapshot releases
      const snapshots = releases.filter(r => r.tag_name.includes('snapshot'));

      if (loadingEl) loadingEl.style.display = 'none';

      if (snapshots.length === 0) {
        entriesEl.innerHTML = '<p class="no-changelog">No visual changelog entries yet. Screenshots will appear here after the first push to main.</p>';
        return;
      }

      // Render entries
      entriesEl.innerHTML = snapshots.map(release => renderChangelogEntry(release)).join('');

    } catch (error) {
      console.error('Failed to load changelog:', error);
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'block';
    }
  }

  function renderChangelogEntry(release) {
    const date = new Date(release.published_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Extract commit hash from body (if available)
    const commitMatch = release.body ? release.body.match(/\*\*Commit:\*\* ([a-f0-9]+)/) : null;
    const commitHash = commitMatch ? commitMatch[1].substring(0, 7) : null;

    // Get screenshot assets
    const screenshots = release.assets.filter(a => a.name.endsWith('.png'));

    // Extract commit message from release name
    const message = release.name.replace('Visual Snapshot - ', '');

    const githubIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;

    return `
      <article class="changelog-entry">
        <div class="changelog-entry-header">
          <span class="changelog-entry-date">${formattedDate}</span>
          ${commitHash ? `
            <span class="changelog-entry-commit">
              <a href="https://github.com/${GITHUB_REPO}/commit/${commitHash}" target="_blank" rel="noopener">
                ${commitHash}
              </a>
            </span>
          ` : ''}
        </div>

        <h3 class="changelog-entry-message">${escapeHtml(message)}</h3>

        ${screenshots.length > 0 ? `
          <div class="changelog-screenshots">
            ${screenshots.map(asset => `
              <div class="changelog-screenshot" onclick="window.open('${asset.browser_download_url}', '_blank')">
                <img src="${asset.browser_download_url}" alt="${asset.name}" loading="lazy">
                <span class="changelog-screenshot-label">${formatScreenshotLabel(asset.name)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <a href="${release.html_url}" target="_blank" rel="noopener" class="changelog-github-link">
          ${githubIcon}
          View Release on GitHub
        </a>
      </article>
    `;
  }

  function formatScreenshotLabel(filename) {
    // Convert "player-video-dark.png" to "Player Video Dark"
    const name = filename.replace('.png', '');
    const parts = name.split('-');

    const labels = {
      'player': 'Player',
      'video': 'Video',
      'audio': 'Audio',
      'dark': 'Dark',
      'light': 'Light',
      'about': 'About',
      'page': 'Page'
    };

    return parts.map(p => labels[p] || p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initializeChangelog() {
    // Check if changelog tab exists
    const changelogTab = document.getElementById('changelog-tab');
    if (!changelogTab) return;

    // Use MutationObserver to load changelog when tab becomes visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active') && !changelogLoaded) {
          loadChangelog();
          changelogLoaded = true;
        }
      });
    });

    observer.observe(changelogTab, { attributes: true, attributeFilter: ['class'] });

    // Also load if directly navigating to #changelog
    if (window.location.hash === '#changelog') {
      loadChangelog();
      changelogLoaded = true;
    }
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
