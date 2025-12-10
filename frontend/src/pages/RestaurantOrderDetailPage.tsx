import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Clock, MapPin, ArrowLeft, ReceiptRussianRuble } from "lucide-react";

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

// те же статусы, что и на канбан-доске
const STATUSES = ["NEW", "COOKING", "READY", "ON_DELIVERY", "DELIVERED", "CANCELLED"] as const;
type StatusType = (typeof STATUSES)[number];

const STATUS_LABEL: Record<StatusType, string> = {
  NEW: "Новый",
  COOKING: "Готовится",
  READY: "Готов",
  ON_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_FLOW: Record<StatusType, StatusType[]> = {
  NEW: ["COOKING", "CANCELLED"],
  COOKING: ["READY", "CANCELLED"],
  READY: ["ON_DELIVERY", "CANCELLED"],
  ON_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function statusBadgeClasses(status: StatusType) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "NEW":
      return `${base} bg-sky-100 text-sky-700`;
    case "COOKING":
      return `${base} bg-amber-100 text-amber-700`;
    case "READY":
      return `${base} bg-emerald-100 text-emerald-700`;
    case "ON_DELIVERY":
      return `${base} bg-indigo-100 text-indigo-700`;
    case "DELIVERED":
      return `${base} bg-green-100 text-green-700`;
    case "CANCELLED":
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function minutesFromNow(iso: string) {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin <= 0) return "только что";
  if (diffMin === 1) return "минуту назад";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const hours = Math.floor(diffMin / 60);
  return `${hours} ч назад`;
}

export default function RestaurantOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

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

  const totalItems = useMemo(
    () => order?.items.reduce((sum, it) => sum + it.quantity, 0) ?? 0,
    [order],
  );

  async function changeStatus(next: StatusType) {
    if (!order) return;
    setSavingStatus(true);
    try {
      await api.patch(`/orders/${order.id}/status/`, { status: next });
      // перезагружаем свежие данные заказа
      const updated = await api.get(`/orders/${order.id}/`);
      setOrder(updated);
      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка смены статуса");
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!order) {
    return <div className="text-sm text-slate-500">Заказ не найден</div>;
  }

  const statusTyped = (order.status as StatusType);
  const nextStatuses = STATUS_FLOW[statusTyped] || [];

  return (
    <div className="pace-y-6 max-w-4xl mx-auto">
      {/* Заголовок + назад */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <ReceiptRussianRuble className="h-5 w-5 text-blue-600" />
          <span>Заказ #{order.id}</span>
        </h1>
        <Link
          to="/restaurant/orders"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Назад к заказам</span>
        </Link>
      </div>

      {/* Основная карточка с инфой по заказу */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">Статус:&nbsp;</span>
            <span className={statusBadgeClasses(statusTyped)}>
              {STATUS_LABEL[statusTyped]}
            </span>
          </div>

          <div className="flex flex-col items-end text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(order.created_at)}
            </span>
            <span>{minutesFromNow(order.created_at)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <div className="font-medium text-slate-700 mb-1">
              Доставка
            </div>
            <div className="text-slate-600 flex items-start gap-1 text-sm">
              <MapPin className="h-4 w-4 mt-[2px] text-slate-400" />
              <span>{order.delivery_address}</span>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="font-medium text-slate-700 mb-1">
              Сумма заказа
            </div>
            <div className="text-lg font-semibold text-slate-900">
              {order.total_price} ₽
            </div>
            <div className="text-xs text-slate-500">
              Позиции: {totalItems}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Клиент ID: {order.client_id}
        </div>

        {/* Быстрые действия по смене статуса */}
        {nextStatuses.length > 0 && (
          <div className="pt-2 border-t border-slate-100 mt-2">
            <div className="text-xs font-medium text-slate-700 mb-1">
              Быстрая смена статуса
            </div>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((next) => (
                <button
                  key={next}
                  onClick={() => changeStatus(next)}
                  disabled={savingStatus}
                  className="px-3 py-1 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {STATUS_LABEL[next]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Состав заказа */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
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
                    Кол-во: {item.quantity}
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