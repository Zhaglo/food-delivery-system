from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.order_create, name='order_create'),
    path('orders/<int:order_id>/', views.order_detail, name='order_detail'),
]