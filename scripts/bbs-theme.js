/**
 * BBS Theme for Kamiskaze Player
 * Adds a retro BBS/ASCII art theme option to the player
 */

// ASCII Art for the player banner
const ASCII_BANNER = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██╗  ██╗ █████╗ ███╗   ███╗██╗███████╗██╗  ██╗ █████╗ ███████╗███████╗  ║
║   ██║ ██╔╝██╔══██╗████╗ ████║██║██╔════╝██║ ██╔╝██╔══██╗╚══███╔╝██╔════╝  ║
║   █████╔╝ ███████║██╔████╔██║██║███████╗█████╔╝ ███████║  ███╔╝ █████╗    ║
║   ██╔═██╗ ██╔══██║██║╚██╔╝██║██║╚════██║██╔═██╗ ██╔══██║ ███╔╝  ██╔══╝    ║
║   ██║  ██╗██║  ██║██║ ╚═╝ ██║██║███████║██║  ██╗██║  ██║███████╗███████╗  ║
║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝  ║
║                                                                           ║
║                       BBS STYLE MUSIC PLAYER v1.0                        ║
║                                                                           ║
║                  [SysOp: Jason] [Node: 1] [Baud: 56k]                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
`;

// ASCII Art for the cassette
const ASCII_CASSETTE = `
    ╔═══════════════════════════════╗
    ║ ┌───┐                 ┌───┐   ║
    ║ │ O │                 │ O │   ║
    ║ └───┘                 └───┘   ║
    ║                               ║
    ║      ╔═══════════════╗       ║
    ║      ║               ║       ║
    ║      ║  KAMISKAZE    ║       ║
    ║      ║  MIXTAPE      ║       ║
    ║      ║               ║       ║
    ║      ╚═══════════════╝       ║
    ║                               ║
    ╚═══════════════════════════════╝
`;

// ASCII Art for album art fallback
const ASCII_ALBUM_ART = `
    ╔═════════════════════════════════════════════════╗
    ║                                                 ║
    ║     ██╗  ██╗ █████╗ ███╗   ███╗██╗███████╗     ║
    ║     ██║ ██╔╝██╔══██╗████╗ ████║██║██╔════╝     ║
    ║     █████╔╝ ███████║██╔████╔██║██║███████╗     ║
    ║     ██╔═██╗ ██╔══██║██║╚██╔╝██║██║╚════██║     ║
    ║     ██║  ██╗██║  ██║██║ ╚═╝ ██║██║███████║     ║
    ║     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝     ║
    ║                                                 ║
    ║                  KAMISKAZE                     ║
    ║                                                 ║
    ║                  SoCal Ska                     ║
    ║                                                 ║
    ╚═════════════════════════════════════════════════╝
`;

// Function to initialize the BBS theme
function initBBSTheme() {
    console.log('Initializing BBS theme...');
    
    // Add BBS theme CSS link if not already added
    if (!document.querySelector('link[href="styles/bbs.css"]')) {
        const bbsStylesheet = document.createElement('link');
        bbsStylesheet.rel = 'stylesheet';
        bbsStylesheet.href = 'styles/bbs.css';
        document.head.appendChild(bbsStylesheet);
    }
    
    // Apply BBS theme to player container
    const playerContainer = document.getElementById('player-container');
    if (playerContainer) {
        playerContainer.classList.add('bbs-theme');
        
        // Convert to BBS layout immediately
        convertToBBSLayout();
    }
}

// No theme switcher needed - BBS is the only theme

// Convert the player to BBS layout
function convertToBBSLayout() {
    console.log('Converting to BBS layout');
    
    const playerContainer = document.getElementById('player-container');
    
    // Save the original HTML for restoration later
    if (!playerContainer._originalHTML) {
        playerContainer._originalHTML = playerContainer.innerHTML;
    }
    
    // Create BBS layout
    const bbsLayout = `
        <div class="bbs-header">
            <div class="bbs-ascii-banner">${ASCII_BANNER}</div>
        </div>
        
        <div class="bbs-controls">
            <button id="bbs-prev" class="bbs-control-button bbs-prev-icon" aria-label="Previous Track"></button>
            <button id="bbs-play" class="bbs-control-button bbs-play-button bbs-play-icon" aria-label="Play"></button>
            <button id="bbs-stop" class="bbs-control-button bbs-stop-icon" aria-label="Stop"></button>
            <button id="bbs-next" class="bbs-control-button bbs-next-icon" aria-label="Next Track"></button>
            <button id="bbs-shuffle" class="bbs-control-button bbs-shuffle-icon" aria-label="Shuffle"></button>
            <button id="bbs-repeat" class="bbs-control-button bbs-repeat-icon" aria-label="Repeat"></button>
        </div>
        
        <div class="bbs-progress">
            <div id="bbs-progress-bar" class="bbs-progress-bar"></div>
            <div id="bbs-progress-text" class="bbs-progress-text">00:00 / 00:00</div>
        </div>
        
        <div class="bbs-album-art">
            <div id="bbs-album-art-container">
                <div class="bbs-album-art-ascii">${ASCII_ALBUM_ART}</div>
            </div>
        </div>
        
        <div class="bbs-visualizer" id="bbs-visualizer">
            ${Array(20).fill('<div class="bbs-visualizer-bar"></div>').join('')}
        </div>
        
        <div class="bbs-playlist">
            <div class="bbs-playlist-tabs">
                <div id="bbs-playlist-selector-tab" class="bbs-playlist-tab">Playlists</div>
                <div id="bbs-current-playlist-tab" class="bbs-playlist-tab active">Current</div>
            </div>
            
            <div id="bbs-playlist-selector-panel" class="bbs-playlist-panel" style="display: none;">
                <div id="bbs-playlist-buttons"></div>
            </div>
            
            <div id="bbs-current-playlist-panel" class="bbs-playlist-panel">
                <div id="bbs-playlist-tracks"></div>
            </div>
        </div>
        
        <div class="bbs-footer">
            <div class="bbs-cassette-ascii">${ASCII_CASSETTE}</div>
            <div>Press [ESC] to exit | [H] for help</div>
            <div>Connected to Kamiskaze BBS <span class="bbs-cursor"></span></div>
        </div>
    `;
    
    // Apply BBS layout
    playerContainer.innerHTML = bbsLayout;
    
    // Connect BBS controls to original player functions
    connectBBSControls();
    
    // Start visualizer animation
    startBBSVisualizer();
    
    // Render the current playlist in BBS style
    renderBBSPlaylist();
}

// No need for Winamp layout restoration since BBS is the only theme

// Connect BBS controls to the original player functions
function connectBBSControls() {
    // Get BBS controls
    const bbsPlay = document.getElementById('bbs-play');
    const bbsStop = document.getElementById('bbs-stop');
    const bbsPrev = document.getElementById('bbs-prev');
    const bbsNext = document.getElementById('bbs-next');
    const bbsShuffle = document.getElementById('bbs-shuffle');
    const bbsRepeat = document.getElementById('bbs-repeat');
    const bbsProgress = document.querySelector('.bbs-progress');
    const bbsPlaylistSelectorTab = document.getElementById('bbs-playlist-selector-tab');
    const bbsCurrentPlaylistTab = document.getElementById('bbs-current-playlist-tab');
    
    // Connect to original player functions if they exist
    if (bbsPlay && typeof togglePlayPause === 'function') {
        bbsPlay.addEventListener('click', () => {
            togglePlayPause();
            updateBBSPlayButton();
        });
    }
    
    if (bbsStop && typeof stopAudio === 'function') {
        bbsStop.addEventListener('click', () => {
            stopAudio();
            updateBBSPlayButton();
        });
    }
    
    if (bbsPrev && typeof playPreviousTrack === 'function') {
        bbsPrev.addEventListener('click', playPreviousTrack);
    }
    
    if (bbsNext && typeof playNextTrack === 'function') {
        bbsNext.addEventListener('click', playNextTrack);
    }
    
    if (bbsShuffle && typeof toggleShuffle === 'function') {
        bbsShuffle.addEventListener('click', () => {
            toggleShuffle();
            updateBBSShuffleButton();
        });
    }
    
    if (bbsRepeat && typeof toggleRepeat === 'function') {
        bbsRepeat.addEventListener('click', () => {
            toggleRepeat();
            updateBBSRepeatButton();
        });
    }
    
    if (bbsProgress) {
        bbsProgress.addEventListener('click', (e) => {
            const rect = bbsProgress.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            
            if (typeof seekAudio === 'function' && window.audioPlayer) {
                seekAudio(clickPosition * window.audioPlayer.duration);
            }
        });
    }
    
    // Connect playlist tab switching
    if (bbsPlaylistSelectorTab) {
        bbsPlaylistSelectorTab.addEventListener('click', () => {
            bbsPlaylistSelectorTab.classList.add('active');
            if (bbsCurrentPlaylistTab) bbsCurrentPlaylistTab.classList.remove('active');
            
            const selectorPanel = document.getElementById('bbs-playlist-selector-panel');
            const currentPanel = document.getElementById('bbs-current-playlist-panel');
            
            if (selectorPanel) selectorPanel.style.display = 'block';
            if (currentPanel) currentPanel.style.display = 'none';
            
            renderBBSPlaylistButtons();
        });
    }
    
    if (bbsCurrentPlaylistTab) {
        bbsCurrentPlaylistTab.addEventListener('click', () => {
            bbsCurrentPlaylistTab.classList.add('active');
            if (bbsPlaylistSelectorTab) bbsPlaylistSelectorTab.classList.remove('active');
            
            const selectorPanel = document.getElementById('bbs-playlist-selector-panel');
            const currentPanel = document.getElementById('bbs-current-playlist-panel');
            
            if (currentPanel) currentPanel.style.display = 'block';
            if (selectorPanel) selectorPanel.style.display = 'none';
            
            renderBBSPlaylist();
        });
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Do nothing for now, could show a BBS-style menu
        } else if (e.key === 'h' || e.key === 'H') {
            showBBSHelp();
        }
    });
    
    // Set initial button states
    updateBBSPlayButton();
    updateBBSShuffleButton();
    updateBBSRepeatButton();
}

// Update BBS play/pause button state
function updateBBSPlayButton() {
    const bbsPlay = document.getElementById('bbs-play');
    if (!bbsPlay) return;
    
    if (window.isPlaying) {
        bbsPlay.classList.remove('bbs-play-icon');
        bbsPlay.classList.add('bbs-pause-icon');
        bbsPlay.setAttribute('aria-label', 'Pause');
    } else {
        bbsPlay.classList.remove('bbs-pause-icon');
        bbsPlay.classList.add('bbs-play-icon');
        bbsPlay.setAttribute('aria-label', 'Play');
    }
}

// Update BBS shuffle button state
function updateBBSShuffleButton() {
    const bbsShuffle = document.getElementById('bbs-shuffle');
    if (!bbsShuffle) return;
    
    if (window.shuffleMode) {
        bbsShuffle.style.color = '#ffff33'; // Yellow when active
    } else {
        bbsShuffle.style.color = '#33ff33'; // Green when inactive
    }
}

// Update BBS repeat button state
function updateBBSRepeatButton() {
    const bbsRepeat = document.getElementById('bbs-repeat');
    if (!bbsRepeat) return;
    
    if (window.repeatMode === 'none') {
        bbsRepeat.style.color = '#33ff33'; // Green when inactive
    } else if (window.repeatMode === 'all') {
        bbsRepeat.style.color = '#ffff33'; // Yellow when repeat all
    } else if (window.repeatMode === 'one') {
        bbsRepeat.style.color = '#ff3333'; // Red when repeat one
    }
}

// Render the current playlist in BBS style
function renderBBSPlaylist() {
    const bbsPlaylistTracks = document.getElementById('bbs-playlist-tracks');
    if (!bbsPlaylistTracks || !window.currentPlaylist || !window.tracks) return;
    
    bbsPlaylistTracks.innerHTML = '';
    
    const playlist = window.currentPlaylist;
    const tracks = window.tracks;
    
    if (playlist && tracks) {
        const playlistTracks = tracks.filter(track => track.playlist === playlist);
        
        playlistTracks.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'bbs-track';
            if (window.currentTrack && window.currentTrack.id === track.id) {
                trackElement.classList.add('active');
            }
            
            const trackNumber = document.createElement('div');
            trackNumber.className = 'bbs-track-number';
            trackNumber.textContent = `${index + 1}.`;
            
            const trackInfo = document.createElement('div');
            trackInfo.className = 'bbs-track-info';
            
            const trackTitle = document.createElement('div');
            trackTitle.className = 'bbs-track-title';
            trackTitle.textContent = track.title || 'Unknown Title';
            
            const trackArtist = document.createElement('div');
            trackArtist.className = 'bbs-track-artist';
            trackArtist.textContent = track.artist || 'Unknown Artist';
            
            trackInfo.appendChild(trackTitle);
            trackInfo.appendChild(trackArtist);
            
            trackElement.appendChild(trackNumber);
            trackElement.appendChild(trackInfo);
            
            trackElement.addEventListener('click', () => {
                if (typeof loadTrack === 'function') {
                    loadTrack(track.id);
                }
            });
            
            bbsPlaylistTracks.appendChild(trackElement);
        });
    }
}

// Render the playlist buttons in BBS style
function renderBBSPlaylistButtons() {
    const bbsPlaylistButtons = document.getElementById('bbs-playlist-buttons');
    if (!bbsPlaylistButtons || !window.playlists) return;
    
    bbsPlaylistButtons.innerHTML = '';
    
    window.playlists.forEach(playlist => {
        const button = document.createElement('div');
        button.className = 'bbs-control-button';
        button.textContent = playlist;
        
        if (window.currentPlaylist === playlist) {
            button.style.color = '#ffff33'; // Yellow for active playlist
        }
        
        button.addEventListener('click', () => {
            if (typeof switchPlaylist === 'function') {
                switchPlaylist(playlist);
                
                // Switch to current playlist tab after selection
                const bbsCurrentPlaylistTab = document.getElementById('bbs-current-playlist-tab');
                if (bbsCurrentPlaylistTab) {
                    bbsCurrentPlaylistTab.click();
                }
            }
        });
        
        bbsPlaylistButtons.appendChild(button);
    });
}

// Start the BBS visualizer animation
function startBBSVisualizer() {
    const visualizerBars = document.querySelectorAll('.bbs-visualizer-bar');
    if (!visualizerBars.length) return;
    
    // Animate the visualizer bars
    function animateVisualizer() {
        visualizerBars.forEach(bar => {
            const height = Math.floor(Math.random() * 40) + 5;
            bar.style.height = `${height}px`;
        });
        
        // Only animate if audio is playing
        if (window.isPlaying) {
            requestAnimationFrame(animateVisualizer);
        } else {
            // Reset bars when not playing
            visualizerBars.forEach(bar => {
                bar.style.height = '5px';
            });
            
            // Check again in a second
            setTimeout(() => {
                if (window.isPlaying) {
                    requestAnimationFrame(animateVisualizer);
                }
            }, 1000);
        }
    }
    
    // Start animation
    animateVisualizer();
}

// Update BBS progress bar
function updateBBSProgress() {
    const progressBar = document.getElementById('bbs-progress-bar');
    const progressText = document.getElementById('bbs-progress-text');
    
    if (!progressBar || !progressText || !window.audioPlayer) return;
    
    const currentTime = window.audioPlayer.currentTime || 0;
    const duration = window.audioPlayer.duration || 0;
    
    if (duration > 0) {
        const percentage = (currentTime / duration) * 100;
        progressBar.style.width = `${percentage}%`;
        
        // Format time display
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = Math.floor(currentTime % 60);
        const totalMinutes = Math.floor(duration / 60);
        const totalSeconds = Math.floor(duration % 60);
        
        const formattedCurrent = `${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
        const formattedTotal = `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
        
        progressText.textContent = `${formattedCurrent} / ${formattedTotal}`;
    }
}

// Show BBS-style help dialog
function showBBSHelp() {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'bbs-notification';
    helpDialog.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">HELP MENU</div>
        <div>[ESC] - Close this help</div>
        <div>[SPACE] - Play/Pause</div>
        <div>[←] - Previous Track</div>
        <div>[→] - Next Track</div>
        <div>[S] - Toggle Shuffle</div>
        <div>[R] - Toggle Repeat</div>

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

// No need for theme preference loading since BBS is the only theme

// Setup audio player timeupdate listener for BBS theme
function setupBBSAudioListeners() {
    if (window.audioPlayer) {
        window.audioPlayer.addEventListener('timeupdate', updateBBSProgress);
        window.audioPlayer.addEventListener('play', () => {
            updateBBSPlayButton();
            startBBSVisualizer();
        });
        window.audioPlayer.addEventListener('pause', updateBBSPlayButton);
        window.audioPlayer.addEventListener('ended', updateBBSPlayButton);
    }
}

// Initialize BBS theme when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize BBS theme
    initBBSTheme();
    
    // Setup audio listeners
    setTimeout(setupBBSAudioListeners, 1000);
});

// Export functions for use in main.js
window.bbsTheme = {
    updateBBSProgress,
    renderBBSPlaylist,
    updateBBSPlayButton
};
