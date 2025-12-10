"""Tests for UI controls and interactions."""

import pytest
from playwright.sync_api import expect


class TestVideoControls:
    """Test suite for video-specific controls."""

    def test_fullscreen_button_exists(self, app_page):
        """Fullscreen button is present in video controls."""
        # Load a video track to make controls visible
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        # Hover to show controls
        app_page.locator(".video-container").hover()

        fullscreen_btn = app_page.locator("#video-fullscreen-button")
        expect(fullscreen_btn).to_be_visible()

    def test_pip_button_exists(self, app_page):
        """Picture-in-Picture button is present."""
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        app_page.locator(".video-container").hover()

        pip_btn = app_page.locator("#video-pip-button")
        expect(pip_btn).to_be_visible()

    def test_progress_bar_exists(self, app_page):
        """Progress bar is present in video controls."""
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(500)

        app_page.locator(".video-container").hover()

        progress = app_page.locator(".video-progress-bar")
        expect(progress).to_be_visible()


class TestKeyboardShortcuts:
    """Test suite for keyboard shortcuts."""

    def test_space_toggles_playback(self, app_page):
        """Pressing space toggles play/pause."""
        # Load a track
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()

        # Wait for audio ready
        app_page.wait_for_function(
            "document.getElementById('audio-player').readyState >= 2",
            timeout=10000,
        )

        # Get initial state
        initial_paused = app_page.evaluate(
            "document.getElementById('audio-player').paused"
        )

        # Click on video container to ensure focus, then press space
        app_page.locator(".video-container").click()
        app_page.wait_for_timeout(100)
        app_page.keyboard.press("Space")
        app_page.wait_for_timeout(200)

        # Check state changed
        new_paused = app_page.evaluate(
            "document.getElementById('audio-player').paused"
        )
        assert initial_paused != new_paused, "Space did not toggle playback"

    def test_arrow_keys_seek(self, app_page):
        """Arrow keys seek forward/backward."""
        # Load a track
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()

        app_page.wait_for_function(
            "document.getElementById('audio-player').readyState >= 2",
            timeout=10000,
        )

        # Get initial time
        initial_time = app_page.evaluate(
            "document.getElementById('audio-player').currentTime"
        )

        # Press right arrow
        app_page.keyboard.press("ArrowRight")
        app_page.wait_for_timeout(200)

        # Time should have increased
        new_time = app_page.evaluate(
            "document.getElementById('audio-player').currentTime"
        )
        assert new_time >= initial_time, "Right arrow did not seek forward"


class TestMuteControl:
    """Test suite for mute/volume controls."""

    def test_mute_button_exists(self, app_page):
        """Mute button is present."""
        app_page.locator(".video-container").hover()
        mute_btn = app_page.locator("#video-volume-button")
        expect(mute_btn).to_be_visible()

    def test_mute_toggles_volume(self, app_page):
        """Clicking mute button toggles muted state."""
        # Load a track first
        app_page.wait_for_selector("#track-list li", timeout=5000)
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(300)

        app_page.locator(".video-container").hover()

        # Get initial muted state (check audio player since that's the active media)
        initial_muted = app_page.evaluate(
            "document.getElementById('audio-player').muted"
        )

        # Click mute button
        app_page.click("#video-volume-button")
        app_page.wait_for_timeout(100)

        # Check muted state changed
        new_muted = app_page.evaluate(
            "document.getElementById('audio-player').muted"
        )
        assert initial_muted != new_muted, "Mute did not toggle"

    def test_volume_slider_exists(self, app_page):
        """Volume slider is present."""
        app_page.locator(".video-container").hover()
        volume_slider = app_page.locator("#video-volume-slider")
        expect(volume_slider).to_be_attached()
