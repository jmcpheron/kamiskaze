"""Screenshot capture script for Visual Changelog.

Captures screenshots of the Kamiskaze player in various states for the visual changelog.
Run with: python tests/capture_screenshots.py
"""

import subprocess
import time
import socket
from pathlib import Path
from playwright.sync_api import sync_playwright

# Configuration
SERVER_PORT = 8001
BASE_URL = f"http://localhost:{SERVER_PORT}"
PROJECT_ROOT = Path(__file__).parent.parent
SCREENSHOTS_DIR = PROJECT_ROOT / "screenshots"
VIEWPORT = {"width": 1280, "height": 720}


def is_port_in_use(port: int) -> bool:
    """Check if a port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


def start_server():
    """Start local HTTP server if not already running."""
    if is_port_in_use(SERVER_PORT):
        print(f"Server already running on port {SERVER_PORT}")
        return None

    print(f"Starting HTTP server on port {SERVER_PORT}...")
    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(SERVER_PORT)],
        cwd=PROJECT_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Wait for server to start
    for _ in range(50):
        if is_port_in_use(SERVER_PORT):
            print("Server started successfully")
            return proc
        time.sleep(0.1)

    proc.kill()
    raise RuntimeError("Server failed to start within 5 seconds")


def setup_page(browser):
    """Create a new page with standard viewport."""
    context = browser.new_context(
        viewport=VIEWPORT,
        ignore_https_errors=True,
    )
    page = context.new_page()
    return page


def wait_for_app_ready(page):
    """Wait for the application to be fully loaded."""
    page.goto(f"{BASE_URL}/index.html")
    page.wait_for_load_state("networkidle")
    # Wait for tracks to load
    page.wait_for_selector("#track-list li", timeout=10000)
    print("App loaded and ready")


def set_theme(page, theme):
    """Set the application theme (dark/light)."""
    page.evaluate(f"""
        document.documentElement.setAttribute('data-theme', '{theme}');
        localStorage.setItem('theme', '{theme}');
    """)
    page.wait_for_timeout(200)


def capture_video_playing(page, theme, filename):
    """Capture screenshot with video track playing."""
    set_theme(page, theme)

    # Ensure we're on player tab
    page.click("[data-tab='player']")
    page.wait_for_timeout(300)

    # Click first track (should be a video from Palm Springs feed)
    page.locator("#track-list li").first.click()
    page.wait_for_timeout(500)

    # Wait for video to be ready
    try:
        page.wait_for_function(
            """() => {
                const video = document.getElementById('video-element');
                return video && video.readyState >= 2;
            }""",
            timeout=10000,
        )
    except Exception as e:
        print(f"Warning: Video may not have loaded fully: {e}")

    # Hover to show controls
    page.locator(".video-container").hover()
    page.wait_for_timeout(300)

    filepath = SCREENSHOTS_DIR / filename
    page.screenshot(path=str(filepath))
    print(f"Captured: {filename}")


def capture_audio_playing(page, theme, filename):
    """Capture screenshot with audio-only track (album art visible)."""
    set_theme(page, theme)

    # Switch to 8track Audio Collection playlist
    page.wait_for_selector(".playlist-button", timeout=5000)

    # Find and click the 8track playlist button
    playlist_buttons = page.locator(".playlist-button")
    for i in range(playlist_buttons.count()):
        button = playlist_buttons.nth(i)
        text = button.inner_text()
        if "8track" in text.lower():
            button.click()
            break

    page.wait_for_timeout(500)

    # Click first audio track
    page.locator("#track-list li").first.click()
    page.wait_for_timeout(500)

    # Hover to show controls
    page.locator(".video-container").hover()
    page.wait_for_timeout(300)

    filepath = SCREENSHOTS_DIR / filename
    page.screenshot(path=str(filepath))
    print(f"Captured: {filename}")


def capture_about_page(page, filename):
    """Capture screenshot of About tab."""
    page.click("[data-tab='about']")
    page.wait_for_timeout(500)
    page.wait_for_selector(".about-section", timeout=5000)

    filepath = SCREENSHOTS_DIR / filename
    page.screenshot(path=str(filepath))
    print(f"Captured: {filename}")


def main():
    """Main screenshot capture routine."""
    # Ensure screenshots directory exists
    SCREENSHOTS_DIR.mkdir(exist_ok=True)

    # Start server if needed
    server_proc = start_server()

    try:
        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch()

            try:
                page = setup_page(browser)
                wait_for_app_ready(page)

                # Capture all screenshot states
                print("\nCapturing screenshots...")
                capture_video_playing(page, "light", "player-video-light.png")
                capture_video_playing(page, "dark", "player-video-dark.png")
                capture_audio_playing(page, "dark", "player-audio-dark.png")
                capture_about_page(page, "about-page.png")

                print(f"\nAll screenshots saved to {SCREENSHOTS_DIR}/")

            finally:
                browser.close()

    finally:
        # Stop server if we started it
        if server_proc:
            print("Stopping server...")
            server_proc.terminate()
            server_proc.wait(timeout=5)


if __name__ == "__main__":
    main()
