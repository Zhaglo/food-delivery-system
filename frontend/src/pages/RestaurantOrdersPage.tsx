// src/pages/RestaurantOrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { Clock, MapPin, User as UserIcon } from "lucide-react";

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

const STATUSES = ["NEW", "COOKING", "READY", "ON_DELIVERY", "DELIVERED", "CANCELLED"] as const;
type StatusType = (typeof STATUSES)[number];

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

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRestaurants, setMyRestaurants] = useState<MyRestaurant[]>([]);

  // фильтры
  const [statusFilter, setStatusFilter] = useState<StatusType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadOrders() {
    try {
      // не трогаем тут loading, чтобы при автообновлении не мигала "Загрузка..."
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
      .then(setMyRestaurants)
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
    return <div>Страница доступна только пользователю с ролью RESTAURANT</div>;
  }

  // ===== Фильтрация и группировка =====

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) {
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
  }, [orders, statusFilter, normalizedSearch]);

  const groupedByStatus: Record<StatusType, Order[]> = useMemo(() => {
    const result: Record<StatusType, Order[]> = {
      NEW: [],
      COOKING: [],
      READY: [],
      ON_DELIVERY: [],
      DELIVERED: [],
      CANCELLED: [],
    };

    for (const o of filteredOrders) {
      const st = o.status as StatusType;
      if (STATUSES.includes(st)) {
        result[st].push(o);
      }
    }

    // сортируем внутри статуса по дате (новые сверху)
    for (const st of STATUSES) {
      result[st].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return result;
  }, [filteredOrders]);

  // счётчики по статусам (по всем заказам, не только отфильтрованным)
  const counters = useMemo(() => {
    const base: Record<StatusType, number> = {
      NEW: 0,
      COOKING: 0,
      READY: 0,
      ON_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    for (const o of orders) {
      const st = o.status as StatusType;
      if (STATUSES.includes(st)) {
        base[st] += 1;
      }
    }

    return base;
  }, [orders]);

  // ===== РЕНДЕР КАРТОЧКИ ЗАКАЗА (используется и в канбане, и в списке) =====
  function renderOrderCard(o: Order) {
    const nextStatuses = STATUS_FLOW[o.status as StatusType] || [];

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
          <span className={statusBadgeClasses(o.status as StatusType)}>
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

        {/* Список блюд */}
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

        {/* Кнопки смены статуса */}
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

      {/* Статистика по статусам */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Статус заказов
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {STATUSES.map((st) => (
            <div
              key={st}
              className="flex flex-col items-start px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
            >
              <span className="font-medium text-slate-700">
                {STATUS_LABEL[st]}
              </span>
              <span className="text-lg font-semibold text-slate-900">
                {counters[st]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Фильтры / поиск */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Фильтрация</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="Поиск по № заказа, клиенту, адресу или блюду"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusType | "ALL")
            }
          >
            <option value="ALL">Все статусы</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {STATUS_LABEL[st]}
              </option>
            ))}
          </select>

          <div className="flex items-center text-xs text-slate-500">
            {loading ? "Загрузка данных..." : `Всего заказов: ${orders.length}`}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Список / канбан в зависимости от фильтра статуса */}
      {statusFilter !== "ALL" ? (
        // Режим одного статуса: обычный список
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Заказы со статусом: {STATUS_LABEL[statusFilter as StatusType]}
          </h2>

          {filteredOrders.length === 0 ? (
            <div className="text-sm text-slate-500">
              Для этого статуса заказов нет.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((o) => renderOrderCard(o))}
            </div>
          )}
        </div>
      ) : (
        // Канбан по всем статусам
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUSES.map((st) => {
            const group = groupedByStatus[st];
            const countLabel =
              group.length === 0 ? "нет" : group.length.toString();

            return (
              <div
                key={st}
                className="min-w-[260px] max-w-sm flex-1 bg-slate-50 border border-slate-200 rounded-xl flex flex-col"
              >
                <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase">
                    {STATUS_LABEL[st]}
                  </span>
                  <span className="text-xs text-slate-500">{countLabel}</span>
                </div>
                <div className="p-3 space-y-3 max-h-[480px] overflow-y-auto">
                  {group.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      Заказов нет.
                    </div>
                  ) : (
                    group.map((o) => renderOrderCard(o))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-sm text-slate-500">
          Для ваших ресторанов пока нет заказов.
        </div>
      )}
    </div>
  );
}