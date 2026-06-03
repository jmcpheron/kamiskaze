"""Tests for playback: selecting a track loads it and updates the UI."""

from playwright.sync_api import expect


def _wait_for_video_src(page, timeout=10000):
    page.wait_for_function(
        """() => {
            const v = document.getElementById('video-player');
            return v && v.src && v.src.length > 0;
        }""",
        timeout=timeout,
    )


class TestPlayback:
    """Selecting a track wires it up to the player."""

    def test_media_frame_visible(self, app_page):
        """The media frame container is visible."""
        expect(app_page.locator(".media-frame")).to_be_visible()

    def test_clicking_track_sets_video_source(self, app_page):
        """Clicking a row points the video element at that track's file."""
        app_page.locator(".track-row").first.click()
        _wait_for_video_src(app_page)

        src = app_page.evaluate("document.getElementById('video-player').src")
        assert src.endswith(".mp4"), f"Unexpected video source: {src}"
        assert "Silly%20Girl" in src or "Silly Girl" in src

    def test_now_playing_updates_on_selection(self, app_page):
        """The 'Now Playing' caption reflects the selected track."""
        rows = app_page.locator(".track-row")
        rows.nth(1).click()
        expect(app_page.locator("#now-playing-title")).to_have_text("Generation Y")

    def test_auto_advance_wraps_to_next_track(self, app_page):
        """When a track ends, the player advances to the next one."""
        app_page.locator(".track-row").first.click()
        _wait_for_video_src(app_page)

        # Simulate the track ending without waiting for real playback.
        app_page.evaluate(
            "document.getElementById('video-player').dispatchEvent(new Event('ended'))"
        )
        expect(app_page.locator("#now-playing-title")).to_have_text("Generation Y")
