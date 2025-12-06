import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

type OrderItem = {
  id: number;
  menu_item_id: number;
  name: string;
  quantity: number;
  price: string;
  line_total: string;
};

type OrderDetail = {
  id: number;
  status: string;
  client_id: number;
  restaurant_id: number;
  delivery_address: string;
  total_price: string;
  created_at: string;
  items: OrderItem[];
};

export default function RestaurantOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/orders/${id}/`)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err: any) => {
        setError(err?.data?.detail || "Ошибка загрузки заказа");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-sm text-slate-500">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-sm text-slate-500">
        Заказ не найден
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Заказ #{order.id}
        </h1>
        <Link
          to="/restaurant/orders"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Назад к заказам
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <div className="text-sm">
          <span className="font-medium">Статус: </span>
          <span>{order.status}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Адрес доставки: </span>
          <span>{order.delivery_address}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Сумма заказа: </span>
          <span>{order.total_price} ₽</span>
        </div>
        <div className="text-xs text-slate-500">
          Создан: {new Date(order.created_at).toLocaleString()}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          Состав заказа
        </h2>
        {order.items.length === 0 ? (
          <div className="text-sm text-slate-500">
            В заказе нет позиций.
          </div>
        ) : (
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    x{item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-900">
                    {item.line_total} ₽
                  </div>
                  <div className="text-xs text-slate-400">
                    {item.price} ₽ / шт
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}