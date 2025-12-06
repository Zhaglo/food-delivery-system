from django.urls import path
from . import views

urlpatterns = [
    path('delivery/tasks/', views.delivery_task_list, name='delivery_task_list'),
    path(
        'delivery/tasks/<int:task_id>/status/',
        views.delivery_task_change_status,
        name='delivery_task_change_status'
    ),
    path('delivery/courier/apply/', views.courier_application_create, name='courier_apply'),
]
