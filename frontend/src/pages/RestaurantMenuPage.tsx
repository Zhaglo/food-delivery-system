// src/pages/RestaurantMenuPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { UtensilsCrossed, MapPin, Pizza } from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
};

type Restaurant = {
  id: number;
  name: string;
  address: string;
};

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const restaurantId = Number(id);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // загрузка ресторана и меню
  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    api
      .get(`/restaurants/${restaurantId}/menu/`)
      .then((data) => {
        setRestaurant(data.restaurant);
        setMenu(data.menu);
        setError(null);
      })
      .catch(() => setError("Ошибка загрузки меню"))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  // подтянуть адрес из localStorage, если есть
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = window.localStorage.getItem("delivery_address");
      if (saved && saved.trim()) {
        setAddress(saved);
      } else {
        setAddress("ул. Пушкина, дом Колотушкина, 1");
      }
    } catch {
      setAddress("ул. Пушкина, дом Колотушкина, 1");
    }
  }, []);

  // сохраняем адрес при изменении
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (address.trim()) {
        window.localStorage.setItem("delivery_address", address);
      }
    } catch {
      // игнорим
    }
  }, [address]);

  function setItemQuantity(id: number, value: number) {
    setQuantities((q) => {
      const normalized = Math.max(0, value);
      if (normalized === 0) {
        const copy = { ...q };
        delete copy[id];
        return copy;
      }
      return { ...q, [id]: normalized };
    });
  }

  const selectedItems = useMemo(
    () => menu.filter((m) => (quantities[m.id] ?? 0) > 0),
    [menu, quantities],
  );

  const totalPrice = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const qty = quantities[item.id] ?? 0;
        return sum + Number(item.price) * qty;
      }, 0),
    [selectedItems, quantities],
  );

  const hasItems = selectedItems.length > 0;
  const hasAddress = address.trim().length > 0;

  async function handleCreateOrder() {
    setMessage(null);
    setError(null);

    if (!hasItems) {
      setError("Выберите хотя бы одно блюдо");
      return;
    }

    if (!hasAddress) {
      setError("Укажите адрес доставки");
      return;
    }

    const items = selectedItems.map((item) => ({
      menu_item_id: item.id,
      quantity: quantities[item.id],
    }));

    try {
      const order = await api.post("/orders/", {
        restaurant_id: restaurantId,
        delivery_address: address.trim(),
        items,
      });
      setMessage(`Заказ #${order.id} создан, сумма: ${order.total_price} ₽`);
      setQuantities({});
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка создания заказа");
    }
  }

  if (loading) {
    return <div className="text-slate-500 text-sm">Загрузка...</div>;
  }

  if (!restaurant) {
    return <div className="text-sm text-red-600">Ресторан не найден</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Шапка ресторана */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
        {/* Левая часть — текст */}
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            {restaurant.name}
          </h1>

          <div className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            <span>{restaurant.address}</span>
          </div>

        </div>

        {/* Правая часть — плотный градиентный блок с иконкой */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <UtensilsCrossed className="h-10 w-10 text-white opacity-95" />
        </div>
      </div>

      {/* Сообщения об ошибке / успехе */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      {message && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-md">
          {message}
        </div>
      )}

      {/* Меню + корзина */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Левая колонка: меню */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Меню</h2>
            {menu.length === 0 ? (
              <div className="text-sm text-slate-500">Меню пусто.</div>
            ) : (
              <div className="space-y-3">
                {menu.map((item) => {
                  const qty = quantities[item.id] ?? 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      {/* Левая часть: картинка блюда + текст */}
                      <div className="flex gap-3 flex-1 min-w-0">
                        {/* Квадратная заглушка блюда */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <div className="h-full w-full bg-gradient-to-br from-orange-400/90 via-red-400/90 to-orange-500/90 flex items-center justify-center">
                            <Pizza className="h-6 w-6 text-white opacity-95" />
                          </div>
                        </div>

                        {/* Название + описание */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-900 truncate">
                              {item.name}
                            </h3>
                            {!item.is_available && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                Нет в наличии
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs sm:text-sm text-slate-600 break-words line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Правая часть: цена + кнопка */}
                      <div className="flex flex-col items-end gap-1 min-w-[130px]">
                        <span className="text-sm font-semibold text-slate-900">
                          {item.price} ₽
                        </span>

                        {item.is_available ? (
                          qty === 0 ? (
                            <button
                              onClick={() => setItemQuantity(item.id, 1)}
                              className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              Добавить в заказ
                            </button>
                          ) : (
                            <button
                              disabled
                              className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-300 cursor-default"
                            >
                              Добавлено
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 mt-1">
                            Недоступно
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка: корзина + адрес */}
        <div className="lg:col-span-2 space-y-4">
          {/* Корзина */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Ваш заказ</h2>

            {!hasItems ? (
              <div className="text-sm text-slate-500">
                Вы ещё не добавили ни одного блюда.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {selectedItems.map((item) => {
                    const qty = quantities[item.id] ?? 0;
                    const lineTotal = (Number(item.price) * qty).toFixed(2);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.price} ₽ / шт
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* контрол количества */}
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-300 bg-slate-50">
                            <button
                              onClick={() =>
                                setItemQuantity(item.id, qty - 1)
                              }
                              className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-300 text-slate-700 text-xs hover:bg-slate-100"
                              title="Уменьшить количество"
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm text-slate-900">
                              {qty}
                            </span>
                            <button
                              onClick={() =>
                                setItemQuantity(item.id, qty + 1)
                              }
                              className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700"
                              title="Увеличить количество"
                            >
                              +
                            </button>
                          </div>

                          {/* итог по блюду */}
                          <span className="text-sm font-semibold text-slate-900 min-w-[72px] text-right">
                            {lineTotal} ₽
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">
                    Итого к оплате:
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {totalPrice.toFixed(2)} ₽
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setQuantities({})}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Очистить корзину
                </button>
              </>
            )}
          </div>

          {/* Адрес и кнопка */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Адрес доставки
            </h2>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Укажите улицу, дом, подъезд, код и т.п."
            />
            <button
              onClick={handleCreateOrder}
              disabled={!hasItems || !hasAddress}
              className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {hasItems && hasAddress
                ? "Оформить заказ"
                : !hasItems
                ? "Выберите блюда"
                : "Укажите адрес"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}