// Kamiskaze Archives - Simplified Player
document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video-player');
  const trackList = document.getElementById('track-list');
  const nowPlayingTitle = document.getElementById('now-playing-title');

  const DEFAULT_POSTER = 'images/cassette-single.png';

  let tracks = [];
  let currentIndex = 0;

  // Load tracks from feed.json
  async function loadTracks() {
    try {
      const response = await fetch('feed.json');
      const data = await response.json();
      // Use first feed (Palm Springs performance)
      tracks = data.feeds[0]?.tracks || [];
      renderTrackList();
      restoreState();
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  }

  // Render track list as accessible buttons (keyboard + screen reader friendly)
  function renderTrackList() {
    trackList.innerHTML = tracks.map((track, index) => `
      <li>
        <button type="button" class="track-row" data-index="${index}">
          <span class="track-number">${index + 1}</span>
          <span class="track-title">${track.title}</span>
          <span class="track-indicator" aria-hidden="true">▶</span>
        </button>
      </li>
    `).join('');

    // Add click handlers
    trackList.querySelectorAll('.track-row').forEach(button => {
      button.addEventListener('click', () => {
        playTrack(parseInt(button.dataset.index));
      });
    });
  }

  // Play a track
  function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;

    currentIndex = index;
    const track = tracks[index];

    video.src = track.audioUrl;
    setPoster(track);
    video.play();

    highlightTrack(index);
    updateNowPlaying(track);
    saveState();
  }

  // Highlight active track
  function highlightTrack(index) {
    trackList.querySelectorAll('.track-row').forEach((button, i) => {
      if (i === index) {
        button.setAttribute('aria-current', 'true');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  }

  // Update the "Now Playing" caption
  function updateNowPlaying(track) {
    nowPlayingTitle.textContent = track.title;
  }

  // Show album art in the video frame before/while playing (falls back to default)
  function setPoster(track) {
    video.poster = track.albumArt || DEFAULT_POSTER;
  }

  // Auto-advance to next track
  video.addEventListener('ended', () => {
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(nextIndex);
  });

  // State persistence
  function saveState() {
    localStorage.setItem('kamiskaze-state', JSON.stringify({
      index: currentIndex,
      time: video.currentTime
    }));
  }

  function restoreState() {
    try {
      const saved = localStorage.getItem('kamiskaze-state');
      if (saved) {
        const state = JSON.parse(saved);
        currentIndex = state.index || 0;

        if (tracks[currentIndex]) {
          const track = tracks[currentIndex];
          video.src = track.audioUrl;
          setPoster(track);
          highlightTrack(currentIndex);
          updateNowPlaying(track);

          video.addEventListener('loadedmetadata', () => {
            if (state.time) {
              video.currentTime = Math.min(state.time, video.duration);
            }
          }, { once: true });
        }
      } else if (tracks.length > 0) {
        // Default to first track (queued, not auto-played)
        const track = tracks[0];
        video.src = track.audioUrl;
        setPoster(track);
        highlightTrack(0);
        updateNowPlaying(track);
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }

  // Save state periodically during playback
  video.addEventListener('timeupdate', () => {
    if (Math.floor(video.currentTime) % 5 === 0) {
      saveState();
    }
  });

  // Initialize
  await loadTracks();
});
