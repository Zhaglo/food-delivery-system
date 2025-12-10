// src/pages/CourierOffersPage.tsx
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

const ACTIVE_TASK_STATUSES = ["ASSIGNED", "IN_PROGRESS"];

export default function CourierOffersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  // флаг: есть ли уже активная задача у курьера
  const [hasActiveTask, setHasActiveTask] = useState(false);

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

  async function checkActiveTask() {
    try {
      const tasks = await api.get("/delivery/tasks/");
      const hasActive = Array.isArray(tasks)
        ? tasks.some((t: any) => ACTIVE_TASK_STATUSES.includes(t.status))
        : false;
      setHasActiveTask(hasActive);
    } catch {
      // если что-то пошло не так — просто считаем, что инфы нет и не блокируем
      setHasActiveTask(false);
    }
  }

  useEffect(() => {
    if (user?.role === "COURIER") {
      // первый загруз
      loadOffers();
      checkActiveTask();

      // автообновление каждые 20 секунд
      const id = setInterval(() => {
        loadOffers();
        checkActiveTask();
      }, 20000);

      return () => clearInterval(id);
    }
  }, [user]);

  async function handleAssign(taskId: number) {
    setError(null);
    setAssigningId(taskId);
    try {
      await api.post(`/delivery/offers/${taskId}/assign/`, {});
      // после успешного взятия сразу идём в "Мои задачи"
      navigate("/courier/tasks");
    } catch (err: any) {
      alert(
        err?.data?.detail ||
          "Не удалось взять заказ. Возможно, он уже занят или у вас есть активная задача.",
      );
    } finally {
      setAssigningId(null);
    }
  }

  if (!user || user.role !== "COURIER" && user.role !== "ADMIN") {
    return (
      <div className="text-sm text-slate-500">
        Страница доступна только пользователю с ролью COURIER.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Доступные заказы для доставки"
      />

      {hasActiveTask && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-md">
          У вас уже есть активная задача доставки. Завершите её, чтобы взять новый заказ.
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-500">
          Загрузка доступных заказов...
        </div>
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

          const disabled = hasActiveTask || assigningId === offer.id;

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
                  disabled={disabled}
                >
                  {assigningId === offer.id
                    ? "Берём заказ..."
                    : hasActiveTask
                    ? "У вас уже есть заказ"
                    : "Взять заказ"}
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