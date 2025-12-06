// src/components/RedirectHomeByRole.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
    default:
      return <Navigate to="/" replace />;
  }
}