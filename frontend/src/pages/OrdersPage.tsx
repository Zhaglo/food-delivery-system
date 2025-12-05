import { useEffect, useState } from "react";
import { api } from "../api/client";

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

  useEffect(() => {
    api
      .get("/orders/")
      .then(setOrders)
      .catch((err: any) => setError(err?.data?.detail || "Ошибка загрузки заказов"));
  }, []);

  return (
    <div>
      <h2>Мои заказы</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <ul>
        {orders.map((o) => (
          <li key={o.id} style={{ marginBottom: 10 }}>
            <strong>Заказ #{o.id}</strong> — {o.status} — {o.total_price} ₽
            <br />
            {o.delivery_address}
            <br />
            <small>{new Date(o.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}