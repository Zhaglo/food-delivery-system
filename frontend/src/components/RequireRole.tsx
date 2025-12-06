import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type Role = "CLIENT" | "RESTAURANT" | "COURIER" | "ADMIN";

type Props = {
  allowed: Role[];
  children: ReactNode;
};

export function RequireRole({ allowed, children }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        Проверка доступа...
      </div>
    );
  }

  // не авторизован → отправляем на /login c информацией, откуда пришёл
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // авторизован, но роль не подходит
  if (!allowed.includes(user.role)) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
        Доступ запрещён для роли {user.role}
      </div>
    );
  }

  return <>{children}</>;
}