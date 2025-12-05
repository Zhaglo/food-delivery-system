import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";

type Task = {
  id: number;
  order_id: number;
  status: string;
  courier_id: number;
  client_id: number;
  restaurant_id: number;
  delivery_address: string;
};

const TASK_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "DONE"];

export default function CourierTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (user?.role === "COURIER") {
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

  if (!user || user.role !== "COURIER") {
    return <div>Страница доступна только пользователю с ролью COURIER</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Задачи курьера"
        subtitle="Активные и завершенные задания по доставке."
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
        {tasks.map((t) => (
          <Card key={t.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-700">
                Задача{" "}
                <span className="font-semibold text-slate-900">#{t.id}</span>{" "}
                — заказ #{t.order_id}
              </div>
              <StatusBadge status={t.status} kind="delivery" />
            </div>
            <div className="text-xs text-slate-500">
              Ресторан ID: {t.restaurant_id}, Клиент ID: {t.client_id}
            </div>
            <div className="text-xs text-slate-500 mb-2">
              Адрес доставки: {t.delivery_address}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {TASK_STATUSES.map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={st === t.status ? "ghost" : "primary"}
                  disabled={st === t.status}
                  onClick={() => changeStatus(t.id, st)}
                >
                  {st}
                </Button>
              ))}
            </div>
          </Card>
        ))}
        {!loading && !error && tasks.length === 0 && (
          <div className="text-sm text-slate-500">
            У вас сейчас нет задач доставки.
          </div>
        )}
      </div>
    </div>
  );
}