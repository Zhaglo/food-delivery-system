import json
from decimal import Decimal

from django.db import transaction
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from users.models import User
from orders.models import Order, OrderItem
from restaurants.models import Restaurant, MenuItem


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return None


@csrf_exempt
def order_list_or_create(request):
    user: User | None = request.user if request.user.is_authenticated else None

    if request.method == 'GET':
        if user is None:
            return JsonResponse({'detail': 'Authentication required'}, status=401)

        qs = Order.objects.select_related('client', 'restaurant').prefetch_related('items__menu_item').all()

        if user.role == User.Roles.CLIENT:
            qs = qs.filter(client=user)
        elif user.role == User.Roles.RESTAURANT:
            qs = qs.filter(restaurant__owner=user)
        elif user.role == User.Roles.COURIER:
            qs = qs.filter(delivery_task__courier__user=user)
        else:
            pass # Админ видит всё

        data = []
        for order in qs.order_by('-created_at'):
            items_data = []
            for item in order.items.all():
                items_data.append(
                    {
                        'id': item.id,
                        'menu_item_id': item.menu_item_id,
                        'name': item.menu_item.name,
                        'quantity': item.quantity,
                        'price': str(item.price_at_moment),
                        'line_total': str(item.get_total()),
                    }
                )
            data.append(
                {
                    'id': order.id,
                    'status': order.status,
                    'client_id': order.client_id,
                    'restaurant_id': order.restaurant_id,
                    'delivery_address': order.delivery_address,
                    'total_price': str(order.total_price),
                    'created_at': order.created_at.isoformat(),
                    'items': items_data,
                }
            )
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})

    if request.method == 'POST':
        return _order_create(request, user)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


def _order_create(request, user: User | None):
    if user is None or not request.user.is_authenticated:
        return JsonResponse({'detail': 'Authentication required'}, status=401)

    if user.role != User.Roles.CLIENT:
        return JsonResponse({'detail': 'Only clients can create orders'}, status=403)

    data = _parse_json(request)
    if data is None:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    required_fields = ['restaurant_id', 'delivery_address', 'items']
    for field in required_fields:
        if field not in data:
            return JsonResponse({'detail': f'Missing field: {field}'}, status=400)

    restaurant_id = data['restaurant_id']
    delivery_address = data['delivery_address']
    items_data = data['items']

    if not isinstance(items_data, list) or not items_data:
        return JsonResponse({'detail': 'Items must be a non-empty list'}, status=400)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({'detail': 'Restaurant not found'}, status=404)

    with transaction.atomic():
        order = Order.objects.create(
            client=user,
            restaurant=restaurant,
            delivery_address=delivery_address,
            status=Order.Status.NEW,
            total_price=Decimal("0.00"),
        )

        total_price = Decimal("0.00")
        items_response = []

        for item in items_data:
            try:
                menu_item_id = item['menu_item_id']
                quantity = int(item.get('quantity', 1))
            except (KeyError, ValueError, TypeError):
                transaction.set_rollback(True)
                return JsonResponse({'detail': 'Invalid item format'}, status=400)

            if quantity <= 0:
                transaction.set_rollback(True)
                return JsonResponse({'detail': 'Quantity must be positive'}, status=400)

            try:
                menu_item = MenuItem.objects.get(pk=menu_item_id, restaurant=restaurant)
            except MenuItem.DoesNotExist:
                transaction.set_rollback(True)
                return JsonResponse(
                    {'detail': f'Menu item {menu_item_id} not found for this restaurant'},
                    status=404
                )

            price = menu_item.price
            line_total = price * quantity
            total_price += line_total

            order_item = OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=quantity,
                price_at_moment=price,
            )

            items_response.append(
                {
                    'id': order_item.id,
                    'menu_item_id': menu_item.id,
                    'name': menu_item.name,
                    'quantity': quantity,
                    'price': str(price),
                    'line_total': str(line_total),
                }
            )

        order.total_price = total_price
        order.save()

    return JsonResponse(
        {
            'id': order.id,
            'status': order.status,
            'client_id': order.client.id,
            'restaurant_id': order.restaurant.id,
            'delivery_address': order.delivery_address,
            'total_price': str(order.total_price),
            'created_at': order.created_at.isoformat(),
            'items': items_response,
        },
        status=201,
        json_dumps_params={'ensure_ascii': False}
    )


@login_required
def order_detail(request, order_id: int):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    try:
        order = (
            Order.objects
            .select_related('client', 'restaurant')
            .prefetch_related('items__menu_item')
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        raise Http404('Order not found')

    user: User = request.user

    # Админ видит всё
    if user.role != User.Roles.ADMIN:
        if user.role == User.Roles.CLIENT and order.client_id != user.id:
            return JsonResponse({'detail': 'Forbidden'}, status=403)

        if user.role == User.Roles.RESTAURANT and order.restaurant.owner_id != user.id:
            return JsonResponse({'detail': 'Forbidden'}, status=403)

        if user.role == User.Roles.COURIER:
            # у заказа может не быть задачи доставки или курьера
            if not hasattr(order, 'delivery_task') or order.delivery_task.courier is None:
                return JsonResponse({'detail': 'Forbidden'}, status=403)
            if order.delivery_task.courier.user_id != user.id:
                return JsonResponse({'detail': 'Forbidden'}, status=403)

    items_response = []
    for item in order.items.all():
        items_response.append(
            {
                'id': item.id,
                'menu_item_id': item.menu_item.id,
                'name': item.menu_item.name,
                'quantity': item.quantity,
                'price': str(item.price_at_moment),
                'line_total': str(item.get_total()),
            }
        )

    return JsonResponse(
        {
            'id': order.id,
            'status': order.status,
            'client_id': order.client.id,
            'restaurant_id': order.restaurant.id,
            'delivery_address': order.delivery_address,
            'total_price': str(order.total_price),
            'created_at': order.created_at.isoformat(),
            'items': items_response,
        },
        json_dumps_params={'ensure_ascii': False}
    )


@csrf_exempt
def order_change_status(request, order_id: int):
    if request.method != 'PATCH':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    user: User | None = request.user if request.user.is_authenticated else None
    if user is None:
        return JsonResponse({'detail': 'Authentication required'}, status=401)

    try:
        order = Order.objects.select_related('restaurant__owner').get(pk=order_id)
    except Order.DoesNotExist:
        raise Http404('Order not found')

    if user.role not in (User.Roles.RESTAURANT, User.Roles.ADMIN):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    if user.role == User.Roles.RESTAURANT and order.restaurant.owner_id != user.id:
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    data = _parse_json(request)
    if data is None:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    new_status = data.get('status')
    if new_status not in Order.Status.values:
        return JsonResponse(
            {'detail': f'Invalid status. Allowed: {list(Order.Status.values)}'},
            status=400
        )

    order.status = new_status
    order.save()

    return JsonResponse(
        {
            'id': order.id,
            'status': order.status,
        },
        json_dumps_params={'ensure_ascii': False}
    )
