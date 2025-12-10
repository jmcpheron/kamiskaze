// Touch Gesture Handler Module
class TouchGestures {
  constructor(videoWrapper, video, controls) {
    this.videoWrapper = videoWrapper;
    this.video = video;
    this.controls = controls;
    
    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;
    this.lastTap = 0;
    this.doubleTapTimer = null;
    this.volumeStartY = 0;
    this.volumeStart = 0;
    this.seekStartX = 0;
    this.seekStartTime = 0;
    
    // Gesture thresholds
    this.swipeThreshold = 50;
    this.doubleTapDelay = 300;
    this.tapRegions = {
      left: 0.3,   // 30% of width
      right: 0.7,  // 70% of width
      center: 0.2  // 20% tolerance for center
    };
    
    this.init();
  }
  
  init() {
    // Touch events
    this.videoWrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.videoWrapper.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.videoWrapper.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Prevent default mobile behaviors
    this.videoWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Setup pinch-to-zoom gesture
    this.setupPinchGesture();
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = false;

    // Store initial values for gestures
    // Use the active media element (audioPlayer if available, otherwise video)
    const activeMedia = this.controls.getActiveMedia();
    this.volumeStartY = touch.clientY;
    this.volumeStart = activeMedia.volume;
    this.seekStartX = touch.clientX;
    this.seekStartTime = activeMedia.currentTime;

    // Show controls on touch
    this.controls.showControls();
  }
  
  handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // Determine gesture type
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      // Horizontal swipe - seek
      this.isSwiping = true;
      this.handleSeekGesture(deltaX);
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      // Vertical swipe - volume
      this.isSwiping = true;
      this.handleVolumeGesture(deltaY);
    }
  }
  
  handleTouchEnd(e) {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    
    // If it was a quick tap and not a swipe
    if (!this.isSwiping && touchDuration < 200) {
      const rect = this.videoWrapper.getBoundingClientRect();
      const tapX = (this.touchStartX - rect.left) / rect.width;
      
      // Check for double tap
      if (touchEndTime - this.lastTap < this.doubleTapDelay) {
        this.handleDoubleTap(tapX);
        this.lastTap = 0;
      } else {
        this.lastTap = touchEndTime;
        // Single tap - play/pause
        if (this.doubleTapTimer) clearTimeout(this.doubleTapTimer);
        this.doubleTapTimer = setTimeout(() => {
          this.handleSingleTap(tapX);
          this.lastTap = 0;
        }, this.doubleTapDelay);
      }
    }
    
    // Clean up
    this.isSwiping = false;
    this.hideSeekPreview();
    this.hideVolumeIndicator();
  }
  
  handleSingleTap(tapX) {
    // Center tap - play/pause
    if (tapX > this.tapRegions.left && tapX < this.tapRegions.right) {
      this.controls.togglePlayPause();
    }
  }
  
  handleDoubleTap(tapX) {
    if (tapX < this.tapRegions.left) {
      // Left side - rewind 10s
      this.controls.skip(-10);
      this.showSkipAnimation(-10);
    } else if (tapX > this.tapRegions.right) {
      // Right side - forward 10s
      this.controls.skip(10);
      this.showSkipAnimation(10);
    } else {
      // Center - toggle fullscreen
      this.controls.toggleFullscreen();
    }
  }
  
  handleSeekGesture(deltaX) {
    // Calculate seek amount based on swipe distance
    const activeMedia = this.controls.getActiveMedia();
    const seekSensitivity = 0.5; // seconds per pixel
    const seekAmount = deltaX * seekSensitivity;
    const newTime = Math.max(0, Math.min(this.seekStartTime + seekAmount, activeMedia.duration));

    // Update preview
    this.showSeekPreview(newTime, seekAmount);

    // Apply seek to active media
    activeMedia.currentTime = newTime;
  }
  
  handleVolumeGesture(deltaY) {
    // Invert deltaY so swipe up increases volume
    const volumeSensitivity = 0.005; // volume per pixel
    const volumeChange = -deltaY * volumeSensitivity;
    const newVolume = Math.max(0, Math.min(1, this.volumeStart + volumeChange));

    // Update volume on the active media element (audioPlayer or video)
    const activeMedia = this.controls.getActiveMedia();
    activeMedia.volume = newVolume;
    this.showVolumeIndicator(newVolume);
  }
  
  showSeekPreview(time, delta) {
    let preview = document.getElementById('touch-seek-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'touch-seek-preview';
      preview.className = 'touch-seek-preview';
      this.videoWrapper.appendChild(preview);
    }
    
    const sign = delta > 0 ? '+' : '';
    preview.textContent = `${sign}${Math.round(delta)}s → ${this.controls.formatTime(time)}`;
    preview.classList.add('show');
  }
  
  hideSeekPreview() {
    const preview = document.getElementById('touch-seek-preview');
    if (preview) {
      preview.classList.remove('show');
    }
  }
  
  showVolumeIndicator(volume) {
    let indicator = document.getElementById('touch-volume-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'touch-volume-indicator';
      indicator.className = 'touch-volume-indicator';
      indicator.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <div class="volume-bar">
          <div class="volume-fill"></div>
        </div>
        <span class="volume-text">100%</span>
      `;
      this.videoWrapper.appendChild(indicator);
    }
    
    const fill = indicator.querySelector('.volume-fill');
    const text = indicator.querySelector('.volume-text');
    
    fill.style.width = `${volume * 100}%`;
    text.textContent = `${Math.round(volume * 100)}%`;
    indicator.classList.add('show');
  }
  
  hideVolumeIndicator() {
    const indicator = document.getElementById('touch-volume-indicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
  }
  
  showSkipAnimation(seconds) {
    let animation = document.getElementById('touch-skip-animation');
    if (!animation) {
      animation = document.createElement('div');
      animation.id = 'touch-skip-animation';
      animation.className = 'touch-skip-animation';
      this.videoWrapper.appendChild(animation);
    }
    
    animation.innerHTML = `
      <div class="skip-circle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          ${seconds > 0 ? 
            '<path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>' : 
            '<path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>'}
        </svg>
        <span class="skip-text">${Math.abs(seconds)}s</span>
      </div>
    `;
    
    animation.classList.add('show');
    animation.classList.add(seconds > 0 ? 'forward' : 'backward');
    
    setTimeout(() => {
      animation.classList.remove('show', 'forward', 'backward');
    }, 800);
  }
  
  // Pinch-to-zoom for fullscreen
  setupPinchGesture() {
    let initialDistance = 0;
    let isPinching = false;
    
    this.videoWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    });
    
    this.videoWrapper.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        
        if (scale > 1.5 && !document.fullscreenElement) {
          this.controls.toggleFullscreen();
          isPinching = false;
        } else if (scale < 0.7 && document.fullscreenElement) {
          this.controls.toggleFullscreen();
          isPinching = false;
        }
      }
    });
    
    this.videoWrapper.addEventListener('touchend', () => {
      isPinching = false;
    });
  }
  
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Export for use in video-controls.js
window.TouchGestures = TouchGestures;