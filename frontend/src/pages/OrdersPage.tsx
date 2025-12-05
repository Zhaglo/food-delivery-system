import { useEffect, useState } from "react";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";

type Order = {
  id: number;
  status: string;
  restaurant_id: number;
  delivery_address: string;
  total_price: string;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/")
      .then(setOrders)
      .catch((err: any) => setError(err?.data?.detail || "Ошибка загрузки заказов"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Мои заказы"
        subtitle="История заказов текущего клиента."
      />

      {loading && (
        <div className="text-sm text-slate-500">Загрузка...</div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-700">
                Заказ{" "}
                <span className="font-semibold text-slate-900">#{o.id}</span>
              </div>
              <StatusBadge status={o.status} kind="order" />
            </div>
            <div className="text-sm text-slate-600">
              Сумма: <span className="font-medium">{o.total_price} ₽</span>
            </div>
            <div className="text-xs text-slate-500">
              {new Date(o.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Адрес доставки: {o.delivery_address}
            </div>
          </Card>
        ))}
        {!loading && !error && orders.length === 0 && (
          <div className="text-sm text-slate-500">
            У вас пока нет заказов.
          </div>
        )}
      </div>
    </div>
  );
}