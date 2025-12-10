// Video Controls Module
class VideoControls {
  constructor() {
    this.video = document.getElementById('video-element');
    this.audioPlayer = document.getElementById('audio-player'); // Main audio player
    this.overlay = document.getElementById('video-controls-overlay');
    this.centerPlayBtn = document.getElementById('center-play-button');
    this.playPauseBtn = document.getElementById('video-play-pause');
    this.prevTrackBtn = document.getElementById('video-prev-track');
    this.nextTrackBtn = document.getElementById('video-next-track');
    this.rewindBtn = document.getElementById('video-rewind');
    this.forwardBtn = document.getElementById('video-forward');
    this.seekInput = document.getElementById('video-seek-input');
    this.progressBar = document.querySelector('.video-progress-bar');
    this.bufferedBar = document.querySelector('.video-buffered-bar');
    this.progressHandle = document.querySelector('.video-progress-handle');
    this.currentTimeDisplay = document.getElementById('video-current-time');
    this.durationDisplay = document.getElementById('video-duration');
    this.volumeBtn = document.getElementById('video-volume-button');
    this.volumeSlider = document.getElementById('video-volume-slider');
    this.speedBtn = document.getElementById('video-speed-button');
    this.pipBtn = document.getElementById('video-pip-button');
    this.fullscreenBtn = document.getElementById('video-fullscreen-button');
    this.timeTooltip = document.getElementById('video-time-tooltip');
    this.loadingSpinner = document.getElementById('video-loading-spinner');
    this.videoWrapper = document.querySelector('.video-wrapper');

    this.hideControlsTimer = null;
    this.isSeeking = false;
    this.playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    this.currentSpeedIndex = 2; // Default to 1x
    this.touchGestures = null;

    this.init();
  }

  // Get the active media element (audio player if available, otherwise video)
  getActiveMedia() {
    return this.audioPlayer && this.audioPlayer.src ? this.audioPlayer : this.video;
  }
  
  init() {
    if (!this.video) return;
    
    // Event listeners
    this.setupEventListeners();
    
    // Initialize touch gestures for mobile
    if ('ontouchstart' in window && window.TouchGestures) {
      this.touchGestures = new TouchGestures(this.videoWrapper, this.video, this);
    }
    
    // Initialize volume
    const savedVolume = localStorage.getItem('videoVolume') || 100;
    this.video.volume = savedVolume / 100;
    this.volumeSlider.value = savedVolume;
    
    // Initialize controls visibility
    this.showControls();
  }
  
  setupEventListeners() {
    // Video events
    this.video.addEventListener('play', () => this.handlePlayPause());
    this.video.addEventListener('pause', () => this.handlePlayPause());
    this.video.addEventListener('loadstart', () => this.showLoading());
    this.video.addEventListener('canplay', () => this.hideLoading());
    this.video.addEventListener('progress', () => this.updateBuffered());
    this.video.addEventListener('click', () => this.togglePlayPause());

    // Audio player events (primary source of truth for playback)
    if (this.audioPlayer) {
      this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
      this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
      this.audioPlayer.addEventListener('volumechange', () => this.updateVolume());
      this.audioPlayer.addEventListener('play', () => this.handlePlayPause());
      this.audioPlayer.addEventListener('pause', () => this.handlePlayPause());
    }

    // Control buttons
    this.centerPlayBtn.addEventListener('click', () => this.togglePlayPause());
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    if (this.prevTrackBtn) this.prevTrackBtn.addEventListener('click', () => this.prevTrack());
    if (this.nextTrackBtn) this.nextTrackBtn.addEventListener('click', () => this.nextTrack());
    this.rewindBtn.addEventListener('click', () => this.skip(-10));
    this.forwardBtn.addEventListener('click', () => this.skip(10));
    
    // Progress bar
    this.seekInput.addEventListener('input', (e) => this.handleSeek(e));
    this.seekInput.addEventListener('mousedown', () => this.isSeeking = true);
    this.seekInput.addEventListener('mouseup', () => this.isSeeking = false);
    this.seekInput.addEventListener('mousemove', (e) => this.updateTimeTooltip(e));
    
    // Volume
    this.volumeBtn.addEventListener('click', () => this.toggleMute());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    
    // Speed
    this.speedBtn.addEventListener('click', () => this.cycleSpeed());
    
    // Picture-in-Picture
    this.pipBtn.addEventListener('click', () => this.togglePiP());
    
    // Fullscreen
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    
    // Controls visibility
    this.videoWrapper.addEventListener('mouseenter', () => this.showControls());
    this.videoWrapper.addEventListener('mouseleave', () => this.scheduleHideControls());
    this.videoWrapper.addEventListener('mousemove', () => this.showControls());
    
    // Touch events for mobile
    let touchTimer;
    this.video.addEventListener('touchstart', () => {
      clearTimeout(touchTimer);
      this.showControls();
      touchTimer = setTimeout(() => this.hideControls(), 3000);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }
  
  togglePlayPause() {
    const media = this.getActiveMedia();
    if (media.paused) {
      media.play();
    } else {
      media.pause();
    }
  }
  
  handlePlayPause() {
    const media = this.getActiveMedia();
    const isPlaying = !media.paused;

    // Update UI
    this.videoWrapper.classList.toggle('playing', isPlaying);
    this.centerPlayBtn.classList.toggle('show', media.paused);
  }
  
  skip(seconds) {
    const media = this.getActiveMedia();
    media.currentTime = Math.max(0, Math.min(media.currentTime + seconds, media.duration));
  }

  prevTrack() {
    // Trigger the hidden prev button from main.js
    const prevBtn = document.getElementById('prev-button');
    if (prevBtn) prevBtn.click();
  }

  nextTrack() {
    // Trigger the hidden next button from main.js
    const nextBtn = document.getElementById('next-button');
    if (nextBtn) nextBtn.click();
  }
  
  updateProgress() {
    const media = this.getActiveMedia();
    if (!this.isSeeking && media.duration) {
      const progress = (media.currentTime / media.duration) * 100;

      // Smooth progress bar animation
      requestAnimationFrame(() => {
        this.progressBar.style.width = `${progress}%`;
        this.progressHandle.style.left = `${progress}%`;
      });

      this.seekInput.value = progress;
      this.currentTimeDisplay.textContent = this.formatTime(media.currentTime);
    }
  }
  
  updateBuffered() {
    if (this.video.buffered.length > 0) {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const bufferedProgress = (bufferedEnd / this.video.duration) * 100;
      this.bufferedBar.style.width = `${bufferedProgress}%`;
    }
  }
  
  updateDuration() {
    const media = this.getActiveMedia();
    this.durationDisplay.textContent = this.formatTime(media.duration);
    this.seekInput.max = 100;
  }
  
  handleSeek(e) {
    const media = this.getActiveMedia();
    const progress = e.target.value;
    const time = (progress / 100) * media.duration;

    // Add seeking class for visual feedback
    this.videoWrapper.classList.add('seeking');

    // Smooth animation for seek
    requestAnimationFrame(() => {
      this.progressBar.style.width = `${progress}%`;
      this.progressHandle.style.left = `${progress}%`;
    });

    this.currentTimeDisplay.textContent = this.formatTime(time);

    // Debounce actual seek for smoother scrubbing
    if (this.seekDebounce) clearTimeout(this.seekDebounce);
    this.seekDebounce = setTimeout(() => {
      media.currentTime = time;
      // Also sync video if we're controlling audio
      if (media === this.audioPlayer && this.video) {
        this.video.currentTime = time;
      }
      this.videoWrapper.classList.remove('seeking');
    }, 50);
  }
  
  updateTimeTooltip(e) {
    const media = this.getActiveMedia();
    const rect = this.seekInput.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = percent * media.duration;

    this.timeTooltip.textContent = this.formatTime(time);

    // Smooth tooltip position with bounds checking
    const tooltipX = percent * 100;
    requestAnimationFrame(() => {
      this.timeTooltip.style.left = `${tooltipX}%`;
    });
  }
  
  toggleMute() {
    const media = this.getActiveMedia();
    media.muted = !media.muted;
    this.updateVolume();
  }

  setVolume(value) {
    const media = this.getActiveMedia();
    media.volume = value / 100;
    localStorage.setItem('videoVolume', value);
  }

  updateVolume() {
    const media = this.getActiveMedia();
    const volume = media.volume * 100;
    const isMuted = media.muted || volume === 0;

    this.volumeBtn.classList.toggle('muted', isMuted);
    this.volumeSlider.value = isMuted ? 0 : volume;
  }
  
  cycleSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.playbackSpeeds.length;
    const speed = this.playbackSpeeds[this.currentSpeedIndex];

    // Set speed on both audio and video
    if (this.audioPlayer) this.audioPlayer.playbackRate = speed;
    if (this.video) this.video.playbackRate = speed;

    this.speedBtn.querySelector('.speed-text').textContent = `${speed}x`;
  }
  
  async togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }
  
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.videoWrapper.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
  
  handleFullscreenChange() {
    this.videoWrapper.classList.toggle('fullscreen', !!document.fullscreenElement);
  }
  
  showControls() {
    clearTimeout(this.hideControlsTimer);
    this.overlay.classList.add('show-controls');
    this.videoWrapper.style.cursor = 'default';

    // Hide after 3 seconds if playing
    const media = this.getActiveMedia();
    if (!media.paused) {
      this.scheduleHideControls();
    }
  }

  scheduleHideControls() {
    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      const media = this.getActiveMedia();
      if (!media.paused) {
        this.hideControls();
      }
    }, 3000);
  }
  
  hideControls() {
    this.overlay.classList.remove('show-controls');
    this.videoWrapper.style.cursor = 'none';
  }
  
  showLoading() {
    this.loadingSpinner.classList.add('show');
  }
  
  hideLoading() {
    this.loadingSpinner.classList.remove('show');
  }
  
  handleKeyboard(e) {
    if (!this.video || e.target.tagName === 'INPUT') return;
    const media = this.getActiveMedia();

    switch(e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.skip(-5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.skip(5);
        break;
      case 'j':
        e.preventDefault();
        this.skip(-10);
        break;
      case 'l':
        e.preventDefault();
        this.skip(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setVolume(Math.min(100, media.volume * 100 + 10));
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.setVolume(Math.max(0, media.volume * 100 - 10));
        break;
      case 'm':
        e.preventDefault();
        this.toggleMute();
        break;
      case 'f':
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case 'p':
        e.preventDefault();
        this.togglePiP();
        break;
      case 'c':
        e.preventDefault();
        // Toggle captions if available
        const tracks = this.video.textTracks;
        if (tracks.length > 0) {
          const track = tracks[0];
          track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
        }
        break;
      default:
        // Number keys for seeking
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          const percent = parseInt(e.key) * 10;
          media.currentTime = (percent / 100) * media.duration;
        }
    }
  }
  
  formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export for use in main.js
window.VideoControls = VideoControls;