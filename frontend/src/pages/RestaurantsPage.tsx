// src/pages/RestaurantsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { UtensilsCrossed, Bike, Store, MapPin, Star, Clock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";

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
  const { user } = useAuth();

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
    <div className="space-y-6">
      {/* HERO-блок */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white p-6 shadow-md">
        <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <h1 className="text-2xl md:text-3xl font-semibold mb-1">
              Доставка еды для ресторанов и клиентов
            </h1>
            <p className="text-sm md:text-base text-blue-100">
              Оформляйте заказы, управляйте кухней и доставкой в единой системе.
              Один интерфейс для клиента, ресторатора и курьера.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
            <QuickAction
              icon={<UtensilsCrossed className="h-4 w-4" />}
              label="Сделать заказ"
              to="/"
              highlight={user?.role === "CLIENT" || !user}
            />
            <QuickAction
              icon={<Store className="h-4 w-4" />}
              label="Заказы ресторатора"
              to="/restaurant/orders"
              highlight={user?.role === "RESTAURANT"}
            />
            <QuickAction
              icon={<Bike className="h-4 w-4" />}
              label="Задачи курьера"
              to="/courier/tasks"
              highlight={user?.role === "COURIER"}
            />
          </div>
        </div>

        {/* декоративные круги */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Ошибки / загрузка */}
      {loading && <div className="text-sm text-slate-500">Загрузка ресторанов...</div>}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Список ресторанов */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Доступные рестораны</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {restaurants.map((r) => (
          <Link
            to={`/restaurants/${r.id}`}
            key={r.id}
            className="group"
          >
            <Card className="h-full transition-shadow group-hover:shadow-lg group-hover:-translate-y-0.5 duration-150">
              <div className="flex gap-3">
                {/* “Аватар” ресторана */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                </div>

                {/* Основной контент */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {r.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                        <MapPin className="h-3 w-3" />
                        <span>{r.address}</span>
                      </p>
                    </div>

                    {/* Маленький бейдж с ID или “новый” */}
                    <span className="text-[10px] uppercase rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 flex-shrink-0">
                      ID #{r.id}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {r.description}
                    </p>
                  )}

                  {/* “Метрики” ресторана — пока условные, для красоты */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>4.{(r.id % 3) + 2}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>30–45 мин</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
                      <UtensilsCrossed className="h-3 w-3" />
                      <span>Доставка</span>
                    </span>
                  </div>

                  {/* Низ карточки — “CTA” */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                      Смотреть меню
                      <span className="h-3 w-3 border-t border-r border-blue-600 rotate-45" />
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Нажмите, чтобы оформить заказ
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}

          {!loading && !error && restaurants.length === 0 && (
            <div className="text-sm text-slate-500">
              Рестораны не найдены. Добавьте их через административный интерфейс.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type QuickActionProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  highlight?: boolean;
};

function QuickAction({ icon, label, to, highlight }: QuickActionProps) {
  const base =
    "inline-flex items-center gap-2 rounded-full border text-xs px-3 py-1.5 transition-colors";
  const classes = highlight
    ? `${base} bg-white text-blue-700 border-transparent hover:bg-blue-50`
    : `${base} bg-white/10 text-blue-50 border-white/30 hover:bg-white/20`;

  return (
    <Link to={to} className={classes}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}