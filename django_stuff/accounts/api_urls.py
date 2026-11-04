from django.urls import path
from . import views

urlpatterns = [
    path("order-meta/", views.order_meta),
    path("order-data/", views.order_data),
    path("csrf/", views.csrf),
    path("session/", views.session_status),
]
