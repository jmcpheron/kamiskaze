"""Pytest configuration and fixtures for Kamiskaze tests."""

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
        # Server already running (e.g., started manually)
        yield BASE_URL
        return

    # Start the server
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
    """Navigate to the main application page."""
    page.goto(f"{server}/index.html")
    # Wait for the page to be fully loaded
    page.wait_for_load_state("networkidle")
    return page


@pytest.fixture
def test_page(page, server):
    """Navigate to the test player page."""
    page.goto(f"{server}/test-player.html")
    page.wait_for_load_state("networkidle")
    return page


# Helper functions available to all tests
def wait_for_audio_ready(page, timeout=10000):
    """Wait for the audio element to be ready to play."""
    page.wait_for_function(
        """() => {
            const audio = document.getElementById('audioPlayer');
            return audio && audio.readyState >= 2;
        }""",
        timeout=timeout,
    )


def wait_for_video_ready(page, timeout=10000):
    """Wait for the video element to be ready to play."""
    page.wait_for_function(
        """() => {
            const video = document.getElementById('videoPlayer');
            return video && video.readyState >= 2;
        }""",
        timeout=timeout,
    )


def get_local_storage(page, key):
    """Get a value from localStorage."""
    return page.evaluate(f"localStorage.getItem('{key}')")


def set_local_storage(page, key, value):
    """Set a value in localStorage."""
    page.evaluate(f"localStorage.setItem('{key}', '{value}')")


def clear_local_storage(page):
    """Clear all localStorage."""
    page.evaluate("localStorage.clear()")
