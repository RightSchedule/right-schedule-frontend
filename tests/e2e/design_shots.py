import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "reports"
OUT.mkdir(exist_ok=True)
BASE = "http://localhost:3000"
API = "http://localhost:8080"
EMAIL = sys.argv[1] if len(sys.argv) > 1 else "demo.owner1@example.com"
PASSWORD = "Password123!"
SLUG = sys.argv[2] if len(sys.argv) > 2 else "demo-barbearia-central"

SHOTS = [
    ("02_dashboard", "/dashboard"), ("03_calendar", "/calendar"),
    ("04_review", "/review"), ("05_customers", "/customers"), ("06_services", "/services"),
    ("07_staff", "/staff"), ("08_analytics", "/analytics"), ("09_quotes", "/quotes"),
    ("10_settings", "/settings"), ("11_public_landing", f"/b/{SLUG}"),
    ("12_public_booking", f"/b/{SLUG}/booking"), ("13_public_quote", f"/b/{SLUG}/quote"),
]
MOBILE = ("01_login", "02_dashboard", "03_calendar", "11_public_landing", "12_public_booking")


def shoot(pg, label, name, path):
    try:
        pg.goto(BASE + path, wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(900)
        pg.screenshot(path=str(OUT / f"{label}_{name}.png"), full_page=(name == "08_analytics"))
        print("ok", label, name, pg.url)
    except Exception as e:
        print("FAIL", label, name, str(e)[:120])


with sync_playwright() as p:
    browser = p.chromium.launch()
    for label, vp in [("desktop", dict(width=1440, height=900)), ("mobile", dict(width=390, height=844))]:
        anon = browser.new_context(viewport=vp)
        shoot(anon.new_page(), label, "01_login", "/login")
        anon.close()

        ctx = browser.new_context(viewport=vp)
        res = ctx.request.post(f"{API}/api/v1/auth/login", data={"email": EMAIL, "password": PASSWORD})
        print("login", res.status)
        pg = ctx.new_page()
        for name, path in SHOTS:
            if label == "mobile" and name not in MOBILE:
                continue
            shoot(pg, label, name, path)
        ctx.close()
    browser.close()
