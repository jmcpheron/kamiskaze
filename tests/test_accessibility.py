"""Accessibility tests.

The redesign turned the track list into real <button> rows so it works with a
keyboard and screen readers. These tests lock that behaviour in.
"""

from playwright.sync_api import expect

from conftest import active_track_index


class TestKeyboardAndSemantics:
    def test_track_rows_are_buttons(self, app_page):
        """Track rows are <button>s, so they're focusable and keyboard-operable."""
        tags = app_page.eval_on_selector_all(
            ".track-row", "els => els.map(e => e.tagName)"
        )
        assert tags and all(t == "BUTTON" for t in tags), f"Non-button rows: {tags}"

    def test_enter_activates_focused_track(self, app_page):
        """Focusing a row and pressing Enter selects and plays that track."""
        third = app_page.locator(".track-row").nth(2)
        third.focus()
        expect(third).to_be_focused()

        third.press("Enter")
        app_page.wait_for_timeout(200)

        assert active_track_index(app_page) == 2
        expect(app_page.locator("#now-playing-title")).to_have_text("Psycho Cycle")

    def test_track_buttons_have_accessible_names(self, app_page):
        """Each row exposes its number and title as its accessible name."""
        first = app_page.locator(".track-row").first
        name = first.inner_text().replace("\n", " ")
        assert "1" in name and "Silly Girl" in name

    def test_landmarks_and_labels(self, app_page):
        """Key regions carry accessible names for assistive tech."""
        expect(app_page.locator("#video-player")).to_have_attribute("aria-label", "Kamiskaze live recording player")
        expect(app_page.locator("#track-list")).to_have_attribute("aria-label", "Track list")
        # About and recording sections are labelled by their headings.
        expect(app_page.locator("section.about")).to_have_attribute("aria-labelledby", "about-label")


class TestNativeControls:
    def test_video_uses_native_controls(self, app_page):
        """Playback relies on built-in browser controls (keyboard accessible)."""
        expect(app_page.locator("#video-player")).to_have_attribute("controls", "")
