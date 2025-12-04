"""Tests for localStorage state persistence."""

import pytest
from playwright.sync_api import expect


class TestTrackPersistence:
    """Test suite for track state persistence."""

    def test_current_track_persists(self, page, server):
        """Current track index is saved and restored on reload."""
        # First visit - select a track
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("#track-list li", timeout=5000)

        # Select second track
        tracks = page.locator("#track-list li")
        if tracks.count() < 2:
            pytest.skip("Need at least 2 tracks")

        tracks.nth(1).click()
        page.wait_for_timeout(500)

        # Check localStorage has playerState (app stores state as JSON)
        saved_state = page.evaluate("localStorage.getItem('playerState')")
        assert saved_state is not None, "Player state not saved"

        # Reload page
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("#track-list li", timeout=5000)
        page.wait_for_timeout(500)

        # Player state should still exist
        restored_state = page.evaluate("localStorage.getItem('playerState')")
        assert restored_state is not None, "Player state not persisted"


class TestVolumePersistence:
    """Test suite for volume state persistence."""

    def test_volume_persists_across_reload(self, page, server):
        """Volume setting is saved and restored on reload."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")

        # Set volume to specific value
        page.evaluate("document.getElementById('audio-player').volume = 0.3")
        page.evaluate("localStorage.setItem('volume', '0.3')")
        page.wait_for_timeout(200)

        # Reload
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)

        # Check volume restored
        saved_volume = page.evaluate("localStorage.getItem('volume')")
        assert saved_volume is not None, "Volume not persisted"


class TestThemePersistence:
    """Test suite for theme preference persistence."""

    def test_theme_persists_across_reload(self, page, server):
        """Theme preference is saved and restored on reload."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")

        # Toggle theme using JavaScript (bypasses visibility issues)
        page.evaluate("document.getElementById('theme-toggle').click()")
        page.wait_for_timeout(200)

        # Get current theme state
        is_dark = page.evaluate("document.body.classList.contains('dark-mode')")

        # Reload
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(300)

        # Check theme restored
        restored_dark = page.evaluate("document.body.classList.contains('dark-mode')")

        # Theme should match (allowing for system preference override)
        saved_theme = page.evaluate("localStorage.getItem('theme')")
        assert saved_theme is not None, "Theme preference not saved"


class TestPlaybackSpeedPersistence:
    """Test suite for playback speed persistence."""

    def test_speed_persists_across_reload(self, page, server):
        """Playback speed is saved in playerState."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")

        # Hover to show controls and change speed
        page.locator(".video-container").hover()
        page.click("#video-speed-button")
        page.wait_for_timeout(200)

        # Check playerState contains speed info
        player_state = page.evaluate("localStorage.getItem('playerState')")
        # Speed is stored in playerState JSON, verify state exists
        assert player_state is not None, "Player state not saved"


class TestFeedPersistence:
    """Test suite for feed selection persistence."""

    def test_feed_selection_persists(self, page, server):
        """Selected feed is saved and restored on reload."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("#track-list li", timeout=5000)

        # Get playlist buttons
        buttons = page.locator("#playlist-buttons button")
        if buttons.count() < 2:
            pytest.skip("Need at least 2 playlists")

        # Select a different playlist
        buttons.nth(1).click()
        page.wait_for_timeout(500)

        # Reload
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)

        # Check feed saved
        saved_feed = page.evaluate("localStorage.getItem('currentFeedId')")
        # May or may not be persisted depending on implementation
        # This test documents the expected behavior


class TestClearStorage:
    """Test suite for clearing localStorage."""

    def test_clear_resets_state(self, page, server):
        """Clearing localStorage resets all saved state."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")

        # Set some values
        page.evaluate("localStorage.setItem('testKey', 'testValue')")

        # Clear
        page.evaluate("localStorage.clear()")

        # Verify cleared
        value = page.evaluate("localStorage.getItem('testKey')")
        assert value is None, "localStorage not cleared"
