# Testing Guide for Kamiskaze Audio Player

This guide provides comprehensive testing procedures for the Kamiskaze audio/video player, optimized for both manual testing and AI-assisted development workflows like Claude Code.

## Quick Test Setup

### Local Development Server
```bash
# Navigate to project directory
cd /path/to/kamiskaze

# Start local server (required for CORS and proper media loading)
python3 -m http.server 8001

# Test URL
# Open: http://localhost:8001
```

### Stop Server
```bash
# Kill server when done
pkill -f "python3 -m http.server"
```

## Core Functionality Tests

### 1. Audio Playback Tests
- [ ] **Load homepage** → Verify default feed loads (Palm Springs w/ The Jawas)
- [ ] **Click play button** → Verify audio starts and play button changes to pause icon
- [ ] **Click pause button** → Verify audio pauses and button changes to play icon
- [ ] **Test seek bar** → Drag to different positions, verify audio jumps to correct time
- [ ] **Test previous/next buttons** → Verify track navigation works
- [ ] **Test keyboard controls** → Space for play/pause, left/right arrows for seek
- [ ] **Test speed controls** → Verify playback rate changes (if visible)
- [ ] **Test track clicking** → Click tracks in list to switch between them
- [ ] **Volume persistence** → Refresh page, verify playback position/track is restored

### 2. Video Playback Tests
- [ ] **Switch to Palm Springs feed** → Verify video tracks display with video player
- [ ] **Test video play/pause** → Video should sync with audio playback
- [ ] **Test video seeking** → Video should stay in sync when seeking audio
- [ ] **Test fullscreen button** → Verify video fullscreen functionality
- [ ] **Test video controls overlay** → Verify overlay controls appear and function
- [ ] **Test video time display** → Verify time counter shows current/total time
- [ ] **Test video error handling** → Try invalid video URL, verify graceful fallback

### 3. External Feed Tests
- [ ] **Click "Add Feed" button** → Verify modal opens with form
- [ ] **Test modal close** → Verify modal closes with X button and cancel
- [ ] **Add local test feed**: `http://localhost:8001/github-cdn-test.json`
- [ ] **Verify external tracks load** → Confirm new feed appears in playlist selector
- [ ] **Test external track playback** → Verify external media files play correctly
- [ ] **Test CORS error handling** → Try invalid URLs, verify error notifications
- [ ] **Test GitHub Pages feed** → Add a GitHub-hosted feed URL
- [ ] **Delete custom feed** → Verify feeds can be removed from custom list

### 4. Mobile/Responsive Tests
- [ ] **Resize browser window** → Verify responsive layout adapts properly
- [ ] **Test touch controls** → On mobile/tablet, verify tap controls work
- [ ] **Test mobile navigation** → Verify playlist switching works on mobile
- [ ] **Test mobile fullscreen** → Verify mobile fullscreen API works
- [ ] **Test landscape/portrait** → Verify layout works in both orientations

### 5. Playlist and Feed Management
- [ ] **Switch between playlists** → Test 8track, Cubase, Palm Springs feeds
- [ ] **Verify track counts** → Confirm track count displays correctly for each feed
- [ ] **Test playlist descriptions** → Verify feed descriptions show properly
- [ ] **Test track info updates** → Verify track title/description changes when switching

### 6. Error Scenario Tests
- [ ] **Test missing media files** → Verify error notifications appear
- [ ] **Test network interruption** → Disable network mid-playback, verify handling
- [ ] **Test malformed feed JSON** → Add invalid JSON URL, verify error handling
- [ ] **Test unsupported media formats** → Verify browser compatibility fallbacks
- [ ] **Test CORS blocked resources** → Verify appropriate error messages
- [ ] **Console error monitoring** → Verify no JavaScript errors in browser console

## AI-Assisted Development Testing Workflows

### Claude Code Integration Commands

```bash
# Pre-testing setup commands for Claude Code
cd /path/to/kamiskaze
python3 -m http.server 8001 &
echo "Test server started at http://localhost:8001"

# Check for console errors (paste in browser dev tools)
console.log("=== Kamiskaze Testing Session ===");
console.log("Monitor this console for errors during testing");

# Verify all feeds load correctly
curl -s http://localhost:8001/feed.json | jq '.feeds[].title'
curl -s http://localhost:8001/github-cdn-test.json | jq '.title'
```

### Automated Validation Checks

#### 1. JSON Feed Validation
```bash
# Validate main feed structure
jq empty feed.json && echo "✓ feed.json is valid" || echo "✗ feed.json is invalid"

# Validate test feeds
for file in *-feed.json; do
  jq empty "$file" && echo "✓ $file is valid" || echo "✗ $file is invalid"
done
```

#### 2. Media File Verification
```bash
# Check if media files exist
find audio/ videos/ -name "*.mp3" -o -name "*.mp4" | head -5
echo "Found $(find audio/ videos/ -name "*.mp3" -o -name "*.mp4" | wc -l) media files"
```

#### 3. HTML/CSS Validation
```bash
# Basic HTML validation (requires w3c validator)
# curl -s -F "uploaded_file=@index.html" -F "output=json" https://validator.w3.org/nu/ | jq .
```

### Memory Leak Detection
```javascript
// Run in browser console to monitor memory usage
let memoryMonitor = setInterval(() => {
  if (performance.memory) {
    const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
    console.log(`Memory: ${used}MB / ${total}MB`);
  }
}, 5000);

// To stop monitoring:
// clearInterval(memoryMonitor);
```

### Performance Testing
```javascript
// Run in browser console to test load performance
const startTime = performance.now();
fetch('feed.json')
  .then(response => response.json())
  .then(data => {
    const endTime = performance.now();
    console.log(`Feed loaded in ${endTime - startTime}ms`);
    console.log(`Found ${data.feeds.length} feeds with ${data.feeds.reduce((total, feed) => total + feed.tracks.length, 0)} total tracks`);
  });
```

## Cross-Browser Testing Matrix

### Primary Support
- **Chrome/Chromium**: Primary development target
- **Firefox**: Secondary target for web standards compliance
- **Safari**: Mobile and macOS compatibility
- **Edge**: Windows compatibility

### Test Checklist per Browser
- [ ] Basic playback functionality
- [ ] Video playback and fullscreen
- [ ] External feed loading
- [ ] Local storage persistence
- [ ] Keyboard shortcuts
- [ ] Mobile responsiveness (Safari iOS, Chrome Android)

## Advanced Testing Scenarios

### 1. State Persistence Testing
```javascript
// Test localStorage persistence
// 1. Play a track, seek to middle
// 2. Refresh page
// 3. Verify track and position restored
localStorage.getItem('playerState'); // Should show saved state
```

### 2. External CDN Testing
```javascript
// Test external feed processing
// Add feed: https://raw.githubusercontent.com/user/repo/main/feed.json
// Verify URL resolution and CORS handling
```

### 3. Error Recovery Testing
```javascript
// Simulate network failure
navigator.onLine = false; // Simulate offline
// Try to load external feed
// Verify error handling
navigator.onLine = true; // Restore
```

## Debugging and Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**: Ensure using local server, not file:// protocol
2. **Media Won't Play**: Check browser auto-play policies
3. **Video Sync Issues**: Monitor console for video error messages
4. **External Feeds Fail**: Verify CORS headers on external source
5. **Performance Issues**: Use memory monitor, check for event listener leaks

### Browser Developer Tools Setup
```javascript
// Enable verbose logging
localStorage.setItem('debugMode', 'true');
// Add to console for enhanced debugging
window.debugPlayer = true;
```

## Testing Data and Feeds

### Local Test Feeds Available
- `feed.json` - Main feed with all playlists
- `github-cdn-test.json` - External CDN test feed
- `palm-springs-feed.json` - Video-specific test feed
- `sample-cdn-feed.json` - Sample external feed format

### Test Media Files
- **Audio**: MP3 files in `audio/8track/` and `audio/cubase/`
- **Video**: MP4 files in `videos/palm-springs-w_the-jawas/`
- **Images**: Album art in `images/` and `sample_audio/`

## Testing Best Practices for Claude Code

1. **Always start with local server**: `python3 -m http.server 8001`
2. **Monitor browser console**: Open dev tools before testing
3. **Test incrementally**: Verify basic functionality before advanced features
4. **Use JSON validation**: Ensure feed files are valid before testing
5. **Document issues**: Note browser/OS when reporting problems
6. **Test external sources**: Use GitHub Pages or CORS-enabled CDNs
7. **Verify cleanup**: Ensure test data doesn't persist between sessions

## Test Completion Checklist

- [ ] All core playback functions work
- [ ] Video playback synchronizes properly
- [ ] External feeds load and play
- [ ] Mobile/responsive layout functions
- [ ] Error scenarios handled gracefully
- [ ] No console errors during normal usage
- [ ] Performance is acceptable (loads within 3 seconds)
- [ ] State persistence works across page reloads
- [ ] Cross-browser compatibility verified
- [ ] Memory usage remains stable during extended use

---

**Note**: This testing guide is designed to work seamlessly with Claude Code and other AI development assistants. All commands and procedures are optimized for quick verification and issue identification.