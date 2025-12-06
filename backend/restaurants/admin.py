from django.contrib import admin
from .models import Restaurant, MenuItem, MenuSection, RestaurantApplication

class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 0


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'address')
    search_fields = ('name', 'address')


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'price', 'is_available')
    list_filter = ('restaurant', 'is_available')
    search_fields = ('name',)


@admin.register(RestaurantApplication)
class RestaurantApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "restaurant_name", "contact_name", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("restaurant_name", "contact_name", "contact_phone", "comment")
    readonly_fields = ("created_at", "processed_at")


@admin.register(MenuSection)
class MenuSectionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "restaurant", "ordering")
    list_filter = ("restaurant",)
    search_fields = ("name", "restaurant__name")
    inlines = [MenuItemInline]
