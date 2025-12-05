import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type Restaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/restaurants/")
      .then((data) => {
        setRestaurants(data);
        setError(null);
      })
      .catch((err: any) => {
        setError(err?.data?.detail || "Ошибка загрузки ресторанов");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Рестораны</h1>
        <p className="text-sm text-slate-500">
          Выберите ресторан, чтобы посмотреть меню и оформить заказ.
        </p>
      </div>

      {loading && <div className="text-slate-500 text-sm">Загрузка...</div>}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {restaurants.map((r) => (
          <Link
            to={`/restaurants/${r.id}`}
            key={r.id}
            className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{r.name}</h2>
            <p className="text-xs text-slate-500 mb-2">{r.address}</p>
            {r.description && (
              <p className="text-sm text-slate-600 line-clamp-3">{r.description}</p>
            )}
          </Link>
        ))}
        {!loading && !error && restaurants.length === 0 && (
          <div className="text-sm text-slate-500">Рестораны не найдены.</div>
        )}
      </div>
    </div>
  );
}