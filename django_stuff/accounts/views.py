# accounts/views.py
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.generic import CreateView
from django.views.decorators.csrf import ensure_csrf_cookie

from .forms import SignUpForm
from .models import Combined_Orders, Restaurant
import statistics


class SignUpView(CreateView):
    form_class = SignUpForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"

# Django defning the endpoint
def order_meta(request):
    days = (
        Combined_Orders.objects.exclude(date__isnull=True)
        .order_by("date")
        .values_list("date", flat=True)
        .distinct()
    )
    restaurants = (
        Restaurant.objects.order_by("restaurant_id")
        .values_list("restaurant", flat=True)
    )
    return JsonResponse({
        "days": [d.isoformat() for d in days],
        "restaurants": list(restaurants),
    })

# Django defning the endpoint
def order_data(request):
    qs = Combined_Orders.objects.filter(
        date__isnull=False,
        number_of_orders__isnull=False,
        avg_bump_time__isnull=False,
        restaurant__isnull=False,
        time_period_hour__isnull=False,
    )
    start, end = request.GET.get("start"), request.GET.get("end")
    if start:
        qs = qs.filter(date__gte=start)
    if end:
        qs = qs.filter(date__lte=end)

    method = request.GET.get("method", "all").lower()

    if method != "all":
        qs = qs.filter(order_method__order_type__iexact=method)

    if request.GET.get("outliers") == "exclude":
        values = sorted(float(v) for v in qs.values_list("avg_bump_time", flat=True))
        if len(values) >= 4:
            q1, _, q3 = statistics.quantiles(values, n=4)
            spread = q3 - q1
            qs = qs.filter(
                avg_bump_time__gte=q1 - 1.5 * spread,
                avg_bump_time__lte=q3 + 1.5 * spread,
            )

    weighted = ExpressionWrapper(
        F("number_of_orders") * F("avg_bump_time"),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )
    grouped = (
        qs.values("date", "time_period_hour_id", "restaurant__restaurant")
        .annotate(orders=Sum("number_of_orders"), weighted=Sum(weighted))
        .order_by("date", "time_period_hour_id")
    )

    rows = [
        {
            "date": g["date"].isoformat(),
            "hour": g["time_period_hour_id"],
            "restaurant": g["restaurant__restaurant"],
            "orders": g["orders"],
            "bumpMinutes": float(g["weighted"]) / g["orders"] if g["orders"] else 0,
        }
        for g in grouped
    ]
    return JsonResponse(rows, safe=False)

@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"ok": True})