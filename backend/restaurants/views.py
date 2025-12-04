from django.http import JsonResponse, Http404
from .models import Restaurant, MenuItem

def restaurant_list(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    restaurants = Restaurant.objects.all().values('id', 'name', 'address', 'description')
    return JsonResponse(list(restaurants), safe=False, json_dumps_params={'ensure_ascii': False})

def restaurant_menu(request, restaurant_id):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        raise Http404('Restaurant not found')

    items = restaurant.menu_items.all().values(
        'id', 'name', 'description', 'price', 'is_available'
    )

    return JsonResponse(
        {
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name,
                'address': restaurant.address,
            },
            'menu': list(items),
        },
        safe=False,
        json_dumps_params={'ensure_ascii': False}
    )
