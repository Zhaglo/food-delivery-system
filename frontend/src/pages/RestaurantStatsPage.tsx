import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type MyRestaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

type StatsTotals = {
  orders_count: number;
  delivered_count: number;
  cancelled_count: number;
  revenue: string;
  avg_check: string;
};

type DayPoint = {
  date: string; // ISO yyyy-mm-dd
  orders_count: number;
  revenue: string;
};

type WeekdayPoint = {
  weekday: number;
  weekday_display: string;
  orders_count: number;
  revenue: string;
};

type TopItem = {
  menu_item_id: number;
  name: string;
  quantity: number;
  revenue: string;
};

type StatsResponse = {
  period: string;
  from: string | null;
  to: string;
  totals: StatsTotals;
  status_counts: Record<string, number>;
  top_items: TopItem[];
  by_day: DayPoint[];
  orders_by_weekday: WeekdayPoint[];
};

type PeriodType = "today" | "7d" | "30d" | "all";

function formatDateLabel(iso: string) {
  if (!iso) return "";
  if (iso.length === 10) {
    const [_y, m, d] = iso.split("-");
    return `${d}.${m}`;
  }
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function formatCurrency(value: string | number | null | undefined) {
  const num = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (Number.isNaN(num)) return "0 ₽";
  return `${num.toFixed(2)} ₽`;
}

export default function RestaurantStatsPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<MyRestaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  const [period, setPeriod] = useState<PeriodType>("7d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- загрузка ресторанов ресторатора ---
  useEffect(() => {
    if (!user || user.role !== "RESTAURANT") return;

    setLoadingRestaurants(true);
    api
      .get("/restaurants/my/")
      .then((data: MyRestaurant[]) => {
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurantId(data[0].id);
        }
      })
      .catch(() => {
        setError("Ошибка загрузки ресторанов");
      })
      .finally(() => setLoadingRestaurants(false));
  }, [user]);

  // --- загрузка статистики ---
  useEffect(() => {
    if (!selectedRestaurantId) return;
    setLoadingStats(true);
    setError(null);

    api
      .get(`/restaurants/${selectedRestaurantId}/stats/?period=${period}`)
      .then((data: StatsResponse) => {
        setStats(data);
      })
      .catch((err: any) => {
        setError(err?.data?.detail || "Ошибка загрузки статистики");
      })
      .finally(() => setLoadingStats(false));
  }, [selectedRestaurantId, period]);

  if (!user || user.role !== "RESTAURANT") {
    return (
      <div className="text-sm text-slate-500">
        Страница доступна только пользователю с ролью RESTAURANT.
      </div>
    );
  }

  const selectedRestaurant =
    restaurants.find((r) => r.id === selectedRestaurantId) || null;

  const totals = stats?.totals;
  const cancelledCount = totals?.cancelled_count ?? 0;

  // --- данные для графиков по дням ---
  const byDayData = useMemo(() => {
    return (stats?.by_day || []).map((p) => ({
      ...p,
      dateLabel: formatDateLabel(p.date),
      revenueNumber: Number(p.revenue ?? 0),
    }));
  }, [stats]);

  const ordersTimeline = useMemo(
    () =>
      byDayData.map((p) => ({
        date: p.date,
        dateLabel: p.dateLabel,
        orders_count: p.orders_count,
      })),
    [byDayData],
  );

  // --- данные по дням недели (только количество заказов) ---
  const weekdayData = useMemo(
    () => stats?.orders_by_weekday || [],
    [stats],
  );

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Статистика ресторана
          </h1>
          {selectedRestaurant && (
            <div className="text-xs text-slate-500 mt-1">
              <div className="font-medium text-slate-800">
                {selectedRestaurant.name}
              </div>
              <div>{selectedRestaurant.address}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {restaurants.length > 1 && (
            <select
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={selectedRestaurantId ?? ""}
              onChange={(e) =>
                setSelectedRestaurantId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-1">
            {(["today", "7d", "30d", "all"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  period === p
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {p === "today"
                  ? "Сегодня"
                  : p === "7d"
                  ? "7 дней"
                  : p === "30d"
                  ? "30 дней"
                  : "Всё время"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadingRestaurants && (
        <div className="text-sm text-slate-500">
          Загрузка информации о ресторане...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Totals-карточки */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500">
              Выручка
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(totals?.revenue || "0")}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Средний чек</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(totals?.avg_check || "0")}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Всего заказов</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {totals?.orders_count ?? 0}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Отменённые</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {cancelledCount}
            </div>
          </div>
        </div>
      )}

      {/* График 1: выручка по дням (ОТДЕЛЬНАЯ СЕКЦИЯ) */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Динамика выручки по дням
            </h2>
            <span className="text-xs text-slate-400">
              Учитываются все не отменённые
            </span>
          </div>
          {byDayData.length === 0 ? (
            <div className="text-xs text-slate-500">
              Нет данных за выбранный период.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value as number),
                      "Выручка",
                    ]}
                    labelFormatter={(label) => `Дата: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenueNumber"
                    stroke="#2563eb"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* График 2: количество заказов по дням (ТОЖЕ ОТДЕЛЬНОЙ СЕКЦИЕЙ НИЖЕ) */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Количество заказов по дням
            </h2>
            <span className="text-xs text-slate-400">
              Все заказы в периоде
            </span>
          </div>
          {ordersTimeline.length === 0 ? (
            <div className="text-xs text-slate-500">
              Нет данных за выбранный период.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [String(value), "Заказы"]}
                    labelFormatter={(label) => `Дата: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders_count"
                    stroke="#16a34a"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* График 3: заказы по дням недели (ТОЛЬКО КОЛ-ВО ЗАКАЗОВ) */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Заказы по дням недели
            </h2>
            <span className="text-xs text-slate-400">
              Показывает, в какие дни больше всего заказов
            </span>
          </div>
          {weekdayData.length === 0 ? (
            <div className="text-xs text-slate-500">
              Нет данных за выбранный период.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekday_display" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [String(value), "Заказы"]}
                    labelFormatter={(_label) => "День недели"}
                  />
                  <Bar dataKey="orders_count" name="Заказы" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Топ блюд */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Топ блюд
          </h2>
          {stats.top_items.length === 0 ? (
            <div className="text-xs text-slate-500">
              Недостаточно данных для построения топа.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4">Блюдо</th>
                    <th className="py-2 pr-4">Кол-во</th>
                    <th className="py-2 pr-4">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_items.map((item) => (
                    <tr
                      key={item.menu_item_id}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2 pr-4">{item.name}</td>
                      <td className="py-2 pr-4">{item.quantity}</td>
                      <td className="py-2 pr-4">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loadingStats && (
        <div className="text-[11px] text-slate-400">
          Обновляем статистику...
        </div>
      )}
    </div>
  );
}