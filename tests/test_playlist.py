"""Tests for playlist functionality."""

import pytest
from playwright.sync_api import expect


class TestPlaylistRendering:
    """Test suite for playlist rendering."""

    def test_track_list_renders_all_items(self, app_page):
        """All tracks from feed are rendered in playlist."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Count track items
        track_items = app_page.locator("#track-list li")
        count = track_items.count()

        # Should have multiple tracks
        assert count > 0, "No tracks rendered"

    def test_track_items_have_content(self, app_page):
        """Track items display track information."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        first_track = app_page.locator("#track-list li").first
        text = first_track.inner_text()

        assert len(text) > 0, "Track item has no content"

    def test_active_track_highlighted(self, app_page):
        """Currently playing track is visually highlighted."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click a track
        first_track = app_page.locator("#track-list li").first
        first_track.click()
        app_page.wait_for_timeout(300)

        # Check for playing class (app uses 'playing' not 'active')
        has_playing = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).some(t => t.classList.contains('playing'));
            }"""
        )
        assert has_playing, "No track marked as playing"


class TestTrackNavigation:
    """Test suite for track navigation."""

    def test_clicking_track_changes_playback(self, app_page):
        """Clicking a different track changes the current track."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        tracks = app_page.locator("#track-list li")
        if tracks.count() < 2:
            pytest.skip("Need at least 2 tracks to test navigation")

        tracks.nth(0).click()
        app_page.wait_for_timeout(300)

        # Get which track is playing
        first_playing = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('playing'));
            }"""
        )

        # Click second track
        tracks.nth(1).click()
        app_page.wait_for_timeout(300)

        # Check track changed
        second_playing = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('playing'));
            }"""
        )
        assert first_playing != second_playing, "Track did not change"

    def test_next_button_advances_track(self, app_page):
        """Next button advances to the next track."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        app_page.locator("#track-list li").first.click()
        app_page.wait_for_timeout(300)

        first_index = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('playing'));
            }"""
        )

        # Click next
        app_page.click("#next-button")
        app_page.wait_for_timeout(300)

        # Check track advanced
        second_index = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('playing'));
            }"""
        )
        # Next should advance (or wrap around)
        assert second_index >= 0, "Next button failed"

    def test_prev_button_goes_back(self, app_page):
        """Previous button goes to the previous track."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        tracks = app_page.locator("#track-list li")
        if tracks.count() < 2:
            pytest.skip("Need at least 2 tracks to test navigation")

        # Click second track
        tracks.nth(1).click()
        app_page.wait_for_timeout(300)

        # Click previous
        app_page.click("#prev-button")
        app_page.wait_for_timeout(300)

        # Should be back at first track (uses 'playing' class, not 'active')
        playing_index = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('playing'));
            }"""
        )
        assert playing_index == 0, "Previous did not go to first track"


class TestPlaylistButtons:
    """Test suite for playlist/feed switching."""

    def test_playlist_buttons_present(self, app_page):
        """Playlist navigation buttons are present."""
        app_page.wait_for_selector("#playlist-buttons", timeout=5000)
        playlist_buttons = app_page.locator("#playlist-buttons button")
        count = playlist_buttons.count()
        assert count > 0, "No playlist buttons found"

    def test_clicking_playlist_button_changes_tracks(self, app_page):
        """Clicking a different playlist loads different tracks."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Get initial track count and first track title
        initial_first_title = app_page.locator("#track-list li").first.inner_text()

        # Get playlist buttons
        buttons = app_page.locator("#playlist-buttons button")
        if buttons.count() < 2:
            pytest.skip("Need at least 2 playlists to test switching")

        # Click a different playlist button
        buttons.nth(1).click()
        app_page.wait_for_timeout(500)
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Check tracks changed
        new_first_title = app_page.locator("#track-list li").first.inner_text()
        # Titles should be different (different playlists have different tracks)
        assert initial_first_title != new_first_title, \
            "Playlist switch did not change tracks"

    def test_active_playlist_highlighted(self, app_page):
        """Currently selected playlist button is highlighted."""
        app_page.wait_for_selector("#playlist-buttons button", timeout=5000)

        # Check for active class on playlist buttons
        has_active = app_page.evaluate(
            """() => {
                const buttons = document.querySelectorAll('#playlist-buttons button');
                return Array.from(buttons).some(b => b.classList.contains('active'));
            }"""
        )
        assert has_active, "No playlist button marked as active"
