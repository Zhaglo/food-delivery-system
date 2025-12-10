import { Routes, Route, Link, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantMenuPage from "./pages/RestaurantMenuPage";
import OrdersPage from "./pages/OrdersPage";
import ClientOrderDetailPage from "./pages/ClientOrderDetailPage";
import RestaurantOrdersPage from "./pages/RestaurantOrdersPage";
import CourierTasksPage from "./pages/CourierTasksPage";
import CourierOffersPage from "./pages/CourierOffersPage";
import CourierApplicationPage from './pages/CourierApplicationPage';
import RestaurantApplicationPage from "./pages/RestaurantApplicationPage";
import RestaurantOrderDetailPage from "./pages/RestaurantOrderDetailPage";
import RestaurantMenuManagePage from "./pages/RestaurantMenuManagePage";
import RestaurantStatsPage from "./pages/RestaurantStatsPage";
import { useAuth } from "./auth/AuthContext";
import { RequireRole } from "./components/RequireRole";
import RedirectHomeByRole from "./components/RedirectHomeByRole";
import { UtensilsCrossed, Bike, UserCircle2, Store, ListChecks, BarChart3, Github, Mail } from "lucide-react";

function App() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  const navLink =
    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Лого */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900"
            >
              <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              <span>Food Delivery</span>
            </Link>

            {/* Навигация */}
            <nav className="hidden sm:flex items-center gap-1 text-sm text-slate-600">


              {/* Клиент: рестораны + мои заказы */}
              {user?.role === "CLIENT" && (
                <>
                  <Link
                    to="/restaurants"
                    className={`${navLink} ${
                      isActive("/restaurants")
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    <span>Рестораны</span>
                  </Link>
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
                </>
              )}

              {/* Ресторатор: заказы + управление меню */}
              {user?.role === "RESTAURANT" && (
                <>
                  <Link
                    to="/restaurant/orders"
                    className={`${navLink} ${
                      isActive("/restaurant/orders")
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    <span>Заказы ресторана</span>
                  </Link>

                  <Link
                    to="/restaurant/menu"
                    className={`${navLink} ${
                      isActive("/restaurant/menu")
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>Меню ресторана</span>
                  </Link>
                  <Link
                    to="/restaurant/stats"
                    className={`${navLink} ${
                      isActive("/restaurant/stats")
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Статистика</span>
                  </Link>
                </>
              )}

              {/* Курьер: задачи и офферы */}
              {user?.role === "COURIER" && (
                <>
                  <Link
                    to="/courier/offers"
                    className={`${navLink} ${
                      isActive("/courier/offers")
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <ListChecks className="h-4 w-4" />
                    <span>Доступные заказы</span>
                  </Link>

                  <Link
                    to="/courier/tasks"
                    className={`${navLink} ${
                      isActive("/courier/tasks")
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Bike className="h-4 w-4" />
                    <span>Мои задачи</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Правый блок: информация о пользователе */}
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
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <UserCircle2 className="h-4 w-4 text-slate-400" />
                <span>Вход</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <Routes>
          {/* Главная визитка — доступна всем */}
          <Route
              path="/"
              element={
                user ? <RedirectHomeByRole /> : <HomePage />
              }
          />

          <Route path="/apply/courier" element={<CourierApplicationPage />} />
          <Route path="/apply/restaurant" element={<RestaurantApplicationPage />} />

          {/* Логин */}
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          {/* Список ресторанов — только клиент */}
          <Route
            path="/restaurants"
            element={
              <RequireRole allowed={["CLIENT"]}>
                <RestaurantsPage />
              </RequireRole>
            }
          />

          {/* Меню ресторана — только клиент */}
          <Route
            path="/restaurants/:id"
            element={
              <RequireRole allowed={["CLIENT"]}>
                <RestaurantMenuPage />
              </RequireRole>
            }
          />

          {/* Мои заказы — только клиент */}
          <Route
            path="/orders"
            element={
              <RequireRole allowed={["CLIENT"]}>
                <OrdersPage />
              </RequireRole>
            }
          />

          {/* Детали заказа клиента */}
          <Route
            path="/orders/:id"
            element={
              <RequireRole allowed={["CLIENT"]}>
                <ClientOrderDetailPage />
              </RequireRole>
            }
          />

          {/* Заказы ресторатора — только ресторатор (и админ, если есть) */}
          <Route
            path="/restaurant/orders"
            element={
              <RequireRole allowed={["RESTAURANT", "ADMIN"]}>
                <RestaurantOrdersPage />
              </RequireRole>
            }
          />

          <Route
              path="/restaurant/orders/:id"
              element={
                <RequireRole allowed={["RESTAURANT", "ADMIN"]}>
                  <RestaurantOrderDetailPage />
                </RequireRole>
              }
          />

          <Route
              path="/restaurant/menu"
              element={
                <RequireRole allowed={["RESTAURANT", "ADMIN"]}>
                  <RestaurantMenuManagePage />
                </RequireRole>
              }
          />

          <Route
            path="/restaurant/stats"
            element={
              <RequireRole allowed={["RESTAURANT", "ADMIN"]}>
                <RestaurantStatsPage />
              </RequireRole>
            }
          />

          {/* Задачи курьера — только курьер (и админ, если есть) */}
          <Route
            path="/courier/tasks"
            element={
              <RequireRole allowed={["COURIER", "ADMIN"]}>
                <CourierTasksPage />
              </RequireRole>
            }
          />
          {/* Курьер: доступные заказы */}
          <Route
            path="/courier/offers"
            element={
              <RequireRole allowed={["COURIER"]}>
                <CourierOffersPage />
              </RequireRole>
            }
          />
        </Routes>
      </main>

      <footer className="mt-4 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} Food Delivery. Все права защищены.
          </span>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Zhaglo/food-delivery-system"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-700"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>

            <a
              href="https://t.me/rockpaperscizzors"
              className="inline-flex items-center gap-1 hover:text-slate-700"
            >
              <Mail className="h-4 w-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;