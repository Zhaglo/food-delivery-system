// src/pages/ClientOrderDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import {
  MapPin,
  Clock,
  Store,
  UtensilsCrossed,
  ArrowLeft,
} from "lucide-react";

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
  restaurant_name?: string;
  restaurant_address?: string;
  delivery_address: string;
  total_price: string;
  created_at: string;
  items: OrderItem[];
};

export default function ClientOrderDetailPage() {
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
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-sm text-slate-500">
        Заказ не найден.
      </div>
    );
  }

  const createdAt = new Date(order.created_at);
  const createdLabel = isNaN(createdAt.getTime())
    ? order.created_at
    : createdAt.toLocaleString();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Наверху: маленькая ссылка назад + заголовок с бейджем статуса */}
      <div className="space-y-2">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Назад к моим заказам</span>
        </Link>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-semibold text-slate-900">
              Заказ #{order.id}
            </h1>
          </div>
          <StatusBadge status={order.status} kind="order" />
        </div>
      </div>

      {/* Блок с информацией о ресторане, адресе и сумме */}
      <Card className="space-y-4">
        {/* Ресторан */}
        <div className="space-y-1">

          <div className="flex flex-col gap-1 text-sm text-slate-700">
            <div className="inline-flex items-center gap-2">
              {/* Иконка в фирменном синем */}
              <Store className="h-4 w-4 text-blue-500" />

              {/* Название ресторана — синий чип */}
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                {order.restaurant_name || `Ресторан #${order.restaurant_id}`}
              </span>
            </div>

            {order.restaurant_address && (
              <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                <span>{order.restaurant_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Адрес доставки */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Адрес доставки
          </div>
          <div className="text-sm text-slate-700 flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-[2px] text-slate-500" />
            <span className="break-words">{order.delivery_address}</span>
          </div>
        </div>

        {/* Время + сумма в одной строке */}
        <div className="flex items-center justify-between gap-3 pt-1 text-xs sm:text-sm">
          <div className="inline-flex items-center gap-1 text-slate-600">
            <Clock className="h-4 w-4 text-slate-500" />
            <span>Создан: {createdLabel}</span>
          </div>

          <div className="inline-flex items-baseline gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Итого
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {order.total_price} ₽
            </span>
          </div>
        </div>
      </Card>

      {/* Состав заказа */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <UtensilsCrossed className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            Состав заказа
          </h2>
        </div>

        {order.items.length === 0 ? (
          <div className="text-sm text-slate-500">
            В заказе нет позиций.
          </div>
        ) : (
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Кол-во: {item.quantity} шт.
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
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
      </Card>
    </div>
  );
}