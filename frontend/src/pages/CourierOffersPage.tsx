import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";

type Offer = {
  id: number;
  order_id: number;
  status: string; // PENDING
  restaurant_id: number;
  restaurant_name: string;
  client_id: number;
  delivery_address: string;
  order_total_price: string;
  order_created_at: string;
};

export default function CourierOffersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  async function loadOffers() {
    try {
      setLoading(true);
      const data = await api.get("/delivery/offers/");
      setOffers(data);
      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка загрузки доступных доставок");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "COURIER") {
      loadOffers();
      // автообновление каждые 20 секунд
      const id = setInterval(loadOffers, 20000);
      return () => clearInterval(id);
    }
  }, [user]);

  async function handleAssign(taskId: number) {
    setError(null);
    setAssigningId(taskId);
    try {
      await api.post(`/delivery/offers/${taskId}/assign/`, {});
      // после успешного взятия просто перезагружаем список
      navigate("/courier/tasks");
//       await loadOffers();
      // можно ещё вывести тост/алерт, но пока просто оставим
    } catch (err: any) {
      alert(
        err?.data?.detail ||
          "Не удалось взять заказ. Возможно, он уже занят или у вас есть активная задача.",
      );
    } finally {
      setAssigningId(null);
    }
  }

  if (!user || user.role !== "COURIER") {
    return (
      <div className="text-sm text-slate-500">
        Страница доступна только пользователю с ролью COURIER.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Доступные заказы для доставки"
        subtitle="Свободные заказы, которые вы можете взять в работу."
      />

      {loading && (
        <div className="text-sm text-slate-500">Загрузка доступных заказов...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {offers.map((offer) => {
          const createdAt = new Date(offer.order_created_at);
          const createdLabel = isNaN(createdAt.getTime())
            ? offer.order_created_at
            : createdAt.toLocaleString();

          return (
            <Card key={offer.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-700">
                  Задача{" "}
                  <span className="font-semibold text-slate-900">
                    #{offer.id}
                  </span>{" "}
                  — заказ #{offer.order_id}
                </div>
                <StatusBadge status={offer.status} kind="delivery" />
              </div>

              <div className="text-sm text-slate-700 mb-1">
                Ресторан:{" "}
                <span className="font-medium text-slate-900">
                  {offer.restaurant_name}
                </span>
              </div>

              <div className="text-sm text-slate-600">
                Сумма заказа:{" "}
                <span className="font-medium">
                  {offer.order_total_price} ₽
                </span>
              </div>

              <div className="text-xs text-slate-500 mt-1">
                Создан: {createdLabel}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                Адрес доставки: {offer.delivery_address}
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  size="sm"
                  onClick={() => handleAssign(offer.id)}
                  disabled={assigningId === offer.id}
                >
                  {assigningId === offer.id ? "Берём заказ..." : "Взять заказ"}
                </Button>
              </div>
            </Card>
          );
        })}

        {!loading && !error && offers.length === 0 && (
          <div className="text-sm text-slate-500">
            Сейчас нет свободных заказов для доставки.
          </div>
        )}
      </div>
    </div>
  );
}