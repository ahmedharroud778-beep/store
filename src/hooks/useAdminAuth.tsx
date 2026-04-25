// src/hooks/useAdminAuth.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getAdminToken, clearAdminToken, ADMIN_PATH } from "../utils/adminApi";

export default function useAdminAuth() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate(ADMIN_PATH, { replace: true });
    }
  }, [navigate]);

  function forceLogout() {
    clearAdminToken();
    navigate(ADMIN_PATH, { replace: true });
  }

  return { forceLogout };
}

