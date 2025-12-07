// src/pages/OrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { ChevronDown } from "lucide-react";

type Order = {
  id: number;
  status: string;
  restaurant_id: number;
  restaurant_name?: string; // ← новое поле
  delivery_address: string;
  total_price: string;
  created_at: string;
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Мои заказы"
        subtitle="Текущие заказы и история заказов."
      />

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

        {activeOrders.map((o) => (
          <Card key={o.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-700">
                Заказ{" "}
                <span className="font-semibold text-slate-900">
                  #{o.id}
                </span>
              </div>
              <StatusBadge status={o.status} kind="order" />
            </div>

            {/* ресторан */}
            <div className="text-xs text-slate-500 mb-1">
              Ресторан:{" "}
              <span className="font-medium text-slate-900">
                {o.restaurant_name || `Ресторан #${o.restaurant_id}`}
              </span>
            </div>

            <div className="text-sm text-slate-600">
              Сумма:{" "}
              <span className="font-medium">{o.total_price} ₽</span>
            </div>
            <div className="text-xs text-slate-500">
              {new Date(o.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mb-1">
              Адрес доставки: {o.delivery_address}
            </div>

            <div className="flex justify-end">
              <Link
                to={`/orders/${o.id}`}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Подробнее →
              </Link>
            </div>
          </Card>
        ))}
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
              historyOrders.map((o) => (
                <Card key={o.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-slate-700">
                      Заказ{" "}
                      <span className="font-semibold text-slate-900">
                        #{o.id}
                      </span>
                    </div>
                    <StatusBadge status={o.status} kind="order" />
                  </div>

                  <div className="text-xs text-slate-500 mb-1">
                    Ресторан:{" "}
                    <span className="font-medium text-slate-900">
                      {o.restaurant_name || `Ресторан #${o.restaurant_id}`}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600">
                    Сумма:{" "}
                    <span className="font-medium">
                      {o.total_price} ₽
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mb-1">
                    Адрес доставки: {o.delivery_address}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      to={`/orders/${o.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Подробнее →
                    </Link>
                  </div>
                </Card>
              ))
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