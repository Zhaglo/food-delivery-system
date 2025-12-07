// src/pages/RestaurantsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { UtensilsCrossed, MapPin, Star, Clock, Search } from "lucide-react";
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
          (r.name || "") +
          " " +
          (r.address || "") +
          " " +
          (r.description || "");
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

  const hasSearch = search.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Панель фильтров */}
      <Card className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Левая часть: поиск + сортировка */}
          <div className="flex-1 flex flex-col gap-3 sm:flex-row">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Поиск по названию или адресу"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Сортировка */}
            <div className="sm:w-56 flex gap-2">
              <select
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortField}
                onChange={(e) =>
                  setSortField(e.target.value as SortField)
                }
              >
                <option value="rating">По рейтингу</option>
                <option value="name">По названию</option>
              </select>

              <button
                type="button"
                onClick={() =>
                  setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="px-2.5 py-2 border border-slate-300 rounded-md text-xs text-slate-600 hover:bg-slate-50"
                title="Сменить направление сортировки"
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* Правая часть: статистика */}
          <div className="md:w-52 text-right space-y-0.5">
            <div className="text-sm text-slate-600">
              {loading
                ? "Загрузка..."
                : `Найдено ресторанов: ${filteredRestaurants.length}`}
            </div>
            {!loading && hasSearch && (
              <div className="text-[11px] text-slate-400 truncate">
                По запросу: “{search.trim()}”
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Ошибки */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Список ресторанов */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRestaurants.map((r) => {
            const rating = getFakeRating(r).toFixed(1);

            return (
              <Link
                to={`/restaurants/${r.id}`}
                key={r.id}
                className="group h-full"
              >
                <Card className="h-full transition-all duration-150 group-hover:shadow-md group-hover:-translate-y-0.5 p-4">
                  <div className="flex gap-4">

                    {/* Картинка */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center">
                      <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <UtensilsCrossed className="h-6 w-6 text-white opacity-90" />
                      </div>
                    </div>

                    {/* ПРАВАЯ ЧАСТЬ */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Заголовок + рейтинг */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          {/* Название — крупнее и жирнее */}
                          <h3 className="text-[15px] font-semibold text-slate-900 truncate">
                            {r.name}
                          </h3>

                          {/* Адрес — как чип */}
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-600 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 max-w-full">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{r.address}</span>
                          </p>
                        </div>

                        {/* Рейтинг */}
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{getFakeRating(r).toFixed(1)}</span>
                        </span>
                      </div>

                      {/* Описание — отделяем от заголовка и адреса */}
                      {r.description && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {r.description}
                        </p>
                      )}

                      {/* Нижняя панель — прижата к низу */}
                      <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>30–45 мин</span>
                        </span>

                        <span className="inline-flex items-center gap-1 font-medium text-blue-600 group-hover:text-blue-700">
                          Смотреть меню
                          <span className="h-2.5 w-2.5 border-t border-r border-current rotate-45" />
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
              {hasSearch
                ? "По вашему запросу рестораны не найдены."
                : "Рестораны пока не добавлены."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}