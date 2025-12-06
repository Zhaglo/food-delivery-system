// src/pages/HomePage.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  UtensilsCrossed,
  Bike,
  Store,
  ArrowRight,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handlePrimaryAction() {
    if (!user) {
      navigate("/login");
      return;
    }

    switch (user.role) {
      case "CLIENT":
        navigate("/restaurants");
        break;
      case "RESTAURANT":
        navigate("/restaurant/orders");
        break;
      case "COURIER":
        navigate("/courier/tasks");
        break;
      default:
        navigate("/login");
    }
  }

  const primaryLabel = !user
    ? "Войти в систему"
    : user.role === "CLIENT"
    ? "Перейти к ресторанам"
    : user.role === "RESTAURANT"
    ? "Перейти к заказам ресторатора"
    : user.role === "COURIER"
    ? "Перейти к задачам курьера"
    : "Перейти в систему";

  return (
    <div className="space-y-6">
      {/* Hero-блок */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white p-6 shadow-md">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs mb-2">
              <ShieldCheck className="h-3 w-3" />
              <span>Единая система управления заказами и доставкой</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">
              Платформа для клиентов, ресторанов и курьеров
            </h1>
            <p className="text-sm md:text-base text-blue-100">
              Клиент оформляет заказ, ресторан готовит, курьер доставляет.
              Система координирует все роли и статус заказа на каждом этапе.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <button
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-2 rounded-full bg-white text-blue-700 px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-50 transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </button>

            {!user && (
              <p className="text-xs text-blue-100">
                Нет аккаунта? Для демонстрации можно использовать заранее
                созданные тестовые учётные записи клиента, ресторатора и курьера.
              </p>
            )}

            {user && (
              <p className="flex items-center gap-2 text-xs text-blue-100">
                <UserCircle2 className="h-4 w-4" />
                <span>
                  Вы вошли как <b>{user.username}</b> ({user.role})
                </span>
              </p>
            )}
          </div>
        </div>

        {/* декоративные элементы */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Блок "Для кого система" */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RoleCard
          icon={<UtensilsCrossed className="h-6 w-6 text-blue-600" />}
          title="Для клиентов"
          description="Выбирайте ресторан, просматривайте меню, оформляйте заказ и отслеживайте статус доставки в реальном времени."
          linkLabel={user?.role === "CLIENT" ? "Открыть рестораны" : "Войти как клиент"}
          to={user?.role === "CLIENT" ? "/restaurants" : "/login"}
        />
        <RoleCard
          icon={<Store className="h-6 w-6 text-emerald-600" />}
          title="Для ресторанов"
          description="Управляйте заказами, отслеживайте этапы приготовления и контролируйте нагрузку на кухню."
          linkLabel={
            user?.role === "RESTAURANT"
              ? "Перейти к заказам"
              : "Войти как ресторатор"
          }
          to={user?.role === "RESTAURANT" ? "/restaurant/orders" : "/login"}
        />
        <RoleCard
          icon={<Bike className="h-6 w-6 text-orange-500" />}
          title="Для курьеров"
          description="Получайте задачи доставки, просматривайте адреса клиентов и отмечайте выполнение заказов. Для начала оставьте заявку, и администратор подключит вас к системе."
          linkLabel="Оставить заявку курьера"
          to="/apply/courier"
        />
      </section>

      {/* Небольшой текст о системе */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-sm text-slate-700 space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          О системе
        </h2>
        <p>
          Данное приложение моделирует типичную архитектуру системы управления
          заказами и доставкой еды. Серверная часть реализована на Django с
          использованием паттерна MVT, клиентская — на React с REST API.
        </p>
        <p className="text-slate-500 text-xs">
          В рамках курсовой работы система демонстрирует работу с ролями,
          управление статусами заказов и доставок, а также базовую архитектуру,
          которую в дальнейшем можно масштабировать до микросервисного решения.
        </p>
      </section>
    </div>
  );
}

type RoleCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkLabel: string;
  to: string;
};

function RoleCard({ icon, title, description, linkLabel, to }: RoleCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-xs text-slate-600 flex-1">{description}</p>
      <Link
        to={to}
        className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
      >
        {linkLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}