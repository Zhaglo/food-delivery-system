// src/pages/CourierTasksPage.tsx
import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";
import { MapPin, Store, Phone, Clock, ChevronDown } from "lucide-react";

type Task = {
  id: number;
  order_id: number;
  status: string;
  courier_id: number | null;
  client_id: number;
  client_username?: string;
  client_phone?: string;
  restaurant_id: number;
  restaurant_name?: string;
  delivery_address: string;
  order_total_price?: string;
  order_created_at?: string;
};

const ACTIVE_STATUSES = ["ASSIGNED", "IN_PROGRESS"] as const;
const HISTORY_STATUSES = ["DONE"] as const;

type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

// вычисляем следующий статус и текст кнопки
function getNextAction(status: string):
  | { nextStatus: "IN_PROGRESS" | "DONE"; label: string }
  | null {
  switch (status) {
    case "ASSIGNED":
      return {
        nextStatus: "IN_PROGRESS",
        label: "Забрал из ресторана",
      };
    case "IN_PROGRESS":
      return {
        nextStatus: "DONE",
        label: "Заказ доставлен",
      };
    default:
      return null;
  }
}

export default function CourierTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      const data = await api.get("/delivery/tasks/");
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка загрузки задач доставки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "COURIER" || user?.role === "ADMIN") {
      loadTasks();
    }
  }, [user]);

  async function changeStatus(id: number, status: string) {
    try {
      await api.patch(`/delivery/tasks/${id}/status/`, { status });
      await loadTasks();
    } catch (err: any) {
      alert(err?.data?.detail || "Ошибка смены статуса задачи");
    }
  }

  if (!user || (user.role !== "COURIER" && user.role !== "ADMIN")) {
    return (
      <div className="text-sm text-slate-500">
        Страница доступна только пользователю с ролью COURIER или ADMIN.
      </div>
    );
  }

  const activeTasks = useMemo(
    () =>
      tasks.filter((t) =>
        ACTIVE_STATUSES.includes(t.status as ActiveStatus),
      ),
    [tasks],
  );

  const historyTasks = useMemo(
    () =>
      tasks.filter((t) =>
        HISTORY_STATUSES.includes(t.status as any),
      ),
    [tasks],
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Задачи курьера"
      />

      {loading && (
        <div className="text-sm text-slate-500">Загрузка...</div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Активные задачи */}
      <div className="space-y-3">
        {activeTasks.map((t) => {
          const createdAt = t.order_created_at
            ? new Date(t.order_created_at)
            : null;
          const createdLabel =
            createdAt && !isNaN(createdAt.getTime())
              ? createdAt.toLocaleString()
              : t.order_created_at;

          const action = getNextAction(t.status);

          return (
            <Card key={t.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-700">
                  Задача{" "}
                  <span className="font-semibold text-slate-900">
                    #{t.id}
                  </span>{" "}
                  — заказ #{t.order_id}
                </div>
                <StatusBadge status={t.status} kind="delivery" />
              </div>

              {/* Ресторан */}
              <div className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                <Store className="h-3 w-3" />
                <span>
                  {t.restaurant_name || `Ресторан #${t.restaurant_id}`}
                </span>
              </div>

              {/* Клиент */}
              <div className="text-xs text-slate-600 flex flex-wrap gap-2 mb-1">
                <span>
                  Клиент:{" "}
                  <span className="font-medium">
                    {t.client_username || `#${t.client_id}`}
                  </span>
                </span>
                {t.client_phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <a
                      href={`tel:${t.client_phone}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t.client_phone}
                    </a>
                  </span>
                )}
              </div>

              {/* Адрес */}
              <div className="text-xs text-slate-600 flex items-start gap-1 mb-1">
                <MapPin className="h-3 w-3 mt-[2px]" />
                <span>{t.delivery_address}</span>
              </div>

              {/* Время и сумма */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {createdLabel
                      ? `Создан: ${createdLabel}`
                      : "Время не указано"}
                  </span>
                </span>
                {t.order_total_price && (
                  <span className="font-medium text-slate-800">
                    {t.order_total_price} ₽
                  </span>
                )}
              </div>

              {/* ОДНА кнопка "следующий шаг" */}
              {action && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => changeStatus(t.id, action.nextStatus)}
                  >
                    {action.label}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}

        {!loading && !error && activeTasks.length === 0 && (
          <div className="text-sm text-slate-500">
            У вас сейчас нет активных задач доставки.
          </div>
        )}
      </div>

      {/* История (DONE) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm"
        >
          <span className="font-semibold text-slate-900">
            История доставок (завершённые задачи)
          </span>
          <span className="flex items-center gap-3 text-xs text-slate-500">
            <span>Всего: {historyTasks.length}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isHistoryOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isHistoryOpen && (
          <div className="border-t border-slate-200 px-4 py-3 space-y-2">
            {historyTasks.length === 0 ? (
              <div className="text-sm text-slate-500">
                Завершённых задач пока нет.
              </div>
            ) : (
              historyTasks.map((t) => {
                const createdAt = t.order_created_at
                  ? new Date(t.order_created_at)
                  : null;
                const createdLabel =
                  createdAt && !isNaN(createdAt.getTime())
                    ? createdAt.toLocaleString()
                    : t.order_created_at;

                return (
                  <Card key={t.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-slate-700">
                        Задача{" "}
                        <span className="font-semibold text-slate-900">
                          #{t.id}
                        </span>{" "}
                        — заказ #{t.order_id}
                      </div>
                      <StatusBadge status={t.status} kind="delivery" />
                    </div>
                    <div className="text-[11px] text-slate-500 mb-1">
                      {t.restaurant_name || `Ресторан #${t.restaurant_id}`} •{" "}
                      Клиент: {t.client_username || `#${t.client_id}`}
                    </div>
                    <div className="text-[11px] text-slate-500 mb-1">
                      Адрес: {t.delivery_address}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {createdLabel
                            ? `Создан: ${createdLabel}`
                            : "Время не указано"}
                        </span>
                      </span>
                      {t.order_total_price && (
                        <span className="font-medium text-slate-800">
                          {t.order_total_price} ₽
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}