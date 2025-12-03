from django.contrib import admin
from .models import CourierProfile, DeliveryTask

@admin.register(DeliveryTask)
class DeliveryTaskAdmin(admin.ModelAdmin):
    list_display = ('order', 'courier', 'status', 'assigned_at', 'completed_at')
    list_filter = ('status',)


@admin.register(CourierProfile)
class CourierProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'vehicle_type', 'is_active')
    list_filter = ('vehicle_type', 'is_active')
