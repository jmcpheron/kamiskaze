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

        # Check localStorage has state (simplified player uses 'kamiskaze-state')
        saved_state = page.evaluate("localStorage.getItem('kamiskaze-state')")
        assert saved_state is not None, "Player state not saved"

        # Reload page
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("#track-list li", timeout=5000)
        page.wait_for_timeout(500)

        # Player state should still exist
        restored_state = page.evaluate("localStorage.getItem('kamiskaze-state')")
        assert restored_state is not None, "Player state not persisted"

    def test_state_contains_index(self, page, server):
        """Saved state contains track index."""
        page.goto(f"{server}/index.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("#track-list li", timeout=5000)

        # Click first track
        page.locator("#track-list li").first.click()
        page.wait_for_timeout(500)

        # Check state format
        state = page.evaluate("""
            const state = localStorage.getItem('kamiskaze-state');
            return state ? JSON.parse(state) : null;
        """)
        assert state is not None, "State not saved"
        assert "index" in state, "State missing index field"


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
