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
      // можно ещё раз /auth/me дернуть, но в принципе не обязательно
      await refreshMe();
      navigate("/");
    } catch (err: any) {
      setError(err?.data?.detail || "Ошибка входа");
    }
  }

  return (
    <div>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
        <div>
          <label>
            Логин:
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div>
          <label>
            Пароль:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        <button type="submit" style={{ marginTop: 10 }}>
          Войти
        </button>
      </form>
    </div>
  );
}