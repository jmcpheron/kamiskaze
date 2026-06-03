"""Tests for native video controls."""

import pytest
from playwright.sync_api import expect


class TestNativeVideoControls:
    """Test suite for native video controls (simplified player uses browser controls)."""

    def test_video_element_has_controls(self, app_page):
        """Video element has controls attribute for native browser controls."""
        video = app_page.locator("#video-player")
        expect(video).to_have_attribute("controls", "")

    def test_video_player_is_interactive(self, app_page):
        """Video player can be interacted with."""
        video = app_page.locator("#video-player")
        expect(video).to_be_visible()
        expect(video).to_be_enabled()


class TestTrackListInteraction:
    """Test suite for track list interactions."""

    def test_track_items_clickable(self, app_page):
        """Track list items are clickable."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        first_track = app_page.locator("#track-list li").first
        expect(first_track).to_be_visible()

        # Click should not throw
        first_track.click()

    def test_clicking_track_updates_video_source(self, app_page):
        """Clicking a track updates the video source."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        app_page.locator("#track-list li").first.click()

        # Wait for video to get source
        app_page.wait_for_function(
            """() => {
                const video = document.getElementById('video-player');
                return video && video.src && video.src.length > 0;
            }""",
            timeout=5000,
        )

        # Verify video has source
        has_src = app_page.evaluate(
            "document.getElementById('video-player').src.length > 0"
        )
        assert has_src, "Video source was not set after clicking track"
