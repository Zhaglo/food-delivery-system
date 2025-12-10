// src/pages/OrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { ChevronDown, Clock, MapPin, UtensilsCrossed } from "lucide-react";

type OrderItemShort = {
  id: number;
  menu_item_id: number;
  name: string;
  quantity: number;
  line_total: string;
};

type Order = {
  id: number;
  status: string;
  restaurant_id: number;
  restaurant_name?: string;
  delivery_address: string;
  total_price: string;
  created_at: string;
  items?: OrderItemShort[]; // фронт выдержит, даже если бэкенд не вернёт
};

const ACTIVE_STATUSES = ["NEW", "COOKING", "READY", "ON_DELIVERY"] as const;
const HISTORY_STATUSES = ["DELIVERED", "CANCELLED"] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    api
      .get("/orders/")
      .then((data) => {
        setOrders(data);
        setError(null);
      })
      .catch((err: any) =>
        setError(err?.data?.detail || "Ошибка загрузки заказов"),
      )
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = useMemo(
    () =>
      orders
        .filter((o) =>
          ACTIVE_STATUSES.includes(
            o.status as (typeof ACTIVE_STATUSES)[number],
          ),
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        ),
    [orders],
  );

  const historyOrders = useMemo(
    () =>
      orders
        .filter((o) =>
          HISTORY_STATUSES.includes(
            o.status as (typeof HISTORY_STATUSES)[number],
          ),
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        ),
    [orders],
  );

  function renderOrderCard(o: Order, compact: boolean = false) {
    const createdAt = new Date(o.created_at);
    const createdLabel = isNaN(createdAt.getTime())
      ? o.created_at
      : createdAt.toLocaleString();

    const items = o.items || [];
    const itemsPreview = items.slice(0, 3);
    const moreCount =
      items.length > itemsPreview.length
        ? items.length - itemsPreview.length
        : 0;

    return (
      <Card key={o.id} className="space-y-3">
        {/* Верхняя строка: номер заказа + статус */}
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm text-slate-700">
            Заказ{" "}
            <span className="font-semibold text-slate-900">#{o.id}</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Ресторан:{" "}
              <span className="font-medium text-slate-900">
                {o.restaurant_name || `Ресторан #${o.restaurant_id}`}
              </span>
            </span>
          </div>
          <StatusBadge status={o.status} kind="order" />
        </div>

        {/* Время + сумма */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{createdLabel}</span>
          </span>
          <span className="text-sm text-slate-700">
            Сумма:{" "}
            <span className="font-semibold text-slate-900">
              {o.total_price} ₽
            </span>
          </span>
        </div>

        {/* Адрес */}
        <div className="text-xs text-slate-600 flex items-start gap-1">
          <MapPin className="h-3 w-3 mt-[2px]" />
          <span className="break-words">{o.delivery_address}</span>
        </div>

        {/* Превью состава заказа (если есть items) */}
        {items.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 space-y-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
              <UtensilsCrossed className="h-3 w-3" />
              <span>Состав заказа</span>
            </div>
            {itemsPreview.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs text-slate-700"
              >
                <span className="truncate">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-slate-500">
                  {item.line_total} ₽
                </span>
              </div>
            ))}
            {moreCount > 0 && (
              <div className="text-[11px] text-slate-400">
                + ещё {moreCount} позиц{moreCount === 1 ? "ия" : "ии"}
              </div>
            )}
          </div>
        )}

        {/* Низ карточки: ссылка на детали */}
        <div className="flex items-center justify-end pt-1">
          <Link
            to={`/orders/${o.id}`}
            className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            {compact ? "Подробнее" : "Подробнее о заказе"}
            <span className="inline-block h-3 w-3 border-t border-r border-blue-600 rotate-45" />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {loading && (
        <div className="text-sm text-slate-500">Загрузка...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Текущие заказы */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Текущие заказы
        </h2>

        {!loading && activeOrders.length === 0 && (
          <div className="text-sm text-slate-500">
            У вас нет активных заказов.
          </div>
        )}

        {activeOrders.map((o) => renderOrderCard(o))}
      </section>

      {/* История заказов */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm"
        >
          <span className="font-semibold text-slate-900">
            История заказов (доставленные и отменённые)
          </span>
          <span className="flex items-center gap-3 text-xs text-slate-500">
            <span>Всего: {historyOrders.length}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isHistoryOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isHistoryOpen && (
          <div className="border-t border-slate-200 px-4 py-3 space-y-3">
            {historyOrders.length === 0 ? (
              <div className="text-sm text-slate-500">
                История заказов пуста.
              </div>
            ) : (
              historyOrders.map((o) => renderOrderCard(o, true))
            )}
          </div>
        )}
      </section>

      {!loading && !error && orders.length === 0 && (
        <div className="text-sm text-slate-500">
          У вас пока нет заказов.
        </div>
      )}
    </div>
  );
}