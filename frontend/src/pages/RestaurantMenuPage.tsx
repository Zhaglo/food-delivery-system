import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

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
  const [address, setAddress] = useState("ул. Пушкина, дом Колотушкина");
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

  function changeQty(id: number, value: number) {
    setQuantities((q) => ({ ...q, [id]: value }));
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">{restaurant.name}</h1>
        <p className="text-sm text-slate-500">{restaurant.address}</p>
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
            {menu.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
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
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.price} ₽
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={quantities[item.id] ?? 0}
                    onChange={(e) => changeQty(item.id, Number(e.target.value))}
                    disabled={!item.is_available}
                  />
                </div>
              </div>
            ))}
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