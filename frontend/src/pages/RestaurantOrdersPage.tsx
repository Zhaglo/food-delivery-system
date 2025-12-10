// src/pages/RestaurantOrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  User as UserIcon,
  ChevronDown,
  Search,
} from "lucide-react";

type OrderItemShort = {
  id: number;
  menu_item_id: number;
  name: string;
  quantity: number;
  price: string;
  line_total: string;
};

type Order = {
  id: number;
  status: string;
  client_id: number;
  client_username?: string;
  restaurant_id: number;
  delivery_address: string;
  total_price: string;
  created_at: string;
  items?: OrderItemShort[];
};

type MyRestaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

const STATUSES = [
  "NEW",
  "COOKING",
  "READY",
  "ON_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type StatusType = (typeof STATUSES)[number];

// активные статусы — для канбана
const ACTIVE_STATUSES: StatusType[] = [
  "NEW",
  "COOKING",
  "READY",
  "ON_DELIVERY",
];

// история — отдельный блок
const HISTORY_STATUSES: StatusType[] = ["DELIVERED", "CANCELLED"];

const STATUS_LABEL: Record<StatusType, string> = {
  NEW: "Новый",
  COOKING: "Готовится",
  READY: "Готов",
  ON_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_FLOW: Record<StatusType, StatusType[]> = {
  NEW: ["COOKING", "CANCELLED"],
  COOKING: ["READY", "CANCELLED"],
  READY: ["ON_DELIVERY", "CANCELLED"],
  ON_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function statusBadgeClasses(status: StatusType) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
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

function statusTileClasses(status: StatusType) {
  const base =
    "flex flex-col items-start px-3 py-2 rounded-lg border text-xs";
  switch (status) {
    case "NEW":
      return `${base} bg-sky-50 border-sky-100`;
    case "COOKING":
      return `${base} bg-amber-50 border-amber-100`;
    case "READY":
      return `${base} bg-emerald-50 border-emerald-100`;
    case "ON_DELIVERY":
      return `${base} bg-indigo-50 border-indigo-100`;
    case "DELIVERED":
      return `${base} bg-green-50 border-green-100`;
    case "CANCELLED":
      return `${base} bg-red-50 border-red-100`;
    default:
      return `${base} bg-slate-50 border-slate-100`;
  }
}

const COLUMN_HEADER_CLASSES: Record<StatusType, string> = {
  NEW: "bg-sky-50 border-sky-100",
  COOKING: "bg-amber-50 border-amber-100",
  READY: "bg-emerald-50 border-emerald-100",
  ON_DELIVERY: "bg-indigo-50 border-indigo-100",
  DELIVERED: "bg-green-50 border-green-100",
  CANCELLED: "bg-red-50 border-red-100",
};

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function minutesFromNow(iso: string) {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin <= 0) return "только что";
  if (diffMin === 1) return "минуту назад";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const hours = Math.floor(diffMin / 60);
  return `${hours} ч назад`;
}

type HistoryStatusFilter = "ALL" | "DELIVERED" | "CANCELLED";
type HistoryTimeFilter = "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS";

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRestaurants, setMyRestaurants] = useState<MyRestaurant[]>([]);

  // фильтр по ресторану: "ALL" или id ресторана — ГЛОБАЛЬНЫЙ
  const [restaurantFilter, setRestaurantFilter] = useState<"ALL" | number>(
    "ALL",
  );

  // фильтры для АКТИВНЫХ заказов (канбан)
  const [statusFilter, setStatusFilter] = useState<StatusType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // история (доставленные / отменённые)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<HistoryStatusFilter>("ALL");
  const [historyTimeFilter, setHistoryTimeFilter] =
    useState<HistoryTimeFilter>("TODAY");

  async function loadOrders() {
    try {
      const data = await api.get("/orders/");
      setOrders(data);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка загрузки заказов ресторана");
      setLoading(false);
    }
  }

  useEffect(() => {
    api
      .get("/restaurants/my/")
      .then((data: MyRestaurant[]) => {
        setMyRestaurants(data);
        // если есть только один ресторан — сразу выбрать его
        if (data.length === 1) {
          setRestaurantFilter(data[0].id);
        }
      })
      .catch(() => {
        // можно тихо игнорить
      });
  }, []);

  useEffect(() => {
    if (user?.role !== "RESTAURANT") return;

    // первый загруз
    loadOrders();

    // автообновление каждые 15 секунд
    const intervalId = setInterval(loadOrders, 15000);
    return () => clearInterval(intervalId);
  }, [user]);

  async function changeStatus(id: number, status: StatusType) {
    try {
      await api.patch(`/orders/${id}/status/`, { status });
      await loadOrders();
    } catch (err: any) {
      alert(err?.data?.detail || "Ошибка смены статуса");
    }
  }

  if (!user || user.role !== "RESTAURANT") {
    return (
      <div className="text-sm text-slate-500">
        Страница доступна только пользователю с ролью RESTAURANT
      </div>
    );
  }

  // ===== общие штуки =====

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const normalizedHistorySearch = historySearch.trim().toLowerCase();
  const hasSearch = normalizedSearch.length > 0;

  // сначала фильтруем заказы по ресторану (ГЛОБАЛЬНЫЙ фильтр)
  const ordersForView = useMemo(() => {
    if (restaurantFilter === "ALL") return orders;
    return orders.filter((o) => o.restaurant_id === restaurantFilter);
  }, [orders, restaurantFilter]);

  // фильтрация заказов для КАНБАНА (только активные статусы)
  const filteredActiveOrders = useMemo(() => {
    return ordersForView.filter((o) => {
      const st = o.status as StatusType;
      if (!ACTIVE_STATUSES.includes(st)) {
        return false;
      }

      if (statusFilter !== "ALL" && st !== statusFilter) {
        return false;
      }

      if (normalizedSearch) {
        const haystack =
          `#${o.id} ` +
          (o.client_username || "") +
          " " +
          (o.delivery_address || "") +
          " " +
          (o.items || [])
            .map((i) => i.name)
            .join(" ");

        if (!haystack.toLowerCase().includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [ordersForView, statusFilter, normalizedSearch]);

  // группировка активных по статусам для канбана
  const groupedByStatus: Record<StatusType, Order[]> = useMemo(() => {
    const result: Record<StatusType, Order[]> = {
      NEW: [],
      COOKING: [],
      READY: [],
      ON_DELIVERY: [],
      DELIVERED: [],
      CANCELLED: [],
    };

    for (const o of filteredActiveOrders) {
      const st = o.status as StatusType;
      if (ACTIVE_STATUSES.includes(st)) {
        result[st].push(o);
      }
    }

    for (const st of ACTIVE_STATUSES) {
      result[st].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return result;
  }, [filteredActiveOrders]);

  // счётчики по заказам с учётом выбранного ресторана
  const counters = useMemo(() => {
    const base: Record<StatusType, number> = {
      NEW: 0,
      COOKING: 0,
      READY: 0,
      ON_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    for (const o of ordersForView) {
      const st = o.status as StatusType;
      if (STATUSES.includes(st)) {
        base[st] += 1;
      }
    }

    return base;
  }, [ordersForView]);

  // ===== История заказов (DELIVERED/CANCELLED) =====

  const historyOrders = useMemo(
    () =>
      ordersForView.filter((o) =>
        HISTORY_STATUSES.includes(o.status as StatusType),
      ),
    [ordersForView],
  );

  const filteredHistoryOrders = useMemo(() => {
    let result = [...historyOrders];

    // фильтр по статусу истории
    if (historyStatusFilter !== "ALL") {
      result = result.filter((o) => o.status === historyStatusFilter);
    }

    // фильтр по времени
    if (historyTimeFilter !== "ALL") {
      const now = new Date();
      result = result.filter((o) => {
        const created = new Date(o.created_at);
        if (Number.isNaN(created.getTime())) return false;

        const diffMs = now.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (historyTimeFilter === "TODAY") {
          const sameDay =
            created.getFullYear() === now.getFullYear() &&
            created.getMonth() === now.getMonth() &&
            created.getDate() === now.getDate();
          return sameDay;
        }
        if (historyTimeFilter === "LAST_7_DAYS") {
          return diffDays <= 7;
        }
        if (historyTimeFilter === "LAST_30_DAYS") {
          return diffDays <= 30;
        }
        return true;
      });
    }

    // поиск в истории
    if (normalizedHistorySearch) {
      result = result.filter((o) => {
        const haystack =
          `#${o.id} ` +
          (o.client_username || "") +
          " " +
          (o.delivery_address || "") +
          " " +
          (o.items || [])
            .map((i) => i.name)
            .join(" ");

        return haystack.toLowerCase().includes(normalizedHistorySearch);
      });
    }

    // сортировка — новые сверху
    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return result;
  }, [
    historyOrders,
    historyStatusFilter,
    historyTimeFilter,
    normalizedHistorySearch,
  ]);

  // ===== Рендер =====

  const currentRestaurantLabel =
    restaurantFilter === "ALL"
      ? "Все рестораны"
      : myRestaurants.find((r) => r.id === restaurantFilter)?.name ||
        `Ресторан #${restaurantFilter}`;

  return (
    <div className="space-y-4">
      {/* Шапка ресторатора + глобальный фильтр по ресторану */}
      {myRestaurants.length > 0 && (
      <Card className="space-y-3">
        {/* Верхняя строка: заголовок + селект */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-500 mt-0.5">
              Сейчас показываются заказы:&nbsp;
              <span className="font-medium text-slate-900">
                {currentRestaurantLabel}
              </span>
            </p>
          </div>

          {/* Выпадающий список выбора ресторана */}
          <div className="w-full md:w-72">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={restaurantFilter === "ALL" ? "ALL" : String(restaurantFilter)}
              onChange={(e) => {
                const value = e.target.value;
                setRestaurantFilter(value === "ALL" ? "ALL" : Number(value));
              }}
            >
              <option value="ALL">Все рестораны</option>
              {myRestaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Карточка активного ресторана (кроме режима "Все рестораны") */}
        {restaurantFilter !== "ALL" && (() => {
          const selected = myRestaurants.find(
            (r) => r.id === restaurantFilter,
          );
          if (!selected) return null;

          return (
            <div className="text-xs sm:text-sm p-3 rounded-lg border border-blue-100 bg-blue-50/60 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900 truncate">
                  {selected.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  Активный ресторан
                </span>
              </div>
              <div className="text-slate-600 truncate">
                {selected.address}
              </div>
              {selected.description && (
                <div className="text-[11px] text-slate-500 line-clamp-2">
                  {selected.description}
                </div>
              )}
            </div>
          );
        })()}
      </Card>
    )}

      {/* Статистика по статусам */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {STATUSES.filter((st) => st !== "DELIVERED").map((st) => (
            <div key={st} className={statusTileClasses(st)}>
              <span className="text-[11px] text-slate-600">
                {STATUS_LABEL[st]}
              </span>
              <span className="text-lg font-semibold text-slate-900">
                {counters[st]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Фильтры / поиск для АКТИВНЫХ заказов */}
      <Card className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Левая часть: поиск + статус */}
          <div className="flex-1 flex flex-col gap-3 sm:flex-row">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Поиск по № заказа, клиенту, адресу или блюду"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Статус */}
            <div className="sm:w-56">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusType | "ALL")
                }
              >
                <option value="ALL">Все активные статусы</option>
                {ACTIVE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABEL[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Правая часть: статистика */}
          <div className="md:w-52 text-right text-xs text-slate-500 space-y-0.5">
            <div className="font-medium text-slate-700">
              {loading
                ? "Загрузка данных..."
                : `Всего заказов: ${ordersForView.length}`}
            </div>
            {!loading && hasSearch && (
              <div className="text-[11px] text-slate-400 truncate">
                По запросу: “{searchQuery.trim()}”
              </div>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Канбан по АКТИВНЫМ статусам */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {ACTIVE_STATUSES.map((st) => {
          const group = groupedByStatus[st];
          const countLabel =
            group.length === 0 ? "нет" : group.length.toString();

          return (
            <div
              key={st}
              className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col h-full"
            >
              <div
                className={`px-3 py-2 border-b text-xs flex items-center justify-between ${COLUMN_HEADER_CLASSES[st]}`}
              >
                <span className="font-semibold text-slate-800 uppercase">
                  {STATUS_LABEL[st]}
                </span>
                <span className="text-slate-500">{countLabel}</span>
              </div>

              <div className="p-3 space-y-3">
                {group.length === 0 ? (
                  <div className="text-xs text-slate-400">Заказов нет.</div>
                ) : (
                  group.map((o) => {
                    const nextStatuses = STATUS_FLOW[o.status as StatusType];

                    return (
                      <div
                        key={o.id}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-700">
                            Заказ{" "}
                            <span className="font-semibold text-slate-900">
                              #{o.id}
                            </span>
                            {o.client_username && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <UserIcon className="h-3 w-3" />
                                {o.client_username}
                              </span>
                            )}
                          </div>
                          <span
                            className={statusBadgeClasses(
                              o.status as StatusType,
                            )}
                          >
                            {STATUS_LABEL[o.status as StatusType]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(o.created_at)}
                          </span>
                          <span>{minutesFromNow(o.created_at)}</span>
                        </div>

                        {o.items && o.items.length > 0 && (
                          <div className="bg-slate-50 rounded-md p-2 space-y-1">
                            {o.items.slice(0, 3).map((it) => (
                              <div
                                key={it.id}
                                className="flex items-center justify-between text-[11px] text-slate-700"
                              >
                                <span className="truncate">
                                  {it.name} × {it.quantity}
                                </span>
                                <span className="text-slate-500">
                                  {it.line_total} ₽
                                </span>
                              </div>
                            ))}
                            {o.items.length > 3 && (
                              <div className="text-[11px] text-slate-400">
                                + ещё {o.items.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-900">
                            {o.total_price} ₽
                          </span>
                          <Link
                            to={`/restaurant/orders/${o.id}`}
                            className="text-[11px] text-blue-600 hover:text-blue-700"
                          >
                            Подробнее →
                          </Link>
                        </div>

                        {nextStatuses.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {nextStatuses.map((next) => (
                              <button
                                key={next}
                                onClick={() =>
                                  changeStatus(o.id, next as StatusType)
                                }
                                className="px-2 py-1 text-[11px] rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                              >
                                {STATUS_LABEL[next]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* История заказов (DELIVERED / CANCELLED) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm"
        >
          <span className="font-semibold text-slate-900">
            История заказов (доставленные и отменённые)
          </span>
          <span className="flex items-center gap-3 text-xs text-slate-500">
            <span>Всего: {historyOrders.length}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isHistoryOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isHistoryOpen && (
          <div className="border-t border-slate-200 px-4 py-3 space-y-3">
            {/* фильтры для истории */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Поиск по истории (№, клиент, адрес, блюда)"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={historyStatusFilter}
                onChange={(e) =>
                  setHistoryStatusFilter(
                    e.target.value as HistoryStatusFilter,
                  )
                }
              >
                <option value="ALL">Все типы (доставл. + отменён.)</option>
                <option value="DELIVERED">Только доставленные</option>
                <option value="CANCELLED">Только отменённые</option>
              </select>

              <select
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={historyTimeFilter}
                onChange={(e) =>
                  setHistoryTimeFilter(e.target.value as HistoryTimeFilter)
                }
              >
                <option value="TODAY">Только сегодня</option>
                <option value="LAST_7_DAYS">Последние 7 дней</option>
                <option value="LAST_30_DAYS">Последние 30 дней</option>
                <option value="ALL">За всё время</option>
              </select>
            </div>

            {/* список истории */}
            {filteredHistoryOrders.length === 0 ? (
              <div className="text-sm text-slate-500">
                История пуста по выбранным фильтрам.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistoryOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-700">
                        Заказ{" "}
                        <span className="font-semibold text-slate-900">
                          #{o.id}
                        </span>
                        {o.client_username && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <UserIcon className="h-3 w-3" />
                            {o.client_username}
                          </span>
                        )}
                      </div>
                      <span
                        className={statusBadgeClasses(o.status as StatusType)}
                      >
                        {STATUS_LABEL[o.status as StatusType]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(o.created_at)}
                      </span>
                      <span>{minutesFromNow(o.created_at)}</span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-[2px]" />
                      <span>{o.delivery_address}</span>
                    </div>

                    {o.items && o.items.length > 0 && (
                      <div className="bg-white rounded-md p-2 space-y-1">
                        {o.items.slice(0, 3).map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-[11px] text-slate-700"
                          >
                            <span className="truncate">
                              {it.name} × {it.quantity}
                            </span>
                            <span className="text-slate-500">
                              {it.line_total} ₽
                            </span>
                          </div>
                        ))}
                        {o.items.length > 3 && (
                          <div className="text-[11px] text-slate-400">
                            + ещё {o.items.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">
                        {o.total_price} ₽
                      </span>
                      <Link
                        to={`/restaurant/orders/${o.id}`}
                        className="text-[11px] text-blue-600 hover:text-blue-700"
                      >
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && !error && ordersForView.length === 0 && (
        <div className="text-sm text-slate-500">
          Для выбранного ресторана пока нет заказов.
        </div>
      )}
    </div>
  );
}