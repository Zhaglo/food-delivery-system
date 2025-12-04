import json
from decimal import Decimal

from django.db import transaction
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt

from users.models import User
from orders.models import Order, OrderItem
from restaurants.models import Restaurant, MenuItem


@csrf_exempt
def order_create(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.decoder.JSONDecodeError:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    required_fields = ['client_id', 'restaurant_id', 'delivery_address', 'items']
    for field in required_fields:
        if field not in data:
            return JsonResponse({'detail': f'Missing field {field}'}, status=400)

    client_id = data['client_id']
    restaurant_id = data['restaurant_id']
    delivery_address = data['delivery_address']
    items_data = data['items']

    if not isinstance(items_data, list) or not items_data:
        return JsonResponse({'detail': 'Items must be a non-empty list'}, status=400)

    try:
        client = User.objects.get(pk=client_id)
    except User.DoesNotExist:
        return JsonResponse({'detail': 'Client not found'}, status=404)

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({'detail': 'Restaurant not found'}, status=404)

    with transaction.atomic():
        order = Order.objects.create(
            client=client,
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
            'client_id': client.id,
            'restaurant_id': restaurant.id,
            'delivery_address': order.delivery_address,
            'total_price': str(order.total_price),
            'created_at': order.created_at.isoformat(),
            'items': items_response,
        },
        status=201
    )

def order_detail(request, order_id):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    try:
        order = Order.objects.select_related('client', 'restaurant').prefetch_related('items__menu_item').get(
            pk=order_id
        )
    except Order.DoesNotExist:
        raise Http404('Order not found')

    items_response = []
    for item in order.items.all():
        items_response.append(
            {
                'id': item.id,
                'menu_item_id': item.menu_item_id,
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
        }
    )
