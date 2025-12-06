import json
from decimal import Decimal

from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, Http404

from .models import Restaurant, MenuItem, MenuSection, RestaurantApplication
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
        'id', 'name', 'description', 'price', 'section_id', 'is_available'
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


@login_required
def my_restaurants(request):
    user: User = request.user  # type: ignore

    if user.role not in (User.Roles.RESTAURANT, User.Roles.ADMIN):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    qs = Restaurant.objects.filter(owner=user).values(
        'id', 'name', 'address', 'description'
    )

    return JsonResponse(list(qs), safe=False, json_dumps_params={'ensure_ascii': False})


@login_required
@csrf_exempt
def restaurant_menu_manage(request, restaurant_id: int):
    """
    POST: создать позицию меню для ресторана владельца.
    """
    user: User = request.user  # type: ignore

    if user.role not in (User.Roles.RESTAURANT, User.Roles.ADMIN):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({'detail': 'Restaurant not found'}, status=404)

    if user.role == User.Roles.RESTAURANT and restaurant.owner_id != user.id:
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    data = _parse_json(request)
    if data is None:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()
    price_raw = data.get('price')
    is_available = bool(data.get('is_available', True))
    section_id = data.get('section_id')

    if not name or price_raw is None:
        return JsonResponse({'detail': 'name и price обязательны'}, status=400)

    try:
        price = Decimal(str(price_raw))
    except Exception:
        return JsonResponse({'detail': 'Некорректная цена'}, status=400)

    section = None
    if section_id is not None:
        try:
            section = MenuSection.objects.get(pk=section_id, restaurant=restaurant)
        except MenuSection.DoesNotExist:
            return JsonResponse({'detail': 'Section not found'}, status=404)

    item = MenuItem.objects.create(
        restaurant=restaurant,
        section=section,
        name=name,
        description=description,
        price=price,
        is_available=is_available,
    )

    return JsonResponse(
        {
            'id': item.id,
            'section_id': item.section_id,
            'name': item.name,
            'description': item.description,
            'price': str(item.price),
            'is_available': item.is_available,
        },
        status=201,
        json_dumps_params={'ensure_ascii': False},
    )


@login_required
@csrf_exempt
def restaurant_menu_item_manage(request, restaurant_id: int, item_id: int):
    """
    PATCH: обновить (например, доступность, цену, описание)
    DELETE: удалить позицию меню
    """
    user: User = request.user  # type: ignore

    if user.role not in (User.Roles.RESTAURANT, User.Roles.ADMIN):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({'detail': 'Restaurant not found'}, status=404)

    if user.role == User.Roles.RESTAURANT and restaurant.owner_id != user.id:
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    try:
        item = MenuItem.objects.get(pk=item_id, restaurant=restaurant)
    except MenuItem.DoesNotExist:
        return JsonResponse({'detail': 'Menu item not found'}, status=404)

    if request.method == 'DELETE':
        item.delete()
        return JsonResponse({'detail': 'Deleted'}, status=204)

    if request.method == 'PATCH':
        data = _parse_json(request)
        if data is None:
            return JsonResponse({'detail': 'Invalid JSON'}, status=400)

        if 'name' in data:
            item.name = (data['name'] or '').strip()
        if 'description' in data:
            item.description = (data['description'] or '').strip()
        if 'is_available' in data:
            item.is_available = bool(data['is_available'])
        if 'price' in data:
            try:
                item.price = Decimal(str(data['price']))
            except Exception:
                return JsonResponse({'detail': 'Некорректная цена'}, status=400)
        if 'section_id' in data:
            section_id = data['section_id']
            if section_id is None:
                item.section = None
            else:
                try:
                    section = MenuSection.objects.get(pk=section_id, restaurant=restaurant)
                except MenuSection.DoesNotExist:
                    return JsonResponse({'detail': 'Section not found'}, status=404)
                item.section = section

        item.save()

        return JsonResponse(
            {
                'id': item.id,
                'section_id': item.section_id,
                'name': item.name,
                'description': item.description,
                'price': str(item.price),
                'is_available': item.is_available,
            },
            json_dumps_params={'ensure_ascii': False},
        )

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
@csrf_exempt
def restaurant_sections_manage(request, restaurant_id: int):
    """
    GET: список разделов ресторана
    POST: создать раздел
    """
    user: User = request.user  # type: ignore

    if user.role not in (User.Roles.RESTAURANT, User.Roles.ADMIN):
        return JsonResponse({"detail": "Forbidden"}, status=403)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({"detail": "Restaurant not found"}, status=404)

    if user.role == User.Roles.RESTAURANT and restaurant.owner_id != user.id:
        return JsonResponse({"detail": "Forbidden"}, status=403)

    if request.method == "GET":
        sections = restaurant.menu_sections.all().values("id", "name", "ordering")
        return JsonResponse(list(sections), safe=False, json_dumps_params={"ensure_ascii": False})

    if request.method == "POST":
        data = _parse_json(request)
        if data is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        name = (data.get("name") or "").strip()
        ordering = data.get("ordering") or 0

        if not name:
            return JsonResponse({"detail": "name обязателен"}, status=400)

        section = MenuSection.objects.create(
            restaurant=restaurant,
            name=name,
            ordering=ordering,
        )

        return JsonResponse(
            {"id": section.id, "name": section.name, "ordering": section.ordering},
            status=201,
            json_dumps_params={"ensure_ascii": False},
        )

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@login_required
@csrf_exempt
def restaurant_section_item_manage(request, restaurant_id: int, section_id: int):
    """
    PATCH: обновить раздел (например имя)
    DELETE: удалить раздел (позиции останутся без раздела)
    """
    user: User = request.user  # type: ignore

    if user.role not in (User.Roles.RESTAURANT, User.Roles.ADMIN):
        return JsonResponse({"detail": "Forbidden"}, status=403)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({"detail": "Restaurant not found"}, status=404)

    if user.role == User.Roles.RESTAURANT and restaurant.owner_id != user.id:
        return JsonResponse({"detail": "Forbidden"}, status=403)

    try:
        section = MenuSection.objects.get(pk=section_id, restaurant=restaurant)
    except MenuSection.DoesNotExist:
        return JsonResponse({"detail": "Section not found"}, status=404)

    if request.method == "DELETE":
        # Отвязываем блюда от раздела, но не удаляем сами блюда
        MenuItem.objects.filter(section=section).update(section=None)
        section.delete()
        return JsonResponse({"detail": "Deleted"}, status=204)

    if request.method == "PATCH":
        data = _parse_json(request)
        if data is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        if "name" in data:
            section.name = (data["name"] or "").strip()
        if "ordering" in data:
            section.ordering = int(data["ordering"] or 0)
        section.save()

        return JsonResponse(
            {"id": section.id, "name": section.name, "ordering": section.ordering},
            json_dumps_params={"ensure_ascii": False},
        )

    return JsonResponse({"detail": "Method not allowed"}, status=405)
