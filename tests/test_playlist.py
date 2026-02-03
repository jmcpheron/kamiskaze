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

        # Check for active class (simplified player uses 'active' class)
        has_active = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).some(t => t.classList.contains('active'));
            }"""
        )
        assert has_active, "No track marked as active"


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

        # Get which track is active
        first_active = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('active'));
            }"""
        )

        # Click second track
        tracks.nth(1).click()
        app_page.wait_for_timeout(300)

        # Check track changed
        second_active = app_page.evaluate(
            """() => {
                const tracks = document.querySelectorAll('#track-list li');
                return Array.from(tracks).findIndex(t => t.classList.contains('active'));
            }"""
        )
        assert first_active != second_active, "Track did not change"

    def test_track_numbers_displayed(self, app_page):
        """Track items show track numbers."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Check first track has number
        first_track = app_page.locator("#track-list li").first
        track_number = first_track.locator(".track-number")
        expect(track_number).to_be_visible()
        assert "1." in track_number.inner_text(), "Track number not displayed"

    def test_track_titles_displayed(self, app_page):
        """Track items show track titles."""
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Check first track has title
        first_track = app_page.locator("#track-list li").first
        track_title = first_track.locator(".track-title")
        expect(track_title).to_be_visible()
        assert len(track_title.inner_text()) > 0, "Track title not displayed"
