import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Order = {
  id: number;
  status: string;
  client_id: number;
  restaurant_id: number;
  delivery_address: string;
  total_price: string;
  created_at: string;
};

const POSSIBLE_STATUSES = ["NEW", "COOKING", "READY", "ON_DELIVERY", "DELIVERED", "CANCELLED"];

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await api.get("/orders/");
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка загрузки заказов ресторана");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "RESTAURANT") {
      loadOrders();
    }
  }, [user]);

  async function changeStatus(id: number, status: string) {
    try {
      await api.patch(`/orders/${id}/status/`, { status });
      await loadOrders();
    } catch (err: any) {
      alert(err?.data?.detail || "Ошибка смены статуса");
    }
  }

  if (!user || user.role !== "RESTAURANT") {
    return <div>Страница доступна только пользователю с ролью RESTAURANT</div>;
  }

  return (
    <div>
      <h2>Заказы ресторатора</h2>
      {loading && <div>Загрузка...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      <ul>
        {orders.map((o) => (
          <li key={o.id} style={{ marginBottom: 12, borderBottom: "1px solid #ccc", paddingBottom: 8 }}>
            <strong>Заказ #{o.id}</strong> — {o.status} — {o.total_price} ₽
            <br />
            Адрес: {o.delivery_address}
            <br />
            <small>{new Date(o.created_at).toLocaleString()}</small>
            <br />
            <span>Статус: </span>
            {POSSIBLE_STATUSES.map((st) => (
              <button
                key={st}
                disabled={st === o.status}
                onClick={() => changeStatus(o.id, st)}
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