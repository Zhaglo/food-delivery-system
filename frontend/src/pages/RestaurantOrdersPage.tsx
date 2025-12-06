import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

type Order = {
  id: number;
  status: string;
  client_id: number;
  restaurant_id: number;
  delivery_address: string;
  total_price: string;
  created_at: string;
};

type MyRestaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

const POSSIBLE_STATUSES = ["NEW", "COOKING", "READY", "ON_DELIVERY", "DELIVERED", "CANCELLED"];

function statusBadge(status: string) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "NEW":
      return `${base} bg-sky-100 text-sky-700`;
    case "COOKING":
      return `${base} bg-amber-100 text-amber-700`;
    case "READY":
      return `${base} bg-emerald-100 text-emerald-700`;
    case "ON_DELIVERY":
      return `${base} bg-indigo-100 text-indigo-700`;
    case "DELIVERED":
      return `${base} bg-green-100 text-green-700`;
    case "CANCELLED":
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRestaurants, setMyRestaurants] = useState<MyRestaurant[]>([]);

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
        api
          .get("/restaurants/my/")
          .then(setMyRestaurants)
          .catch(() => {
            // можно тихо игнорить, если что-то пошло не так
          });
      }, []);

  useEffect(() => {
    if (user?.role === "RESTAURANT") {
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
    <div className="space-y-4">
      {/* Шапка ресторатора */}
      {myRestaurants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Мои рестораны
          </h2>
          <div className="flex flex-col gap-2">
            {myRestaurants.map((r) => (
              <div key={r.id} className="text-sm">
                <div className="font-medium text-slate-900">{r.name}</div>
                <div className="text-slate-500">{r.address}</div>
                {r.description && (
                  <div className="text-xs text-slate-400 mt-1">
                    {r.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Загрузка...</div>}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Заказ <span className="font-semibold text-slate-900">#{o.id}</span>
                <span className="text-xs text-slate-500 ml-2">
                  Клиент ID: {o.client_id}
                </span>
              </div>
              <span className={statusBadge(o.status)}>{o.status}</span>
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

            <div className="flex flex-wrap gap-2 pt-2">
              {POSSIBLE_STATUSES.map((st) => (
                <button
                  key={st}
                  disabled={st === o.status}
                  onClick={() => changeStatus(o.id, st)}
                  className={`px-2 py-1 text-xs rounded border ${
                    st === o.status
                      ? "bg-slate-200 border-slate-300 text-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
              <Link
                to={`/restaurant/orders/${o.id}`}
                className="text-xs text-blue-600 hover:text-blue-700 ml-auto"
              >
                Подробнее →
              </Link>
            </div>
          </div>
        ))}
        {!loading && !error && orders.length === 0 && (
          <div className="text-sm text-slate-500">
            Для ваших ресторанов пока нет заказов.
          </div>
        )}
      </div>
    </div>
  );
}