import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Task = {
  id: number;
  order_id: number;
  status: string;
  courier_id: number;
  client_id: number;
  restaurant_id: number;
  delivery_address: string;
};

const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DELIVERED", "CANCELLED"];

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
    if (user && user.role === "COURIER") {
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
    <div>
      <h2>Задачи курьера</h2>
      {loading && <div>Загрузка...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      <ul>
        {tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 12, borderBottom: "1px solid #ccc", paddingBottom: 8 }}>
            <strong>Задача #{t.id}</strong> — заказ #{t.order_id} — {t.status}
            <br />
            Адрес доставки: {t.delivery_address}
            <br />
            <span>Статус: </span>
            {TASK_STATUSES.map((st) => (
              <button
                key={st}
                disabled={st === t.status}
                onClick={() => changeStatus(t.id, st)}
                style={{ marginRight: 4, marginTop: 4 }}
              >
                {st}
              </button>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}