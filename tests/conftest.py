"""Pytest configuration and fixtures for Kamiskaze tests.

The site is a static single-page app served over HTTP. These fixtures spin up
a throwaway `python3 -m http.server` for the session and give each test a fresh
page pointed at the app, plus a few small localStorage helpers.
"""

import subprocess
import time
import socket
import pytest
from pathlib import Path


# Configuration
SERVER_PORT = 8001
BASE_URL = f"http://localhost:{SERVER_PORT}"
PROJECT_ROOT = Path(__file__).parent.parent


def is_port_in_use(port: int) -> bool:
    """Check if a port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


@pytest.fixture(scope="session")
def server():
    """Start a local HTTP server for the duration of the test session."""
    if is_port_in_use(SERVER_PORT):
        # Server already running (e.g., started manually or by CI)
        yield BASE_URL
        return

    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(SERVER_PORT)],
        cwd=PROJECT_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Wait for server to start
    for _ in range(50):  # 5 second timeout
        if is_port_in_use(SERVER_PORT):
            break
        time.sleep(0.1)
    else:
        proc.kill()
        pytest.fail("Server failed to start within 5 seconds")

    yield BASE_URL

    # Cleanup
    proc.terminate()
    proc.wait(timeout=5)


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Configure browser context for all tests."""
    return {
        **browser_context_args,
        "viewport": {"width": 1280, "height": 720},
        "ignore_https_errors": True,
    }


@pytest.fixture
def app_page(page, server):
    """Navigate to the main application page with the track list rendered."""
    page.goto(f"{server}/index.html")
    page.wait_for_load_state("networkidle")
    # The track list is populated from feed.json by main.js; wait for it.
    page.wait_for_selector(".track-row", timeout=5000)
    return page


# --- localStorage helpers available to all tests -------------------------------

STORAGE_KEY = "kamiskaze-state"


def get_saved_state(page):
    """Return the parsed kamiskaze-state object from localStorage (or None)."""
    return page.evaluate(
        """() => {
            const raw = localStorage.getItem('kamiskaze-state');
            return raw ? JSON.parse(raw) : null;
        }"""
    )


def active_track_index(page):
    """Return the 0-based index of the row marked aria-current, or -1."""
    return page.evaluate(
        """() => {
            const rows = Array.from(document.querySelectorAll('.track-row'));
            return rows.findIndex(r => r.getAttribute('aria-current') === 'true');
        }"""
    )
