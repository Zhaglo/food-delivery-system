from django.urls import path
from . import views

urlpatterns = [
    path('restaurants/', views.restaurant_list, name='restaurant_list'),
    path('restaurants/<int:restaurant_id>/menu/', views.restaurant_menu, name='restaurant_menu'),
]