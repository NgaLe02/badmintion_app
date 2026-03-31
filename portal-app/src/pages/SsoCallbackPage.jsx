import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  REFRESH_TOKEN_KEY,
  clearAuthData,
  saveAuthData,
} from "../utils/authStorage";

function SsoCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const params = new URLSearchParams(hash || window.location.search.slice(1));

    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const userRole = params.get("userRole");
    const state = params.get("state") || "/";

    if (!accessToken) {
      clearAuthData();
      navigate("/login", { replace: true });
      return;
    }

    saveAuthData({
      accessToken,
      refreshToken,
      userRole,
    });

    if (!refreshToken) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    navigate(state, { replace: true });
  }, [navigate]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <h2 className="h4">Đang hoàn tất đăng nhập SSO...</h2>
        <p className="text-secondary mb-0">Vui lòng đợi trong giây lát.</p>
      </div>
    </div>
  );
}

export default SsoCallbackPage;
