import re
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "reports" / "wizard"
OUT.mkdir(parents=True, exist_ok=True)
BASE, API = "http://localhost:3000", "http://localhost:8080"
SLUG = "demo-barbearia-central"


def run(label, vp):
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport=vp)
        pg = ctx.new_page()
        pg.goto(f"{BASE}/b/{SLUG}/booking", wait_until="networkidle")
        pg.get_by_text("Corte de Cabelo").first.click()
        pg.wait_for_timeout(900)
        pg.screenshot(path=str(OUT / f"{label}_2_staff.png"))
        pg.locator("main ul li button").first.click()
        pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / f"{label}_3_when.png"))
        slots = pg.locator("button").filter(has_text=re.compile(r"^\d\d:\d\d$"))
        print(label, "slots", slots.count())
        if slots.count():
            slots.first.click()
            pg.wait_for_timeout(1000)
            pg.screenshot(path=str(OUT / f"{label}_4_details.png"), full_page=True)
        b.close()


run("desktop", dict(width=1440, height=900))
run("mobile", dict(width=390, height=844))

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport=dict(width=1440, height=900))
    print("login", ctx.request.post(f"{API}/api/v1/auth/login", data={"email": "demo.owner4@example.com", "password": "Password123!"}).status)
    pg = ctx.new_page()
    pg.goto(f"{BASE}/onboarding", wait_until="networkidle")
    pg.wait_for_timeout(900)
    print(pg.url)
    pg.screenshot(path=str(OUT / "desktop_onboarding.png"), full_page=True)
    b.close()
