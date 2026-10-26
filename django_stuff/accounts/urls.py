# accounts/urls.py
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.http import JsonResponse

from .models import Combined_Orders, Restaurant
from django.urls import path

from .views import SignUpView


urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
]