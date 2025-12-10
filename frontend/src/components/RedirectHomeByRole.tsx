// src/components/RedirectHomeByRole.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ShieldCheck } from "lucide-react";

export default function RedirectHomeByRole() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  switch (user.role) {
    case "CLIENT":
      return <Navigate to="/restaurants" replace />;

    case "RESTAURANT":
      return <Navigate to="/restaurant/orders" replace />;

    case "COURIER":
      return <Navigate to="/courier/tasks" replace />;

    case "ADMIN":
      // Вместо редиректа — простая страничка с кнопкой в Django Admin
      return (
        <div className="max-w-xl mx-auto mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Панель администратора
              </h1>
              <p className="text-xs text-slate-500">
                Вы вошли как пользователь с правами администратора.
                Управление данными системы выполняется через Django Admin.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a
              href="/admin/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Открыть Django Admin
            </a>
            <p className="text-xs text-slate-500">
              Если панель не открывается, убедитесь, что маршрут
              <span className="font-mono"> /admin/ </span>
              проксируется на backend в конфигурации Nginx.
            </p>
          </div>
        </div>
      );

    default:
      return <Navigate to="/" replace />;
  }
}