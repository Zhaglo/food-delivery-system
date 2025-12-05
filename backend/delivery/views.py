import json

from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt

from .models import DeliveryTask, CourierProfile
from users.models import User


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return None


def delivery_task_list(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    user: User | None = request.user if request.user.is_authenticated else None
    if user is None:
        return JsonResponse({'detail': 'Authentication required'}, status=401)

    qs = DeliveryTask.objects.select_related('order', 'courier__user')

    if user.role == User.Roles.COURIER:
        try:
            courier_profile = CourierProfile.objects.get(user=user)
        except CourierProfile.DoesNotExist:
            return JsonResponse({'detail': 'Courier profile not found'}, status=404)
        qs = qs.filter(courier=courier_profile)
    elif user.role == User.Roles.ADMIN:
        pass
    else:
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    data = []
    for task in qs.order_by('status', '-assigned_at'):
        data.append(
            {
                'id': task.id,
                'order_id': task.order_id,
                'status': task.status,
                'courier_id': task.courier_id,
                'client_id': task.order.client_id,
                'restaurant_id': task.order.restaurant_id,
                'delivery_address': task.order.delivery_address,
            }
        )

    return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})


@csrf_exempt
def delivery_task_change_status(request, task_id: int):
    if request.method != 'PATCH':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    user: User | None = request.user if request.user.is_authenticated else None
    if user is None:
        return JsonResponse({'detail': 'Authentication requiered'}, status=401)

    try:
        task = DeliveryTask.objects.select_related('courier__user').get(pk=task_id)
    except DeliveryTask.DoesNotExist:
        return Http404('Delivery task not found')

    if user.role == User.Roles.COURIER:
        if task.courier is None or task.courier.user_id != user.id:
            return JsonResponse({'detail': 'Forbidden'}, status=403)
    elif user.role != User.Roles.ADMIN:
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    data = _parse_json(request)
    if data is None:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    new_status = data.get('status')
    if new_status not in DeliveryTask.Status.values:
        return JsonResponse(
            {'detail': f'Invalid status. Allowed: {list(DeliveryTask.Status.values)}'},
            status=400
        )

    task.status = new_status
    task.save()

    return JsonResponse(
        {
            'id': task.id,
            'status': task.status,
        },
        json_dumps_params={'ensure_ascii': False}
    )
