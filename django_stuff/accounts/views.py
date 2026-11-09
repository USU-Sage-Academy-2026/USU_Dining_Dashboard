from collections import defaultdict
import statistics

from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import CreateView

from .forms import SignUpForm
from .models import Combined_Orders, Restaurant


class SignUpView(CreateView):
    form_class = SignUpForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"

# Django defning the endpoint for whats available
@login_required
def order_meta(request):
    """Return filter options sourced directly from the database."""
    days = (
        Combined_Orders.objects.exclude(date__isnull=True)
        .order_by("date")
        .values_list("date", flat=True)
        .distinct()
    )
    restaurants = (
        Restaurant.objects.exclude(restaurant__isnull=True)
        .exclude(restaurant__exact="")
        .order_by("restaurant_id")
        .values_list("restaurant", flat=True)
    )
    return JsonResponse({
        "days": [day.isoformat() for day in days],
        "restaurants": list(restaurants),
    })

# Django defning the endpoint for the actual data
@login_required
def order_data(request):
    """Return order totals and weighted bump-time metrics for dashboard filters."""
    # Keep rows with a valid order count for order-volume charts, even if aparticular row does not have a bump-time measurement.
    orders_qs = Combined_Orders.objects.filter(
        date__isnull=False,
        number_of_orders__isnull=False,
        restaurant__isnull=False,
        time_period_hour__isnull=False,
    ) # Django ORM query to filter the Combined_Orders model for valid rows

    start = request.GET.get("start")
    end = request.GET.get("end") # the query parameters defined in react through the URL is accessed here to filter the data based on the start and end dates provided by the user
    if start:
        orders_qs = orders_qs.filter(date__gte=start)
    if end:
        orders_qs = orders_qs.filter(date__lte=end)

    method = request.GET.get("method", "all").lower()
    if method != "all":
        orders_qs = orders_qs.filter(order_method__order_type__iexact=method)

    # React sends one query parameter per selected restaurant. If the
    # parameter is present but empty, return no rows rather than all restaurants.
    if "restaurants" in request.GET:
        selected_restaurants = [name for name in request.GET.getlist("restaurants") if name] # getList gets all the restaurant names instead of just one value
        if len(selected_restaurants) == 1 and "," in selected_restaurants[0]:
            selected_restaurants = [name for name in selected_restaurants[0].split(",") if name]
        if not selected_restaurants:
            return JsonResponse([], safe=False)
        orders_qs = orders_qs.filter(restaurant__restaurant__in=selected_restaurants)

    bump_qs = orders_qs.filter(avg_bump_time__isnull=False)

    # Outlier exclusion affects bump-time metrics only. Order counts remain
    # complete and are still represented in the orders-by-hour/day charts.
    if request.GET.get("outliers") == "exclude":
        values = sorted(float(value) for value in bump_qs.values_list("avg_bump_time", flat=True))
        if len(values) >= 4:
            q1, _, q3 = statistics.quantiles(values, n=4)
            spread = q3 - q1
            bump_qs = bump_qs.filter(
                avg_bump_time__gte=q1 - 1.5 * spread,
                avg_bump_time__lte=q3 + 1.5 * spread,
            )

    group_fields = ("date", "time_period_hour_id", "restaurant__restaurant")
    order_groups = (
        orders_qs.values(*group_fields) #groups the records
        .annotate(orders=Sum("number_of_orders")) # calculates the totals
        .order_by("date", "time_period_hour_id", "restaurant__restaurant")
    )

    weighted_expression = ExpressionWrapper(
        F("number_of_orders") * F("avg_bump_time"),
        output_field=DecimalField(max_digits=16, decimal_places=3),
    )
    bump_groups = (
        bump_qs.values(*group_fields)
        .annotate(
            bump_orders=Sum("number_of_orders"),
            weighted=Sum(weighted_expression),
        )
    )

    bump_by_key = {}
    for group in bump_groups:
        key = (
            group["date"],
            group["time_period_hour_id"],
            group["restaurant__restaurant"],
        )
        bump_orders = group["bump_orders"] or 0
        weighted = group["weighted"] or 0
        bump_by_key[key] = (
            float(weighted) / bump_orders if bump_orders else None
        )

    rows = []
    for group in order_groups:
        key = (
            group["date"],
            group["time_period_hour_id"],
            group["restaurant__restaurant"],
        )
        rows.append({
            "date": group["date"].isoformat(),
            "hour": group["time_period_hour_id"],
            "restaurant": group["restaurant__restaurant"],
            "orders": group["orders"] or 0,
            "bumpMinutes": bump_by_key.get(key),
        })

    return JsonResponse(rows, safe=False)


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"ok": True})


def session_status(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False}, status=401)
    return JsonResponse({"authenticated": True})