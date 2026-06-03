"""Tests for page loading and initial rendering of the single-page archive."""

from playwright.sync_api import expect


class TestPageLoad:
    """The main page loads, renders its sections, and queues the first track."""

    def test_main_page_loads(self, app_page):
        """index.html loads with the expected title."""
        expect(app_page).to_have_title("Kamiskaze Archives")

    def test_no_console_errors(self, page, server):
        """Page loads without JavaScript console errors (ignoring 404s)."""
        errors = []
        page.on(
            "console",
            lambda msg: errors.append(msg.text) if msg.type == "error" else None,
        )
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")

        # Ignore network 404s (e.g. the absent favicon) which aren't app bugs.
        critical = [e for e in errors if "404" not in e and "net::" not in e]
        assert not critical, f"Console errors found: {critical}"

    def test_masthead_visible(self, app_page):
        """Masthead shows the Kamiskaze wordmark."""
        expect(app_page.locator(".masthead")).to_be_visible()
        expect(app_page.locator(".wordmark")).to_have_text("Kamiskaze")

    def test_about_section_present(self, app_page):
        """About section (band history) renders with its label."""
        expect(app_page.locator(".about")).to_be_visible()
        expect(app_page.locator("#about-label")).to_have_text("About")

    def test_recording_header_present(self, app_page):
        """Recording section header is present."""
        expect(app_page.locator(".recording-title")).to_be_visible()

    def test_feed_populates_track_list(self, app_page):
        """feed.json populates the track list with all nine tracks."""
        rows = app_page.locator(".track-row")
        expect(rows.first).to_be_visible()
        assert rows.count() == 9, f"Expected 9 tracks, got {rows.count()}"

    def test_video_player_present_with_controls(self, app_page):
        """The video element is attached and uses native controls."""
        video = app_page.locator("#video-player")
        expect(video).to_be_visible()
        assert app_page.evaluate(
            "document.getElementById('video-player').hasAttribute('controls')"
        ), "Video element is missing the controls attribute"

    def test_video_has_poster(self, app_page):
        """The media frame shows album art (poster) instead of a black void."""
        poster = app_page.evaluate("document.getElementById('video-player').poster")
        assert poster and poster.strip(), "Video has no poster (would render black)"
