import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser, refreshMe } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const user = await api.post("/auth/login/", { username, password });
      setUser(user);
      await refreshMe();
      navigate("/");
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка входа. Проверьте логин и пароль.");
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          Вход в аккаунт
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700" htmlFor="username">
              Логин
            </label>
            <input
              id="username"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>

          <p className="text-xs text-slate-500 mt-3 text-center">
            Нет аккаунта?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}