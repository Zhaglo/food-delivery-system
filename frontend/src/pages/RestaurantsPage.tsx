// src/pages/RestaurantsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { UtensilsCrossed, MapPin, Star, Clock } from "lucide-react";
import { Card } from "../components/Card";

type Restaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

type SortField = "rating" | "name";
type SortDir = "asc" | "desc";

function getFakeRating(r: Restaurant): number {
  // Временный "рейтинг", пока бэк не отдаёт реальный.
  // Просто даёт значения в районе 4.2–4.8.
  return 4.2 + (r.id % 3) * 0.2;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = [...restaurants];

    if (q) {
      result = result.filter((r) => {
        const haystack =
          (r.name || "") + " " + (r.address || "") + " " + (r.description || "");
        return haystack.toLowerCase().includes(q);
      });
    }

    result.sort((a, b) => {
      let valueA: number | string;
      let valueB: number | string;

      if (sortField === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      } else {
        valueA = getFakeRating(a);
        valueB = getFakeRating(b);
      }

      let compare = 0;

      if (typeof valueA === "string" && typeof valueB === "string") {
        compare = valueA.localeCompare(valueB, "ru");
      } else {
        compare = (valueA as number) - (valueB as number);
      }

      return sortDir === "asc" ? compare : -compare;
    });

    return result;
  }, [restaurants, search, sortField, sortDir]);

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Рестораны
        </h1>
        <p className="text-sm text-slate-500 max-w-xl">
          Выберите ресторан, посмотрите меню и оформите заказ.
          Поиск и сортировка помогут быстрее найти, что хочется.
        </p>
      </section>

      {/* Панель фильтров */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Фильтры</h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">

          {/* поиск */}
          <input
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="Поиск по названию или адресу"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* поле сортировки */}
          <div className="flex items-center gap-2">
            <select
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
            >
              <option value="rating">По рейтингу</option>
              <option value="name">По названию</option>
            </select>

            {/* кнопка направления сортировки */}
            <button
              type="button"
              onClick={() =>
                setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-3 py-2 border border-slate-300 rounded-md text-xs"
              title="Сменить направление сортировки"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* статистика */}
          <div className="flex items-center text-xs text-slate-500">
            {loading ? "Загрузка..." : `Найдено ресторанов: ${filteredRestaurants.length}`}
          </div>
        </div>
      </section>

      {/* Ошибки */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Список ресторанов */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Доступные рестораны
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRestaurants.map((r) => {
            const rating = getFakeRating(r).toFixed(1);

            return (
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

                        {/* Рейтинг */}
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{rating}</span>
                        </span>
                      </div>

                      {r.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {r.description}
                        </p>
                      )}

                      {/* Метрики — время доставки условное, для атмосферы */}
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>30–45 мин</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <UtensilsCrossed className="h-3 w-3" />
                          <span>Доставка</span>
                        </span>
                      </div>

                      {/* Низ карточки — CTA */}
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
            );
          })}

          {!loading && !error && filteredRestaurants.length === 0 && (
            <div className="text-sm text-slate-500">
              Рестораны не найдены. Добавьте их через административный интерфейс.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}