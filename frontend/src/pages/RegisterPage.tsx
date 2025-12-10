import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register/", {
        username,
        email,
        password,
        password2,
        display_name: displayName || null,
        phone: phone || null,
      });

      navigate("/login");
    } catch (err: any) {
      const detail =
        err?.data?.detail ||
        (Array.isArray(err?.data?.errors) ? err.data.errors.join("; ") : null) ||
        "Ошибка регистрации";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">
        Регистрация клиента
      </h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md mb-3">
          {error}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Имя пользователя
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="login"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Отображаемое имя (необязательно)
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Иван"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Телефон (необязательно)
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 999 999 99 99"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Email (необязательно)
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="mail@mail.ru"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Пароль
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Повторите пароль
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
        >
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}