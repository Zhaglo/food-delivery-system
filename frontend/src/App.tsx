// src/App.tsx
import { Routes, Route, Link, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantMenuPage from "./pages/RestaurantMenuPage";
import OrdersPage from "./pages/OrdersPage";
import RestaurantOrdersPage from "./pages/RestaurantOrdersPage";
import CourierTasksPage from "./pages/CourierTasksPage";
import { useAuth } from "./auth/AuthContext";
import { UtensilsCrossed, Bike, UserCircle2, Store } from "lucide-react";

function App() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  const navLink =
    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900"
            >
              <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              <span>Food Delivery</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1 text-sm text-slate-600">
              <Link
                to="/"
                className={`${navLink} ${
                  isActive("/")
                    ? "bg-slate-100 text-slate-900"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Store className="h-4 w-4" />
                <span>Рестораны</span>
              </Link>

              {user?.role === "CLIENT" && (
                <Link
                  to="/orders"
                  className={`${navLink} ${
                    isActive("/orders")
                      ? "bg-slate-100 text-slate-900"
                      : "hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>Мои заказы</span>
                </Link>
              )}

              {user?.role === "RESTAURANT" && (
                <Link
                  to="/restaurant/orders"
                  className={`${navLink} ${
                    isActive("/restaurant/orders")
                      ? "bg-slate-100 text-slate-900"
                      : "hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>Заказы ресторатора</span>
                </Link>
              )}

              {user?.role === "COURIER" && (
                <Link
                  to="/courier/tasks"
                  className={`${navLink} ${
                    isActive("/courier/tasks")
                      ? "bg-slate-100 text-slate-900"
                      : "hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Bike className="h-4 w-4" />
                  <span>Задачи курьера</span>
                </Link>
              )}

              <Link
                to="/login"
                className={`${navLink} ${
                  isActive("/login")
                    ? "bg-slate-100 text-slate-900"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <UserCircle2 className="h-4 w-4" />
                <span>Вход</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {loading && <span className="text-slate-500">Проверка...</span>}
            {!loading && user && (
              <>
                <span className="flex items-center gap-2 text-slate-700">
                  <UserCircle2 className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{user.username}</span>
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