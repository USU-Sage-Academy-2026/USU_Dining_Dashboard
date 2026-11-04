import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie


FRONTEND_MANIFEST_PATH = (
    Path(__file__).resolve().parent.parent / "static/frontend/.vite/manifest.json"
)


def home(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    return render(request, "home.html")


@login_required
@ensure_csrf_cookie
@never_cache
def dashboard(request):
    try:
        manifest = json.loads(FRONTEND_MANIFEST_PATH.read_text())
        entry = manifest["index.html"]
        dashboard_script = f"frontend/{entry['file']}"
        dashboard_stylesheets = [
            f"frontend/{stylesheet}" for stylesheet in entry.get("css", [])
        ]
    except FileNotFoundError as exc:
        raise ImproperlyConfigured(
            "The frontend build is missing. Run `npm --prefix Frontend run build`."
        ) from exc
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        raise ImproperlyConfigured(
            f"The frontend build manifest is invalid: {FRONTEND_MANIFEST_PATH}"
        ) from exc

    return render(
        request,
        "dashboard.html",
        {
            "dashboard_script": dashboard_script,
            "dashboard_stylesheets": dashboard_stylesheets,
        },
    )
