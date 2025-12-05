import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { UtensilsCrossed, MapPin } from "lucide-react";

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
  const [address, setAddress] = useState("ул. Пушкина, дом Колотушкина, 1");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  async function handleCreateOrder() {
    setMessage(null);
    setError(null);

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty && Number(qty) > 0)
      .map(([menu_item_id, qty]) => ({
        menu_item_id: Number(menu_item_id),
        quantity: Number(qty),
      }));

    if (!items.length) {
      setError("Выберите хотя бы одно блюдо");
      return;
    }

    try {
      const order = await api.post("/orders/", {
        restaurant_id: restaurantId,
        delivery_address: address,
        items,
      });
      setMessage(`Заказ #${order.id} создан, сумма: ${order.total_price} ₽`);
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
    <div className="space-y-5">
      {/* Карточка ресторана */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              {restaurant.name}
            </h1>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              <span>{restaurant.address}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Здесь вы можете выбрать блюда и оформить заказ с доставкой.
            </p>
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

      {/* Меню */}
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
                  {/* Левая часть: имя + описание */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">{item.name}</h3>
                      {!item.is_available && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Нет в наличии
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Правая часть: цена + кнопка / счётчик */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.price} ₽
                    </span>

                    {item.is_available ? (
                      qty === 0 ? (
                        // КНОПКА "Добавить в заказ"
                        <button
                          onClick={() => setItemQuantity(item.id, 1)}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Добавить в заказ
                        </button>
                      ) : (
                        // СЧЁТЧИК - qty +
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-slate-300 bg-slate-50">
                          <button
                            onClick={() => setItemQuantity(item.id, qty - 1)}
                            className="h-6 w-6 flex items-center justify-center rounded-full border border-slate-300 text-slate-700 text-sm leading-none hover:bg-slate-100"
                          >
                            −
                          </button>
                          <span className="min-w-[1.5rem] text-center text-sm text-slate-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => setItemQuantity(item.id, qty + 1)}
                            className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm leading-none hover:bg-blue-700"
                          >
                            +
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">Недоступно</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Адрес и кнопка */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Адрес доставки</h2>
        <input
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          onClick={handleCreateOrder}
          className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Оформить заказ
        </button>
      </div>
    </div>
  );
}