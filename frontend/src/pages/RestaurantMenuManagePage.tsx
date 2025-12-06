import { useEffect, useState } from "react";
import { api } from "../api/client";

type MyRestaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
};

export default function RestaurantMenuManagePage() {
  const [restaurants, setRestaurants] = useState<MyRestaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // поля для новой позиции
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    api
      .get("/restaurants/my/")
      .then((data) => {
        setRestaurants(data);
        if (data.length > 0) {
          setSelectedRestaurantId(data[0].id);
        }
      })
      .catch(() => {
        setError("Ошибка загрузки ресторанов");
      });
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setMenu([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/restaurants/${selectedRestaurantId}/menu/`)
      .then((data) => {
        setMenu(data.menu);
        setError(null);
      })
      .catch(() => {
        setError("Ошибка загрузки меню");
      })
      .finally(() => setLoading(false));
  }, [selectedRestaurantId]);

  async function handleAddItem() {
    if (!selectedRestaurantId) return;
    if (!newName || !newPrice) {
      setError("Название и цена обязательны");
      return;
    }
    setSaving(true);
    try {
      const item = await api.post(
        `/restaurants/${selectedRestaurantId}/menu/manage/`,
        {
          name: newName,
          description: newDescription,
          price: newPrice,
          is_available: true,
        },
      );
      setMenu((prev) => [...prev, item]);
      setNewName("");
      setNewDescription("");
      setNewPrice("");
      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка добавления позиции");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(id: number) {
    if (!selectedRestaurantId) return;
    if (!confirm("Удалить эту позицию меню?")) return;
    try {
      await api.delete?.(`/restaurants/${selectedRestaurantId}/menu/manage/${id}/`);
      setMenu((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка удаления позиции");
    }
  }

  async function handleToggleAvailability(id: number) {
    if (!selectedRestaurantId) return;
    const item = menu.find((m) => m.id === id);
    if (!item) return;

    try {
      const updated = await api.patch(
        `/restaurants/${selectedRestaurantId}/menu/manage/${id}/`,
        {
          is_available: !item.is_available,
        },
      );
      setMenu((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка обновления позиции");
    }
  }

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h1 className="text-lg font-semibold text-slate-900 mb-2">
          Управление меню ресторана
        </h1>

        {restaurants.length === 0 ? (
          <div className="text-sm text-slate-500">
            У вас пока нет ресторанов. После одобрения заявки ресторан появится здесь.
          </div>
        ) : (
          <div className="space-y-2">
            {restaurants.length > 1 && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Выберите ресторан
                </label>
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
              </div>
            )}

            {selectedRestaurant && (
              <div className="text-xs text-slate-500">
                <div className="font-medium text-slate-900">
                  {selectedRestaurant.name}
                </div>
                <div>{selectedRestaurant.address}</div>
                {selectedRestaurant.description && (
                  <div className="mt-1 text-slate-400">
                    {selectedRestaurant.description}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {selectedRestaurantId && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Добавить позицию
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                placeholder="Название"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                placeholder="Цена, ₽"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
              <input
                className="px-3 py-2 border border-slate-300 rounded-md text-sm sm:col-span-1"
                placeholder="Описание (необязательно)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={saving}
              className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {saving ? "Сохранение..." : "Добавить в меню"}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Текущее меню
            </h2>
            {loading ? (
              <div className="text-sm text-slate-500">Загрузка меню...</div>
            ) : menu.length === 0 ? (
              <div className="text-sm text-slate-500">
                Меню пока пусто.
              </div>
            ) : (
              <div className="space-y-2">
                {menu.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0 text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {item.name}{" "}
                        {!item.is_available && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            выключено
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-slate-500">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-900">
                        {item.price} ₽
                      </div>
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        {item.is_available ? "Выключить" : "Включить"}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}