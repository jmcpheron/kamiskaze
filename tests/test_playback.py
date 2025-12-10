"""Tests for audio and video playback functionality."""

import pytest
from playwright.sync_api import expect


class TestAudioPlayback:
    """Test suite for audio playback functionality."""

    def test_audio_track_plays_on_click(self, app_page):
        """Clicking an audio track starts playback."""
        # Wait for track list to load
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        first_track = app_page.locator("#track-list li").first
        first_track.click()

        # Wait for audio to be ready
        app_page.wait_for_function(
            """() => {
                const audio = document.getElementById('audio-player');
                return audio && audio.readyState >= 2;
            }""",
            timeout=10000,
        )

        # Check audio is playing or ready
        is_ready = app_page.evaluate(
            "document.getElementById('audio-player').readyState >= 2"
        )
        assert is_ready, "Audio did not become ready"

    def test_play_pause_button_works(self, app_page):
        """Play/pause button toggles playback state."""
        # Load a track first
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()

        # Wait for audio ready
        app_page.wait_for_function(
            "document.getElementById('audio-player').readyState >= 2",
            timeout=10000,
        )

        # Get initial paused state
        initial_paused = app_page.evaluate(
            "document.getElementById('audio-player').paused"
        )

        # Hover to show controls, then click play button (video controls)
        app_page.locator(".video-container").hover()
        play_btn = app_page.locator("#video-play-pause")
        play_btn.click()
        app_page.wait_for_timeout(200)

        # Check state changed
        new_paused = app_page.evaluate(
            "document.getElementById('audio-player').paused"
        )
        assert initial_paused != new_paused, "Play/pause state did not change"


class TestVideoPlayback:
    """Test suite for video playback functionality."""

    def test_video_track_loads(self, app_page):
        """Selecting a video track loads the video element."""
        # Wait for tracks to load
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track (default feed has videos)
        first_track = app_page.locator("#track-list li").first
        first_track.click()

        # Wait for video to have a source
        app_page.wait_for_function(
            """() => {
                const video = document.getElementById('video-element');
                return video && video.src && video.src.length > 0;
            }""",
            timeout=10000,
        )

        # Check video has source
        has_src = app_page.evaluate(
            "document.getElementById('video-element').src.length > 0"
        )
        assert has_src, "Video source was not set"

    def test_video_controls_visible_on_hover(self, app_page):
        """Video controls become visible when hovering over video."""
        # Load a video track
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        # Hover over video container
        video_container = app_page.locator(".video-container")
        video_container.hover()

        # Controls should be visible
        controls = app_page.locator(".video-controls-overlay")
        expect(controls).to_be_visible()


class TestAudioOnlyPlayback:
    """Test suite for audio-only track playback (MP3s)."""

    def test_audio_controls_visible_on_hover(self, app_page):
        """Controls are visible when hovering over album art for audio tracks."""
        # Switch to 8track Audio Collection (audio-only)
        app_page.wait_for_selector(".playlist-button", timeout=5000)
        playlist_btn = app_page.locator(".playlist-button", has_text="8track")
        playlist_btn.click()
        app_page.wait_for_timeout(500)

        # Click first audio track
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        # Hover over video container (which now shows album art)
        video_container = app_page.locator(".video-container")
        video_container.hover()

        # Controls overlay should be visible
        controls = app_page.locator(".video-controls-overlay")
        expect(controls).to_be_visible()

    def test_audio_fallback_shows_album_art(self, app_page):
        """Audio fallback display shows album art for audio-only tracks."""
        # Switch to 8track Audio Collection
        app_page.wait_for_selector(".playlist-button", timeout=5000)
        playlist_btn = app_page.locator(".playlist-button", has_text="8track")
        playlist_btn.click()
        app_page.wait_for_timeout(500)

        # Click first audio track
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        # Audio fallback should be visible
        audio_fallback = app_page.locator("#audio-display-fallback")
        expect(audio_fallback).to_be_visible()

    def test_audio_mode_class_applied(self, app_page):
        """Video wrapper has audio-mode class for audio-only tracks."""
        # Switch to 8track Audio Collection
        app_page.wait_for_selector(".playlist-button", timeout=5000)
        playlist_btn = app_page.locator(".playlist-button", has_text="8track")
        playlist_btn.click()
        app_page.wait_for_timeout(500)

        # Click first audio track
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        # Check audio-mode class is applied
        has_class = app_page.evaluate(
            "document.querySelector('.video-wrapper').classList.contains('audio-mode')"
        )
        assert has_class, "audio-mode class not applied to video wrapper"


class TestPlaybackControls:
    """Test suite for playback control elements."""

    def test_volume_control_exists(self, app_page):
        """Volume control slider is present."""
        volume = app_page.locator("#video-volume-slider")
        expect(volume).to_be_attached()

    def test_speed_control_exists(self, app_page):
        """Speed control button is present."""
        # Hover over video to show controls
        app_page.locator(".video-container").hover()
        speed = app_page.locator("#video-speed-button")
        expect(speed).to_be_visible()

    def test_speed_cycles_correctly(self, app_page):
        """Speed button cycles through speed options."""
        # Load a track first
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        # Hover to show controls
        app_page.locator(".video-container").hover()

        speed_btn = app_page.locator("#video-speed-button")

        # Get initial speed text
        initial_text = speed_btn.inner_text()

        # Click to cycle
        speed_btn.click()
        app_page.wait_for_timeout(100)

        # Speed should have changed
        new_text = speed_btn.inner_text()
        assert initial_text != new_text, "Speed did not cycle"

    def test_prev_next_buttons_exist(self, app_page):
        """Previous and next track buttons are present in video controls."""
        # Hover over video container to show controls
        app_page.locator(".video-container").hover()

        prev_btn = app_page.locator("#video-prev-track")
        next_btn = app_page.locator("#video-next-track")

        expect(prev_btn).to_be_visible()
        expect(next_btn).to_be_visible()

    def test_seek_slider_exists(self, app_page):
        """Seek slider is present."""
        seek = app_page.locator("#seek-bar")
        expect(seek).to_be_attached()
