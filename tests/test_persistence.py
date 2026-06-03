"""Tests for localStorage state persistence across reloads."""

from conftest import get_saved_state, active_track_index


class TestPersistence:
    """The player remembers the last track (and position) via localStorage."""

    def test_selection_is_saved(self, app_page):
        """Selecting a track writes index + time to kamiskaze-state."""
        app_page.locator(".track-row").nth(1).click()
        app_page.wait_for_timeout(300)

        state = get_saved_state(app_page)
        assert state is not None, "Player state was not saved"
        assert state.get("index") == 1, f"Wrong index saved: {state}"
        assert "time" in state, "Saved state is missing the playback time"

    def test_state_restored_on_reload(self, app_page):
        """After reload, the saved track is re-selected and shown as Now Playing."""
        app_page.locator(".track-row").nth(2).click()
        app_page.wait_for_timeout(300)

        app_page.reload()
        app_page.wait_for_load_state("networkidle")
        app_page.wait_for_selector(".track-row", timeout=5000)
        app_page.wait_for_timeout(300)

        assert active_track_index(app_page) == 2, "Saved track was not re-selected"
        now_playing = app_page.locator("#now-playing-title").inner_text()
        assert now_playing == "Psycho Cycle", f"Now Playing not restored: {now_playing}"

    def test_default_state_without_storage(self, page, server):
        """With no saved state, the first track is queued (not a black/empty player)."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector(".track-row", timeout=5000)
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_selector(".track-row", timeout=5000)
        page.wait_for_timeout(300)

        assert active_track_index(page) == 0
        assert page.locator("#now-playing-title").inner_text() == "Silly Girl"
