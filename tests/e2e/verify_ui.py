from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "reports"
BASE = "http://localhost:3000"
API = "http://localhost:8080"

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport=dict(width=1440, height=900))
    r = ctx.request.post(f"{API}/api/v1/auth/login", data={"email": "demo.owner1@example.com", "password": "Password123!"})
    print("login", r.status)
    pg = ctx.new_page()
    logs = []
    pg.on("console", lambda m: logs.append((m.type, m.text[:200])) if m.type in ("error", "warning") else None)

    pg.goto(BASE + "/login", wait_until="networkidle")
    print("login redirect ->", pg.url)

    pg.goto(BASE + "/calendar", wait_until="networkidle")
    pg.wait_for_timeout(1000)
    pg.screenshot(path=str(OUT / "v_calendar.png"))
    print("calendar console:", [l for l in logs if "ydrat" in l[1] or "didn't match" in l[1]])

    pg.goto(BASE + "/services", wait_until="networkidle")
    btn = pg.get_by_role("button", name="New service")
    if btn.count() == 0:
        btn = pg.get_by_role("button", name="Novo serviço")
    btn.first.click()
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "v_dialog.png"))
    dlg = pg.locator("[role=dialog]")
    escaped = 0
    for i in range(20):
        pg.keyboard.press("Tab")
        inside = pg.evaluate("() => !!document.activeElement.closest('[role=dialog]')")
        if not inside:
            escaped += 1
    print("focus escapes in 20 tabs:", escaped)
    pg.keyboard.press("Escape")

    pg.goto(BASE + "/manage-booking?token=garbage", wait_until="networkidle")
    pg.screenshot(path=str(OUT / "v_token.png"))
    pg.goto(BASE + "/manage-booking", wait_until="networkidle")
    print("token page text:", pg.locator("main").inner_text()[:200].replace("\n", " | "))

    pg.goto(BASE + "/b/demo-barbearia-central", wait_until="networkidle")
    print("public header landmark:", pg.locator("header select").count())
    sel = pg.locator("header select")
    if sel.count():
        sel.first.focus()
        pg.keyboard.press("Tab")
        pg.keyboard.press("Shift+Tab")
        pg.screenshot(path=str(OUT / "v_public.png"))
    print("errors:", [l for l in logs if l[0] == "error"][:5])
    b.close()
