"""Tests for page loading and initial rendering."""

import pytest
from playwright.sync_api import expect


class TestPageLoad:
    """Test suite for page loading functionality."""

    def test_main_page_loads(self, app_page):
        """Main index.html page loads without errors."""
        expect(app_page).to_have_title("Kamiskaze Archives")

    def test_no_console_errors(self, page, server):
        """Page loads without JavaScript console errors."""
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")

        # Filter out expected errors (like 404 for missing media)
        critical_errors = [e for e in errors if "404" not in e and "net::" not in e]
        assert len(critical_errors) == 0, f"Console errors found: {critical_errors}"

    def test_feed_loads_successfully(self, app_page):
        """Feed.json loads and populates the playlist."""
        # Wait for track list items to render
        app_page.wait_for_selector("#track-list li", timeout=5000)

        # Check that at least one track item exists
        track_items = app_page.locator("#track-list li")
        expect(track_items.first).to_be_visible()

    def test_track_list_renders(self, app_page):
        """Track list renders with track items."""
        track_list = app_page.locator("#track-list")
        expect(track_list).to_be_visible()

        # Should have track items
        track_items = app_page.locator("#track-list li")
        count = track_items.count()
        assert count > 0, "No track items found in playlist"

    def test_video_player_present(self, app_page):
        """Video player element is present in the DOM."""
        video = app_page.locator("#video-player")
        expect(video).to_be_attached()

    def test_about_section_visible(self, app_page):
        """About section is visible on the page."""
        about_section = app_page.locator(".about")
        expect(about_section).to_be_visible()

    def test_header_visible(self, app_page):
        """Header with title is visible."""
        header = app_page.locator(".header")
        expect(header).to_be_visible()

        title = app_page.locator(".title")
        expect(title).to_have_text("Kamiskaze")


class TestTestPage:
    """Tests for the test-player.html page."""

    def test_test_page_loads(self, test_page):
        """Test player page loads successfully."""
        expect(test_page).to_have_title("Kamiskaze Player - Test Interface")

    def test_test_page_has_launch_button(self, test_page):
        """Test page has button to launch main player."""
        launch_link = test_page.locator("a[href='index.html']")
        expect(launch_link.first).to_be_visible()
