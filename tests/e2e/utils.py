"""Shared helpers for the right-schedule-test agents (API calls, auth, bug reporting)."""
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path

import requests

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:3000")
API_URL = os.environ.get("E2E_API_URL", "http://localhost:8080")
API = f"{API_URL}/api/v1"
PASSWORD = "Password123!"
COOKIE_NAME = "access_token"

OWNER1 = "demo.owner1@example.com"  # Barbearia Central (pt), slug demo-barbearia-central
OWNER2 = "demo.owner2@example.com"  # Studio Bella (en), slug demo-studio-bella
OWNER3 = "demo.owner3@example.com"  # Clinica Fisio Porto (pt), slug demo-clinica-fisio-porto
OWNER4 = "demo.owner4@example.com"  # no business yet
STAFF1 = "demo.staff1@example.com"  # linked to Miguel (owner1 business)
SLUGS = {
    OWNER1: "demo-barbearia-central",
    OWNER2: "demo-studio-bella",
    OWNER3: "demo-clinica-fisio-porto",
}

HERE = Path(__file__).parent
REPORTS = HERE / "reports"
TOKEN_CACHE = HERE / ".tokens.json"
REPORTS.mkdir(exist_ok=True)

SEVERITIES = ("CRITICAL", "HIGH", "MEDIUM", "LOW")


def _sleep_on_429(resp):
    """Honour Retry-After once (capped) so parallel agents do not trip the per-IP rate limit."""
    try:
        wait = min(int(resp.headers.get("Retry-After", "5")), 65)
    except ValueError:
        wait = 5
    time.sleep(wait + 1)


def login_raw(email, password=PASSWORD):
    """Plain login, no caching, no retry. Returns the requests.Response."""
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)


def _cookie_from(resp):
    token = resp.cookies.get(COOKIE_NAME)
    if token:
        return token
    match = re.search(rf"{COOKIE_NAME}=([^;]+)", resp.headers.get("Set-Cookie", ""))
    return match.group(1) if match else None


def get_token(email, password=PASSWORD):
    """JWT for a user, cached on disk so agents log in once per run (login is rate limited)."""
    cache = json.loads(TOKEN_CACHE.read_text(encoding="utf-8")) if TOKEN_CACHE.exists() else {}
    if email in cache:
        return cache[email]
    for _ in range(3):
        resp = login_raw(email, password)
        if resp.status_code == 429:
            _sleep_on_429(resp)
            continue
        token = _cookie_from(resp)
        if resp.status_code != 200 or not token:
            raise RuntimeError(f"login failed for {email}: {resp.status_code} {resp.text[:200]}")
        cache = json.loads(TOKEN_CACHE.read_text(encoding="utf-8")) if TOKEN_CACHE.exists() else {}
        cache[email] = token
        TOKEN_CACHE.write_text(json.dumps(cache), encoding="utf-8")
        return token
    raise RuntimeError(f"login rate limited for {email}")


def authed_cookies(email, password=PASSWORD):
    """Cookie list for Playwright `context.add_cookies(...)`; cookies ignore ports, so it works for :3000 and :8080."""
    return [{"name": COOKIE_NAME, "value": get_token(email, password), "domain": "localhost", "path": "/"}]


def locale_cookie(locale="en"):
    return {"name": "NEXT_LOCALE", "value": locale, "domain": "localhost", "path": "/"}


class APIClient:
    """requests wrapper bound to one user. Paths are relative to /api/v1. Retries once on 429."""

    def __init__(self, email=OWNER1, password=PASSWORD, authenticated=True):
        self.email = email
        self.session = requests.Session()
        if authenticated:
            self.session.headers["Authorization"] = f"Bearer {get_token(email, password)}"

    def request(self, method, path, **kwargs):
        kwargs.setdefault("timeout", 20)
        url = path if path.startswith("http") else f"{API}{path}"
        resp = self.session.request(method, url, **kwargs)
        if resp.status_code == 429:
            _sleep_on_429(resp)
            resp = self.session.request(method, url, **kwargs)
        return resp

    def get(self, path, **kw):
        return self.request("GET", path, **kw)

    def post(self, path, **kw):
        return self.request("POST", path, **kw)

    def put(self, path, **kw):
        return self.request("PUT", path, **kw)

    def patch(self, path, **kw):
        return self.request("PATCH", path, **kw)

    def delete(self, path, **kw):
        return self.request("DELETE", path, **kw)


def public_get(path, **kw):
    kw.setdefault("timeout", 20)
    return requests.get(f"{API}{path}", **kw)


def public_post(path, **kw):
    kw.setdefault("timeout", 20)
    return requests.post(f"{API}{path}", **kw)


def business_of(email):
    """The caller's own business (id, slug, timezone, ...)."""
    return APIClient(email).get("/business/me").json()


def _report_path(domain):
    return REPORTS / f"bugs_{domain}.md"


def start_domain_report(domain, title):
    _report_path(domain).write_text(
        f"# {title}\n\nStarted: {datetime.now().isoformat(timespec='seconds')}\n\n", encoding="utf-8"
    )


def log_bug(domain, title, severity, description="", endpoint="", status_code="", steps="", expected="", actual=""):
    """Append a bug to bugs_<domain>.md. Severity: CRITICAL | HIGH | MEDIUM | LOW."""
    if severity not in SEVERITIES:
        raise ValueError(f"severity must be one of {SEVERITIES}")
    lines = [f"## [{severity}] {title}", ""]
    for label, value in (
        ("Endpoint/Page", endpoint),
        ("Status", status_code),
        ("Description", description),
        ("Steps", steps),
        ("Expected", expected),
        ("Actual", actual),
    ):
        if value != "" and value is not None:
            lines.append(f"- **{label}:** {value}")
    lines += ["", "---", ""]
    with _report_path(domain).open("a", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"BUG [{severity}] {title}")


def log_note(domain, text):
    """Observation that is not strictly a bug (inconsistent error shape, missing header, ...)."""
    with _report_path(domain).open("a", encoding="utf-8") as fh:
        fh.write(f"- NOTE: {text}\n")


def write_summary(domain, tests_run, bugs_found, observations=""):
    with _report_path(domain).open("a", encoding="utf-8") as fh:
        fh.write(f"\n# Summary\n\n- Tests run: {tests_run}\n- Bugs found: {bugs_found}\n")
        if observations:
            fh.write(f"\n## Observations\n\n{observations}\n")
