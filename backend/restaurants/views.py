import json

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, Http404

from .models import Restaurant, RestaurantApplication
from users.models import User


def _parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return None


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


@csrf_exempt
def restaurant_application_create(request):
    """
    Оставить заявку на подключение ресторана.
    Можно отправлять как гостем, так и будучи залогиненным.
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = _parse_json(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    restaurant_name = (data.get("restaurant_name") or "").strip()
    address = (data.get("address") or "").strip()
    description = (data.get("description") or "").strip()
    contact_name = (data.get("contact_name") or "").strip()
    contact_phone = (data.get("contact_phone") or "").strip()
    comment = (data.get("comment") or "").strip()

    if not restaurant_name or not address or not contact_name or not contact_phone:
        return JsonResponse(
            {"detail": "restaurant_name, address, contact_name и contact_phone обязательны"},
            status=400,
        )

    user: User | None = request.user if request.user.is_authenticated else None

    app = RestaurantApplication.objects.create(
        user=user,
        restaurant_name=restaurant_name,
        address=address,
        description=description,
        contact_name=contact_name,
        contact_phone=contact_phone,
        comment=comment,
    )

    return JsonResponse(
        {
            "id": app.id,
            "status": app.status,
            "restaurant_name": app.restaurant_name,
            "contact_name": app.contact_name,
            "contact_phone": app.contact_phone,
        },
        status=201,
        json_dumps_params={"ensure_ascii": False},
    )
