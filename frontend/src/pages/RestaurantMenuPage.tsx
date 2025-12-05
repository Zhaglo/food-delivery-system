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
  const navigate = useNavigate();

  useEffect(() => {
    if (!restaurantId) return;
    api
      .get(`/restaurants/${restaurantId}/menu/`)
      .then((data) => {
        setRestaurant(data.restaurant);
        setMenu(data.menu);
      })
      .catch(() => setMessage("Ошибка загрузки меню"));
  }, [restaurantId]);

  function changeQty(id: number, value: number) {
    setQuantities((q) => ({ ...q, [id]: value }));
  }

  async function handleCreateOrder() {
    setMessage(null);
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty && Number(qty) > 0)
      .map(([menu_item_id, qty]) => ({
        menu_item_id: Number(menu_item_id),
        quantity: Number(qty),
      }));

    if (!items.length) {
      setMessage("Выберите хотя бы одно блюдо");
      return;
    }

    try {
      const order = await api.post("/orders/", {
        restaurant_id: restaurantId,
        delivery_address: address,
        items,
      });
      setMessage(`Заказ #${order.id} создан, сумма: ${order.total_price}`);
      // можно сразу перейти в список заказов
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err: any) {
      setMessage(err?.data?.detail || "Ошибка создания заказа");
    }
  }

  if (!restaurant) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <h2>{restaurant.name}</h2>
      <p>{restaurant.address}</p>

      <h3>Меню</h3>
      <table>
        <thead>
          <tr>
            <th>Блюдо</th>
            <th>Описание</th>
            <th>Цена</th>
            <th>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          {menu.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.price}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={quantities[item.id] ?? 0}
                  onChange={(e) => changeQty(item.id, Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 20 }}>Адрес доставки</h3>
      <input
        style={{ width: "100%", maxWidth: 400 }}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={handleCreateOrder}>Оформить заказ</button>
      </div>

      {message && <div style={{ marginTop: 10 }}>{message}</div>}
    </div>
  );
}