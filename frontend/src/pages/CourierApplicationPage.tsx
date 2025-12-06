// src/pages/CourierApplicationPage.tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function CourierApplicationPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !phone) {
      setError("Пожалуйста, заполните ФИО и телефон");
      return;
    }

    try {
      setLoading(true);
      await api.post("/delivery/courier/apply/", {
        full_name: fullName,
        phone,
        vehicle_type: vehicleType,
        comment,
      });

      setSuccess("Заявка отправлена. Мы свяжемся с вами после рассмотрения.");
      setFullName("");
      setPhone("");
      setVehicleType("");
      setComment("");

      // Можно, например, через пару секунд вернуть на главную
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      const detail = err?.data?.detail || "Ошибка отправки заявки";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">
        Заявка на регистрацию курьером
      </h1>
      <p className="text-sm text-slate-500 mb-4">
        Заполните форму, чтобы подать заявку на работу курьером. Администратор
        свяжется с вами после рассмотрения.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md mb-3">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-md mb-3">
          {success}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            ФИО
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Телефон
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Тип транспорта (необязательно)
          </label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            placeholder="пешком, велосипед, авто..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Комментарий (необязательно)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
        >
          {loading ? "Отправка заявки..." : "Отправить заявку"}
        </button>
      </form>
    </div>
  );
}