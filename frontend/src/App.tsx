import { Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantMenuPage from "./pages/RestaurantMenuPage";
import OrdersPage from "./pages/OrdersPage";
import RestaurantOrdersPage from "./pages/RestaurantOrdersPage";
import CourierTasksPage from "./pages/CourierTasksPage";
import { useAuth } from "./auth/AuthContext";

function App() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-lg font-semibold text-slate-900">
              🍕 Food Delivery
            </Link>
            <nav className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
              <Link to="/" className="hover:text-slate-900">
                Рестораны
              </Link>

              {user?.role === "CLIENT" && (
                <Link to="/orders" className="hover:text-slate-900">
                  Мои заказы
                </Link>
              )}

              {user?.role === "RESTAURANT" && (
                <Link to="/restaurant/orders" className="hover:text-slate-900">
                  Заказы ресторатора
                </Link>
              )}

              {user?.role === "COURIER" && (
                <Link to="/courier/tasks" className="hover:text-slate-900">
                  Задачи курьера
                </Link>
              )}

              <Link to="/login" className="hover:text-slate-900">
                Вход
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {loading && <span className="text-slate-500">Проверка...</span>}
            {!loading && user && (
              <>
                <span className="text-slate-700">
                  <span className="font-medium">{user.username}</span>{" "}
                  <span className="text-xs uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={logout}
                  className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Выйти
                </button>
              </>
            )}
            {!loading && !user && (
              <span className="text-slate-500 text-xs">Не авторизован</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<RestaurantsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/restaurants/:id" element={<RestaurantMenuPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/restaurant/orders" element={<RestaurantOrdersPage />} />
          <Route path="/courier/tasks" element={<CourierTasksPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;