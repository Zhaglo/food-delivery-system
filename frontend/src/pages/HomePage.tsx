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
  CheckCircle2,
  TrendingUp,
  Clock3,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero-блок */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white p-6 shadow-md">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs mb-2">
              <ShieldCheck className="h-3 w-3" />
              <span>Единая система управления заказами и доставкой</span>
            </div>
            <h1 className="text-2xl md:text-xl font-semibold mb-2">
              Платформа для клиентов, ресторанов и курьеров
            </h1>
            <p className="text-sm md:text-base text-blue-100">
              Клиент оформляет заказ, ресторан готовит, курьер доставляет.
              <br />
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
          variant="client"
          icon={<UtensilsCrossed className="h-6 w-6" />}
          title="Для клиентов"
          description="Выбирайте ресторан, просматривайте меню, оформляйте заказ и отслеживайте статус доставки в одном месте."
          linkLabel={
            user?.role === "CLIENT" ? "Открыть рестораны" : "Войти как клиент"
          }
          to={user?.role === "CLIENT" ? "/restaurants" : "/login"}
        />
        <RoleCard
          variant="restaurant"
          icon={<Store className="h-6 w-6" />}
          title="Для ресторанов"
          description="Управляйте потоком заказов, следите за статусами и загруженностью кухни без хаоса в мессенджерах."
          linkLabel={
            user?.role === "RESTAURANT"
              ? "Перейти к заказам"
              : "Подключить ресторан"
          }
          to={
            user?.role === "RESTAURANT"
              ? "/restaurant/orders"
              : "/apply/restaurant"
          }
        />
        <RoleCard
          variant="courier"
          icon={<Bike className="h-6 w-6" />}
          title="Для курьеров"
          description="Получайте задачи доставки, смотрите адреса и статусы, отмечайте выполнение заказов в пару кликов."
          linkLabel="Оставить заявку курьера"
          to="/apply/courier"
        />
      </section>

      {/* Интегрированный блок: как работает платформа и чем она полезна */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

        {/* Заголовок */}
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Как работает платформа и что она даёт участникам
          </h2>
          <p className="text-xs text-slate-500 max-w-4xl mt-1">
            Сервис объединяет клиента, ресторан и курьера в одну цепочку:
            заказы не теряются, статусы прозрачны, а доставка предсказуема.
          </p>
        </div>

        <div className="border-t border-slate-200" />

        {/* Основная сетка */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Шаги процесса */}
          <div className="h-full flex flex-col justify-between space-y-6 text-sm">
            <StepItem
              step="1"
              title="Клиент оформляет заказ"
              description="Выбирает ресторан, добавляет блюда в корзину и указывает адрес доставки."
            />
            <StepItem
              step="2"
              title="Ресторан готовит"
              description="Получает заказ, отмечает этапы приготовления и передаёт его курьеру."
            />
            <StepItem
              step="3"
              title="Курьер доставляет"
              description="Берёт задачу, видит адрес и контакт клиента, отмечает успешную доставку."
            />
          </div>

          {/* Тёмная карточка */}
          <div className="h-full">
            <div className="bg-slate-900 text-slate-50 rounded-2xl p-5 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Фокус на стабильной и понятной доставке
                </h3>
                <p className="text-xs text-slate-300 mb-4">
                  Платформа снижает количество ручных согласований и даёт
                  одинаково понятную картину процесса для клиента, ресторана
                  и курьера.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <MetricItem label="заказов в единой цепочке" value="1 путь" />
                <MetricItem label="ролей в системе" value="3 роли" />
                <MetricItem label="хаоса в мессенджерах" value="0 чатов" />
                <MetricItem label="этапов статуса заказа" value="от кухни до двери" />
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя полоса */}
        <div className="border-t border-slate-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <FeatureItem
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              title="Прозрачные статусы"
              description="Каждый видит этап: оформление, приготовление, передача курьеру, доставка."
            />
            <FeatureItem
              icon={<Clock3 className="h-4 w-4 text-blue-500" />}
              title="Меньше ожидания и хаоса"
              description="Ресторан не теряет заказы, курьер не путает адреса, клиент не ждёт «вслепую»."
            />
            <FeatureItem
              icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
              title="Готово к росту"
              description="Архитектура выдерживает рост числа ресторанов, курьеров и заказов."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type RoleVariant = "client" | "restaurant" | "courier";

const roleCardColors: Record<
  RoleVariant,
  {
    bg: string;
    text: string;
    hover: string;
    accentBg: string;
    accentIcon: string;
  }
> = {
  client: {
    bg: "bg-blue-50",
    text: "text-blue-950",
    hover: "hover:bg-blue-100",
    accentBg: "bg-white/80",
    accentIcon: "text-blue-600",
  },
  restaurant: {
    bg: "bg-emerald-50",
    text: "text-emerald-950",
    hover: "hover:bg-emerald-100",
    accentBg: "bg-white/80",
    accentIcon: "text-emerald-600",
  },
  courier: {
    bg: "bg-orange-50",
    text: "text-orange-950",
    hover: "hover:bg-orange-100",
    accentBg: "bg-white/80",
    accentIcon: "text-orange-500",
  },
};

type RoleCardProps = {
  variant: RoleVariant;
  icon: React.ReactNode;
  title: string;
  description: string;
  linkLabel: string;
  to: string;
};

function RoleCard({
  variant,
  icon,
  title,
  description,
  linkLabel,
  to,
}: RoleCardProps) {
  const palette = roleCardColors[variant];

  return (
    <div
      className={`
        group
        rounded-3xl
        border border-white/70
        shadow-md
        p-6 md:p-8
        flex flex-col
        h-full
        min-h-[230px] md:min-h-[260px]
        transition-all
        ${palette.bg} ${palette.text} ${palette.hover}
        hover:-translate-y-1 hover:shadow-lg
      `}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`
            h-14 w-14 md:h-16 md:w-16
            rounded-2xl
            flex items-center justify-center
            shadow-sm
            ${palette.accentBg}
          `}
        >
          <div className={`${palette.accentIcon} [&>svg]:h-8 [&>svg]:w-8`}>
            {icon}
          </div>
        </div>
        <h3 className="text-base md:text-lg font-semibold">{title}</h3>
      </div>

      <p className="text-sm md:text-[15px] opacity-85 flex-1 leading-relaxed">
        {description}
      </p>

      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-1 text-sm md:text-[15px] font-semibold underline-offset-4 group-hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-xs font-semibold text-slate-900 mb-0.5">
          {title}
        </div>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
    </div>
  );
}

type MetricItemProps = {
  value: string;
  label: string;
};

function MetricItem({ value, label }: MetricItemProps) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold">{value}</span>
      <span className="mt-0.5 text-[11px] text-slate-300">{label}</span>
    </div>
  );
}

type StepItemProps = {
  step: string;
  title: string;
  description: string;
};

function StepItem({ step, title, description }: StepItemProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shadow-sm">
        {step}
      </div>

      <div>
        <div className="text-sm font-semibold text-slate-900 mb-1">
          {title}
        </div>
        <p className="text-sm text-slate-600 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}