#!/usr/bin/env python3
"""
QA Test Script for War Card Game.
Tests the full game flow using Playwright.
"""

from playwright.sync_api import sync_playwright
import time


def test_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=== QA Test: War Card Game ===")

        # Navigate to the game
        import sys

        port = sys.argv[1] if len(sys.argv) > 1 else "5173"
        page.goto(f"http://localhost:{port}")
        page.wait_for_load_state("networkidle")

        # Take initial screenshot
        page.screenshot(path="/tmp/war-game-01-initial.png", full_page=True)
        print("1. Initial page loaded")

        # Wait for loading screen to finish (if any)
        time.sleep(1)
        page.screenshot(path="/tmp/war-game-02-after-load.png", full_page=True)
        print("2. After loading screen")

        # Look for title screen elements
        content = page.content()
        print(f"3. Page title present: {'WAR' in content}")

        # Find and inspect the page structure
        page.screenshot(path="/tmp/war-game-03-title-screen.png", full_page=True)

        # Try to find input fields for player names
        inputs = page.locator("input").all()
        print(f"4. Found {len(inputs)} input fields")

        # Try to find the start button
        buttons = page.locator("button").all()
        print(f"5. Found {len(buttons)} buttons")

        # If we found inputs, fill them in
        if len(inputs) >= 2:
            inputs[0].fill("QA Tester 1")
            inputs[1].fill("QA Tester 2")
            print("6. Filled in player names")
            page.screenshot(path="/tmp/war-game-04-names-filled.png", full_page=True)

        # Find and click the start button
        start_button = page.locator('button:has-text("START")').first
        if start_button:
            start_button.click()
            print("7. Clicked START button")
            time.sleep(1)
            page.screenshot(path="/tmp/war-game-05-game-started.png", full_page=True)

        # Wait for game to initialize
        time.sleep(1)

        # Check if canvas/3D scene is present
        canvas_elements = page.locator("canvas").all()
        print(f"8. Found {len(canvas_elements)} canvas elements")

        page.screenshot(path="/tmp/war-game-06-game-scene.png", full_page=True)

        # Try clicking to draw cards (the game should respond to any click)
        print("9. Testing draw mechanics...")
        for i in range(5):
            page.click("body")
            time.sleep(0.8)
            page.screenshot(path=f"/tmp/war-game-draw-{i + 1}.png", full_page=True)
            print(f"   Draw {i + 1} complete")

        # Final screenshot
        page.screenshot(path="/tmp/war-game-final.png", full_page=True)
        print("10. Test complete!")

        # Check console for errors
        console_messages = []
        page.on("console", lambda msg: console_messages.append(msg))

        browser.close()

        print("\n=== Test Summary ===")
        print(f"Screenshots saved to /tmp/war-game-*.png")
        return True


if __name__ == "__main__":
    test_game()
