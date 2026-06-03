"""Tests for the track list: rendering, numbering, and active-track state."""

import pytest
from playwright.sync_api import expect

from conftest import active_track_index


class TestPlaylistRendering:
    """The track list renders one accessible row per track."""

    def test_renders_a_row_per_track(self, app_page):
        """Every track in the feed becomes a row."""
        assert app_page.locator(".track-row").count() == 9

    def test_rows_show_number_and_title(self, app_page):
        """Each row shows a 1-based track number and a non-empty title."""
        first = app_page.locator(".track-row").first
        expect(first.locator(".track-number")).to_have_text("1")
        title = first.locator(".track-title").inner_text()
        assert title.strip(), "First track has no title"

    def test_titles_match_feed_order(self, app_page):
        """Track titles render in feed order (sanity check on rendering)."""
        titles = app_page.locator(".track-title").all_inner_texts()
        assert titles[0] == "Silly Girl"
        assert titles[1] == "Generation Y"


class TestActiveTrack:
    """Exactly one row is marked active via aria-current, and it follows clicks."""

    def test_a_track_is_active_after_click(self, app_page):
        """Clicking a row marks it aria-current="true"."""
        app_page.locator(".track-row").first.click()
        app_page.wait_for_timeout(200)
        expect(app_page.locator('.track-row[aria-current="true"]')).to_have_count(1)

    def test_clicking_a_different_track_moves_the_active_marker(self, app_page):
        """Selecting another row moves the active marker to it."""
        rows = app_page.locator(".track-row")
        if rows.count() < 2:
            pytest.skip("Need at least 2 tracks")

        rows.nth(0).click()
        app_page.wait_for_timeout(200)
        first = active_track_index(app_page)

        rows.nth(2).click()
        app_page.wait_for_timeout(200)
        second = active_track_index(app_page)

        assert first == 0
        assert second == 2
        assert first != second, "Active track did not change"
