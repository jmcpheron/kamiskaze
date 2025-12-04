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

    def test_playlist_sidebar_renders(self, app_page):
        """Playlist sidebar renders with track list."""
        playlist = app_page.locator(".sidebar-playlist")
        expect(playlist).to_be_visible()

        # Should have track items
        track_items = app_page.locator("#track-list li")
        count = track_items.count()
        assert count > 0, "No track items found in playlist"

    def test_video_player_present(self, app_page):
        """Video player element is present in the DOM."""
        video = app_page.locator("#video-element")
        expect(video).to_be_attached()

    def test_audio_player_present(self, app_page):
        """Audio player element is present in the DOM."""
        audio = app_page.locator("#audio-player")
        expect(audio).to_be_attached()

    def test_theme_toggle_exists(self, app_page):
        """Theme toggle button is present in the DOM."""
        theme_toggle = app_page.locator("#theme-toggle")
        # Button exists but may be hidden on smaller viewports
        expect(theme_toggle).to_be_attached()

    def test_theme_toggle_changes_theme(self, app_page):
        """Clicking theme toggle changes the page theme."""
        # Get initial theme state (uses data-theme attribute on documentElement)
        initial_theme = app_page.evaluate("document.documentElement.getAttribute('data-theme')")

        # Use JavaScript to click the theme toggle (bypasses visibility issues)
        app_page.evaluate("document.getElementById('theme-toggle').click()")
        app_page.wait_for_timeout(100)

        # Check theme changed
        new_theme = app_page.evaluate("document.documentElement.getAttribute('data-theme')")
        assert initial_theme != new_theme, "Theme did not change after toggle"

    def test_about_tab_accessible(self, app_page):
        """About tab is present and can be clicked."""
        about_btn = app_page.locator("[data-tab='about']")
        expect(about_btn).to_be_visible()

        # Click about tab
        about_btn.click()

        # About section should be visible
        about_section = app_page.locator("#about-tab")
        expect(about_section).to_be_visible()

    def test_playlist_buttons_present(self, app_page):
        """Playlist navigation buttons are present."""
        playlist_buttons = app_page.locator("#playlist-buttons")
        expect(playlist_buttons).to_be_visible()


class TestTestPage:
    """Tests for the test-player.html page."""

    def test_test_page_loads(self, test_page):
        """Test player page loads successfully."""
        expect(test_page).to_have_title("Kamiskaze Player - Test Interface")

    def test_test_page_has_launch_button(self, test_page):
        """Test page has button to launch main player."""
        launch_link = test_page.locator("a[href='index.html']")
        expect(launch_link.first).to_be_visible()
