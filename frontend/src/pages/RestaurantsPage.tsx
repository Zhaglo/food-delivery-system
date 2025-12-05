import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type Restaurant = {
  id: number;
  name: string;
  address: string;
  description: string;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/restaurants/")
      .then(setRestaurants)
      .catch((err: any) => setError(err?.data?.detail || "Ошибка загрузки ресторанов"));
  }, []);

  return (
    <div>
      <h2>Рестораны</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <ul>
        {restaurants.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            <strong>{r.name}</strong> — {r.address}
            <br />
            <span>{r.description}</span>
            <br />
            <Link to={`/restaurants/${r.id}`}>Меню</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}