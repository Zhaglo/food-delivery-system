from django.urls import path
from . import views

urlpatterns = [
    path('restaurants/', views.restaurant_list, name='restaurant_list'),
    path('restaurants/my/', views.my_restaurants, name='my_restaurants'),
    path('restaurants/<int:restaurant_id>/menu/', views.restaurant_menu, name='restaurant_menu'),
    path('restaurants/apply/', views.restaurant_application_create, name='restaurant_apply'),

    path(
        'restaurants/<int:restaurant_id>/menu/manage/',
        views.restaurant_menu_manage,
        name='restaurant_menu_manage',
    ),
    path(
        'restaurants/<int:restaurant_id>/menu/manage/<int:item_id>/',
        views.restaurant_menu_item_manage,
        name='restaurant_menu_item_manage',
    ),

    path(
        'restaurants/<int:restaurant_id>/sections/',
        views.restaurant_sections_manage,
        name='restaurant_sections_manage'
    ),
    path(
        'restaurants/<int:restaurant_id>/sections/<int:section_id>/',
        views.restaurant_section_item_manage,
        name='restaurant_section_item_manage'
    ),
]
