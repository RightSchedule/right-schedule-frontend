"""Owner walkthrough against the real stack. Records a video and step screenshots to tests/e2e/reports/demo/.

Usage: python tests/e2e/demo_owner.py [email] [--headed]
Output folder is wiped on each run. Needs `pip install imageio-ffmpeg` for the mp4 (owner_demo.mp4).
Mutates data (completes/cancels a booking, answers a quote). Re-run scripts/mock_data.sql in the backend to reset.
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "reports" / "demo"
shutil.rmtree(OUT, ignore_errors=True)
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:3000"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
EMAIL = args[0] if args else "demo.owner1@example.com"
HEADED = "--headed" in sys.argv
PASSWORD = "Password123!"
step = 0


def snap(pg, name):
    global step
    step += 1
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / f"{step:02d}_{name}.png"))
    print("shot", step, name)


def pause(pg, ms=900):
    pg.wait_for_timeout(ms)


def open_confirmed(pg):
    """Open the first booking chip whose dialog offers actions (i.e. still CONFIRMED)."""
    chips = pg.locator("section button").filter(has_text=re.compile(r"\d\d:\d\d"))
    for i in range(chips.count()):
        chips.nth(i).click()
        pause(pg, 600)
        if pg.get_by_role("dialog").get_by_role("button", name="Complete").count():
            return True
        pg.keyboard.press("Escape")
        pause(pg, 500)
    return False


with sync_playwright() as p:
    browser = p.chromium.launch(headless=not HEADED, slow_mo=250 if HEADED else 0)
    ctx = browser.new_context(
        viewport=dict(width=1440, height=900),
        record_video_dir=str(OUT / "video"),
        record_video_size=dict(width=1440, height=900),
    )
    pg = ctx.new_page()

    # 1. Login through the real form
    pg.goto(BASE + "/login", wait_until="networkidle")
    snap(pg, "login")
    pg.get_by_label("Email").fill(EMAIL)
    pg.get_by_label("Password", exact=True).fill(PASSWORD)
    pg.get_by_role("button", name="Sign in", exact=True).click()
    pg.wait_for_url("**/dashboard", timeout=30000)
    pg.wait_for_load_state("networkidle")
    snap(pg, "dashboard")

    # 2. Calendar: week view, next week
    pg.goto(BASE + "/calendar", wait_until="networkidle")
    pg.get_by_role("tab", name="Week").or_(pg.get_by_role("button", name="Week")).first.click()
    pause(pg)
    snap(pg, "calendar_this_week")
    # 3. Complete a past booking (backend refuses completing future ones)
    assert open_confirmed(pg), "no confirmed booking left (re-run mock_data.sql)"
    snap(pg, "booking_detail")
    pg.get_by_role("dialog").get_by_role("button", name="Complete").click()
    pause(pg, 1500)
    snap(pg, "booking_completed")
    pg.wait_for_selector("[role=dialog]", state="detached", timeout=10000)

    # 4. Cancel a future booking next week
    pg.get_by_role("button", name="Next").first.click()
    pause(pg, 1200)
    snap(pg, "calendar_next_week")
    if open_confirmed(pg):
        pg.get_by_role("dialog").get_by_role("button", name="Cancel booking").click()
        pause(pg)
        snap(pg, "cancel_confirm")
        pg.get_by_role("dialog").filter(has_text="Cancel this booking?").get_by_role("button", name="Cancel booking").click()
        pause(pg, 1500)
        snap(pg, "booking_cancelled")

    # 5. Analytics
    pg.goto(BASE + "/analytics", wait_until="networkidle")
    pause(pg, 1200)
    snap(pg, "analytics_30d")
    pg.get_by_role("button", name="Last 90 days").click()
    pause(pg, 1500)
    pg.screenshot(path=str(OUT / f"{step + 1:02d}_analytics_90d.png"), full_page=True)
    step += 1
    print("shot", step, "analytics_90d")

    # 6. Quote request: open, send quote
    pg.goto(BASE + "/quotes", wait_until="networkidle")
    snap(pg, "quotes_list")
    pg.get_by_role("tab", name="Pending").click()
    pause(pg)
    pg.locator("main").get_by_text("Pending", exact=True).last.click()
    pause(pg)
    snap(pg, "quote_detail")
    pg.get_by_role("button", name="Send quote").click()
    pause(pg)
    pg.get_by_label("Price").fill("85")
    pg.get_by_label("Message (optional)").fill("Includes cut and beard for the whole group. Valid for 14 days.")
    snap(pg, "quote_form")
    pg.get_by_role("dialog").get_by_role("button", name="Send quote").click()
    pause(pg, 1500)
    snap(pg, "quote_sent")

    pause(pg, 1000)
    video = pg.video
    ctx.close()
    webm = Path(video.path())
    browser.close()

mp4 = OUT / "owner_demo.mp4"
try:
    import imageio_ffmpeg
    subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(webm),
         "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(mp4)],
        check=True,
    )
    print("video:", mp4)
except ImportError:
    print("video (webm only; pip install imageio-ffmpeg for mp4):", webm)
