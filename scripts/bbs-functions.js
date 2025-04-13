/**
 * BBS Theme Functions for Kamiskaze Player
 * Adds functionality specific to the BBS/ASCII art theme
 */

// Update the BBS time display
function updateBBSTime() {
    const timeDisplay = document.getElementById('bbs-time');
    if (!timeDisplay) return;
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// Animate the BBS visualizer
function animateBBSVisualizer() {
    if (!window.isPlaying) return;
    
    const visualizerBars = document.querySelectorAll('.bbs-visualizer-bar');
    if (!visualizerBars.length) return;
    
    visualizerBars.forEach(bar => {
        const height = Math.floor(Math.random() * 40) + 5;
        bar.style.height = `${height}px`;
    });
    
    requestAnimationFrame(animateBBSVisualizer);
}

// Update the BBS progress bar
function updateBBSProgress() {
    const progressBar = document.getElementById('bbs-progress-bar');
    if (!progressBar || !window.audioPlayer) return;
    
    const currentTime = window.audioPlayer.currentTime || 0;
    const duration = window.audioPlayer.duration || 0;
    
    if (duration > 0) {
        const percentage = (currentTime / duration) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

// Show BBS-style help dialog
function showBBSHelp() {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'bbs-help-dialog';
    helpDialog.innerHTML = `
        <div class="bbs-help-header">╔═══════════════ HELP MENU ═══════════════╗</div>
        <div class="bbs-help-content">
            <div>[ESC] - Close this help</div>
            <div>[SPACE] - Play/Pause</div>
            <div>[←] - Previous Track</div>
            <div>[→] - Next Track</div>
            <div>[S] - Toggle Shuffle</div>
            <div>[R] - Toggle Repeat</div>
            <div>[F] - Toggle Fullscreen (for videos)</div>
        </div>
        <div class="bbs-help-footer">╚═════════════════════════════════════════╝</div>
    `;
    
    document.body.appendChild(helpDialog);
    
    // Close on ESC key or after timeout
    const closeHelp = () => {
        if (document.body.contains(helpDialog)) {
            document.body.removeChild(helpDialog);
        }
        document.removeEventListener('keydown', escHandler);
    };
    
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeHelp();
        }
    };
    
    document.addEventListener('keydown', escHandler);
    setTimeout(closeHelp, 10000); // Close after 10 seconds
}

// Update the BBS play/pause button
function updateBBSPlayButton() {
    const playPauseButton = document.getElementById('play-pause-button');
    if (!playPauseButton) return;
    
    if (window.isPlaying) {
        playPauseButton.textContent = '⏸'; // Pause symbol
        playPauseButton.setAttribute('aria-label', 'Pause');
    } else {
        playPauseButton.textContent = '▶'; // Play symbol
        playPauseButton.setAttribute('aria-label', 'Play');
    }
}

// Update the BBS shuffle button
function updateBBSShuffleButton() {
    const shuffleButton = document.getElementById('shuffle-button');
    if (!shuffleButton) return;
    
    if (window.shuffleMode) {
        shuffleButton.classList.add('active');
    } else {
        shuffleButton.classList.remove('active');
    }
}

// Update the BBS repeat button
function updateBBSRepeatButton() {
    const repeatButton = document.getElementById('repeat-button');
    if (!repeatButton) return;
    
    if (window.repeatMode === 'none') {
        repeatButton.classList.remove('active', 'repeat-one');
    } else if (window.repeatMode === 'all') {
        repeatButton.classList.add('active');
        repeatButton.classList.remove('repeat-one');
    } else if (window.repeatMode === 'one') {
        repeatButton.classList.add('active', 'repeat-one');
    }
}

// Setup keyboard shortcuts for BBS theme
function setupBBSKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only process if not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'h' || e.key === 'H') {
            showBBSHelp();
        } else if (e.key === ' ') { // Space bar
            e.preventDefault(); // Prevent page scrolling
            if (typeof togglePlayPause === 'function') togglePlayPause();
        } else if (e.key === 'ArrowLeft') {
            if (typeof playPreviousTrack === 'function') playPreviousTrack();
        } else if (e.key === 'ArrowRight') {
            if (typeof playNextTrack === 'function') playNextTrack();
        } else if (e.key === 's' || e.key === 'S') {
            if (typeof toggleShuffle === 'function') toggleShuffle();
        } else if (e.key === 'r' || e.key === 'R') {
            if (typeof toggleRepeat === 'function') toggleRepeat();
        } else if (e.key === 'f' || e.key === 'F') {
            const videoFullscreenButton = document.getElementById('video-fullscreen');
            if (videoFullscreenButton) videoFullscreenButton.click();
        }
    });
}

// Initialize BBS theme functionality
function initBBSFunctions() {
    console.log('Initializing BBS functions...');
    
    // Start the BBS time display updater
    updateBBSTime();
    setInterval(updateBBSTime, 1000);
    
    // Setup keyboard shortcuts
    setupBBSKeyboardShortcuts();
    
    // Setup audio player event listeners
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', updateBBSProgress);
        audioPlayer.addEventListener('play', () => {
            updateBBSPlayButton();
            animateBBSVisualizer();
        });
        audioPlayer.addEventListener('pause', updateBBSPlayButton);
        audioPlayer.addEventListener('ended', updateBBSPlayButton);
    }
    
    // Setup BBS-style track list rendering
    if (typeof renderPlaylist === 'function') {
        const originalRenderPlaylist = renderPlaylist;
        window.renderPlaylist = function() {
            originalRenderPlaylist();
            styleBBSTrackList();
        };
    }
}

// Style the track list with BBS aesthetics
function styleBBSTrackList() {
    const trackList = document.getElementById('track-list');
    if (!trackList) return;
    
    // Add BBS-style numbering and formatting to track items
    const trackItems = trackList.querySelectorAll('li');
    trackItems.forEach((item, index) => {
        item.classList.add('bbs-track-item');
        
        // Check if we've already added the BBS formatting
        if (!item.querySelector('.bbs-track-number')) {
            // Create track number element
            const trackNumber = document.createElement('span');
            trackNumber.className = 'bbs-track-number';
            trackNumber.textContent = `${(index + 1).toString().padStart(2, '0')}.`;
            
            // Insert at the beginning of the track item
            item.insertBefore(trackNumber, item.firstChild);
        }
    });
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initBBSFunctions);
