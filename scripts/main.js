// Kamiskaze Archives - Simplified Player
document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video-player');
  const trackList = document.getElementById('track-list');

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

  // Render track list
  function renderTrackList() {
    trackList.innerHTML = tracks.map((track, index) => `
      <li data-index="${index}">
        <span class="track-number">${index + 1}.</span>
        <span class="track-title">${track.title}</span>
      </li>
    `).join('');

    // Add click handlers
    trackList.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        playTrack(parseInt(li.dataset.index));
      });
    });
  }

  // Play a track
  function playTrack(index) {
    if (index < 0 || index >= tracks.length) return;

    currentIndex = index;
    const track = tracks[index];

    video.src = track.audioUrl;
    video.play();

    highlightTrack(index);
    saveState();
  }

  // Highlight active track
  function highlightTrack(index) {
    trackList.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === index);
    });
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
          video.src = tracks[currentIndex].audioUrl;
          highlightTrack(currentIndex);

          video.addEventListener('loadedmetadata', () => {
            if (state.time) {
              video.currentTime = Math.min(state.time, video.duration);
            }
          }, { once: true });
        }
      } else if (tracks.length > 0) {
        // Default to first track
        video.src = tracks[0].audioUrl;
        highlightTrack(0);
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
