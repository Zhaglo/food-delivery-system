import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("client1");
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
      setError(err?.data?.detail || "Ошибка входа");
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Вход</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-slate-700">Логин</label>
            <input
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="client1 / rest_owner1 / courier1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-700">Пароль</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
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
          <p className="text-xs text-slate-500 mt-4">
              Нет аккаунта?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Зарегистрироваться
              </a>
            </p>
        </form>
      </div>
    </div>
  );
}