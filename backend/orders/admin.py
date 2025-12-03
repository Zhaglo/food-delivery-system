from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'restaurant', 'status', 'created_at', 'total_price')
    list_filter = ('status', 'restaurant')
    inlines = [OrderItemInline]
