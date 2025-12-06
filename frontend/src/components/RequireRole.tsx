// src/components/RequireRole.tsx
import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type Role = "CLIENT" | "RESTAURANT" | "COURIER" | "ADMIN";

type Props = {
  allowed: Role[];
  children: ReactNode;
};

/**
 * Оборачиваем страницы, чтобы пускать только нужные роли.
 * Если пользователь не авторизован — отправим на /login.
 * Если роль не подходит — покажем "Доступ запрещён".
 */
export function RequireRole({ allowed, children }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div className="text-sm text-slate-500">Проверка доступа...</div>;
  }

  if (!user) {
    // не авторизован → отправляем на логин и можем передать, откуда пришёл
    navigate("/login", { state: { from: location.pathname } });
    return null;
  }

  if (!allowed.includes(user.role)) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
        Доступ запрещён для роли {user.role}
      </div>
    );
  }

  return <>{children}</>;
}