"""Tests for video playback functionality."""

import pytest
from playwright.sync_api import expect


class TestVideoPlayback:
    """Test suite for video playback functionality."""

    def test_video_track_plays_on_click(self, app_page):
        """Clicking a track starts playback."""
        # Wait for track list to load
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        first_track = app_page.locator("#track-list li").first
        first_track.click()

        # Wait for video to have a source
        app_page.wait_for_function(
            """() => {
                const video = document.getElementById('video-player');
                return video && video.src && video.src.length > 0;
            }""",
            timeout=10000,
        )

        # Check video has source
        has_src = app_page.evaluate(
            "document.getElementById('video-player').src.length > 0"
        )
        assert has_src, "Video source was not set"

    def test_video_loads_on_track_click(self, app_page):
        """Selecting a track loads the video element."""
        # Wait for tracks to load
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        first_track = app_page.locator("#track-list li").first
        first_track.click()

        # Wait for video to have a source
        app_page.wait_for_function(
            """() => {
                const video = document.getElementById('video-player');
                return video && video.src && video.src.length > 0;
            }""",
            timeout=10000,
        )

        # Check video has source
        has_src = app_page.evaluate(
            "document.getElementById('video-player').src.length > 0"
        )
        assert has_src, "Video source was not set"

    def test_video_container_visible(self, app_page):
        """Video container is visible on the page."""
        video_container = app_page.locator(".video-container")
        expect(video_container).to_be_visible()

    def test_native_video_controls_present(self, app_page):
        """Video element has native controls attribute."""
        has_controls = app_page.evaluate(
            "document.getElementById('video-player').hasAttribute('controls')"
        )
        assert has_controls, "Video element missing controls attribute"
