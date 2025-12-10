// src/pages/RestaurantMenuManagePage.tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";

type MyRestaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

type MenuSection = {
  id: number;
  name: string;
  ordering: number;
};

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  section_id?: number | null;
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

  const [sections, setSections] = useState<MenuSection[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionOrdering, setNewSectionOrdering] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null); // для нового блюда

  // фильтры / поиск / сортировка / группировка
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSectionId, setFilterSectionId] = useState<string>("all"); // "all" | "no-section" | id как строка
  const [filterAvailability, setFilterAvailability] =
    useState<"all" | "available" | "unavailable">("all");
  const [groupBySection, setGroupBySection] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // редактирование существующей позиции
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSectionId, setEditSectionId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!selectedRestaurantId) {
      setSections([]);
      return;
    }

    api
      .get(`/restaurants/${selectedRestaurantId}/sections/`)
      .then((data) => {
        setSections(data);
        setError(null);
      })
      .catch(() => {
        setError("Ошибка загрузки разделов меню");
      });
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
          section_id: selectedSectionId,
        },
      );
      setMenu((prev) => [...prev, item]);
      setNewName("");
      setNewDescription("");
      setNewPrice("");
      setSelectedSectionId(null);
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

  async function handleCreateSection() {
    if (!selectedRestaurantId) return;
    if (!newSectionName.trim()) {
      setError("Введите название раздела");
      return;
    }

    try {
      const section = await api.post(
        `/restaurants/${selectedRestaurantId}/sections/`,
        {
          name: newSectionName,
          ordering: newSectionOrdering ? Number(newSectionOrdering) : 0,
        },
      );
      setSections((prev) => [...prev, section]);
      setNewSectionName("");
      setNewSectionOrdering("");
      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка создания раздела");
    }
  }

  async function handleDeleteSection(id: number) {
    if (!selectedRestaurantId) return;
    if (!confirm("Удалить этот раздел? Блюда останутся без раздела.")) return;

    try {
      await api.delete(`/restaurants/${selectedRestaurantId}/sections/${id}/`);

      // убираем раздел из списка
      setSections((prev) => prev.filter((s) => s.id !== id));

      // обновляем меню: все блюда этого раздела переводим в "без раздела"
      setMenu((prev) =>
        prev.map((item) =>
          item.section_id === id ? { ...item, section_id: null } : item,
        ),
      );

      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка удаления раздела");
    }
  }

  function startEditItem(item: MenuItem) {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || "");
    setEditPrice(item.price.toString());
    setEditSectionId(item.section_id ?? null);
  }

  function cancelEditItem() {
    setEditingItemId(null);
    setEditName("");
    setEditDescription("");
    setEditPrice("");
    setEditSectionId(null);
  }

  async function saveEditItem(id: number) {
    if (!selectedRestaurantId) return;
    if (!editName || !editPrice) {
      setError("Название и цена обязательны");
      return;
    }

    try {
      const updated = await api.patch(
        `/restaurants/${selectedRestaurantId}/menu/manage/${id}/`,
        {
          name: editName,
          description: editDescription,
          price: editPrice,
          section_id: editSectionId,
        },
      );
      setMenu((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setError(null);
      cancelEditItem();
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка сохранения изменений");
    }
  }

  // === Вспомогательная логика для фильтрации/сортировки ===

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredAndSortedMenu: MenuItem[] = [...menu]
    .filter((item) => {
      // поиск по названию и описанию
      if (normalizedSearch) {
        const haystack = (
          (item.name || "") +
          " " +
          (item.description || "")
        ).toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      // фильтр по разделу
      if (filterSectionId === "no-section") {
        if (item.section_id !== null && item.section_id !== undefined) return false;
      } else if (filterSectionId !== "all") {
        const secId = Number(filterSectionId);
        if (item.section_id !== secId) return false;
      }

      // фильтр по доступности
      if (filterAvailability === "available" && !item.is_available) return false;
      if (filterAvailability === "unavailable" && item.is_available) return false;

      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        const pa = Number(a.price);
        const pb = Number(b.price);
        cmp = pa === pb ? 0 : pa < pb ? -1 : 1;
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

  function renderMenuItem(item: MenuItem) {
    const section = item.section_id
      ? sections.find((s) => s.id === item.section_id)
      : null;

    const isEditing = editingItemId === item.id;

    if (isEditing) {
      return (
        <div
          key={item.id}
          className="border border-blue-200 bg-blue-50/40 rounded-lg p-3 space-y-2 text-sm"
        >
          <div className="font-semibold text-slate-900">
            Редактирование позиции #{item.id}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Название"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Цена, ₽"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Описание (необязательно)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={editSectionId ?? ""}
              onChange={(e) =>
                setEditSectionId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Без раздела</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => saveEditItem(item.id)}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              Сохранить
            </button>
            <button
              onClick={cancelEditItem}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
            >
              Отмена
            </button>
            <span className="ml-auto text-xs text-slate-500">
              Текущий статус:{" "}
              {item.is_available ? "доступно" : "выключено"}
            </span>
          </div>
        </div>
      );
    }

    // обычный вид
    return (
      <div
        key={item.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 text-sm"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900 truncate">
              {item.name}
            </span>
            {section && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {section.name}
              </span>
            )}
            {!item.is_available && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                выключено
              </span>
            )}
          </div>

          {item.description && (
            <div className="text-xs text-slate-500 line-clamp-2">
              {item.description}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-sm font-semibold text-slate-900 min-w-[72px] text-right">
            {item.price} ₽
          </div>
          <button
            onClick={() => handleToggleAvailability(item.id)}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            {item.is_available ? "Выключить" : "Включить"}
          </button>
          <button
            onClick={() => startEditItem(item)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Редактировать
          </button>
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    );
  }

  // Для группировки: список всех "разделов", включая псевдо-раздел "без раздела"
  const sectionsForGrouping: { id: number | null; name: string }[] = [
    { id: null, name: "Без раздела" },
    ...sections.map((s) => ({ id: s.id, name: s.name })),
  ];

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Шапка управления меню */}
      <Card className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Управление меню
            </h1>
            {selectedRestaurant && (
              <p className="text-xs text-slate-500 mt-1">
                Ресторан:&nbsp;
                <span className="font-medium text-slate-900">
                  {selectedRestaurant.name}
                </span>
              </p>
            )}
            {!selectedRestaurant && restaurants.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">
                У вас пока нет ресторанов. После одобрения заявки ресторан появится здесь.
              </p>
            )}
          </div>

          {/* Выбор ресторана, если их несколько */}
          {restaurants.length > 1 && (
            <div className="w-full md:w-72">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        </div>

        {selectedRestaurant && (
          <div className="text-xs text-slate-500 space-y-0.5">
            <div>{selectedRestaurant.address}</div>
            {selectedRestaurant.description && (
              <div className="text-slate-400">
                {selectedRestaurant.description}
              </div>
            )}
          </div>
        )}
      </Card>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Разделы меню */}
      {selectedRestaurantId && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Разделы меню
          </h2>

          {sections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700"
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(s.id)}
                    className="text-[10px] uppercase tracking-wide text-red-500 hover:text-red-700"
                    title="Удалить раздел (блюда останутся без раздела)"
                  >
                    удалить
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Разделы ещё не созданы.
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Название раздела"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
            />
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Порядок (необязательно)"
              value={newSectionOrdering}
              onChange={(e) => setNewSectionOrdering(e.target.value)}
            />
            <button
              onClick={handleCreateSection}
              className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Добавить раздел
            </button>
          </div>
        </Card>
      )}

      {/* Добавление новой позиции */}
      {selectedRestaurantId && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Добавить позицию
          </h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {/* Название (шире) */}
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm md:col-span-2"
              placeholder="Название"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {/* Цена */}
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Цена, ₽"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            {/* Описание */}
            <input
              className="px-3 py-2 border border-slate-300 rounded-md text-sm md:col-span-2"
              placeholder="Описание (необязательно)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            {/* Раздел */}
            <select
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={selectedSectionId ?? ""}
              onChange={(e) =>
                setSelectedSectionId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Без раздела</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddItem}
              disabled={saving}
              className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {saving ? "Сохранение..." : "Добавить в меню"}
            </button>
          </div>
        </Card>
      )}

      {/* Панель фильтров / поиска / сортировки */}
      {selectedRestaurantId && (
        <Card className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Левая часть: все контролы */}
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="Поиск по названию или описанию"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={filterSectionId}
                  onChange={(e) => setFilterSectionId(e.target.value)}
                >
                  <option value="all">Все разделы</option>
                  <option value="no-section">Без раздела</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={filterAvailability}
                  onChange={(e) =>
                    setFilterAvailability(
                      e.target.value as "all" | "available" | "unavailable",
                    )
                  }
                >
                  <option value="all">Доступность: все</option>
                  <option value="available">Только доступные</option>
                  <option value="unavailable">Только выключенные</option>
                </select>

                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "name" | "price")
                    }
                  >
                    <option value="name">Сортировать по названию</option>
                    <option value="price">Сортировать по цене</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                    className="px-2 py-2 border border-slate-300 rounded-md text-xs"
                    title="Сменить направление сортировки"
                  >
                    {sortDir === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>

            {/* Правая часть: чекбокс + статистика */}
            <div className="md:w-56 text-right text-xs text-slate-500 space-y-1.5">
              <label className="inline-flex items-center justify-end gap-2 text-xs text-slate-700">
                <span>Группировать по разделам</span>
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={groupBySection}
                  onChange={(e) => setGroupBySection(e.target.checked)}
                />
              </label>

              <div className="font-medium text-slate-700">
                {loading
                  ? "Загрузка меню..."
                  : `Показано позиций: ${filteredAndSortedMenu.length}`}
              </div>

            </div>
          </div>
        </Card>
      )}

      {/* Текущее меню */}
      {selectedRestaurantId && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Текущее меню
          </h2>
          {loading ? (
            <div className="text-sm text-slate-500">Загрузка меню...</div>
          ) : filteredAndSortedMenu.length === 0 ? (
            <div className="text-sm text-slate-500">
              Ничего не найдено по выбранным фильтрам.
            </div>
          ) : groupBySection ? (
            <div className="space-y-4">
              {sectionsForGrouping.map((sec) => {
                const items = filteredAndSortedMenu.filter(
                  (item) => (item.section_id ?? null) === sec.id,
                );
                if (items.length === 0) return null;

                return (
                  <div key={sec.id ?? "no-section"} className="space-y-2">
                    <div className="text-xs font-semibold text-indigo-600">
                      {sec.name}
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => renderMenuItem(item))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedMenu.map((item) => renderMenuItem(item))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}