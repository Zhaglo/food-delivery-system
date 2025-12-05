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
    <div>
      <header style={{ padding: "10px", borderBottom: "1px solid #ccc", marginBottom: 16 }}>
        <Link to="/">Рестораны</Link>{" "}
        {user && user.role === "CLIENT" && (
          <>
            | <Link to="/orders">Мои заказы</Link>
          </>
        )}
        {user && user.role === "RESTAURANT" && (
          <>
            | <Link to="/restaurant/orders">Заказы ресторатора</Link>
          </>
        )}
        {user && user.role === "COURIER" && (
          <>
            | <Link to="/courier/tasks">Задачи курьера</Link>
          </>
        )}
        {" | "}
        <Link to="/login">Вход</Link>

        <span style={{ float: "right" }}>
          {loading && <span>Проверка авторизации...</span>}
          {!loading && user && (
            <>
              <span>
                Вы вошли как <strong>{user.username}</strong> ({user.role})
              </span>
              <button
                onClick={logout}
                style={{ marginLeft: 8 }}
              >
                Выйти
              </button>
            </>
          )}
          {!loading && !user && <span>Не авторизован</span>}
        </span>
      </header>

      <main style={{ padding: "10px" }}>
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