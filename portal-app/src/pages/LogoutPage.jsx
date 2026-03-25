import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { clearAuthData, getRefreshToken } from "../utils/authStorage";

function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      const refreshToken = getRefreshToken();

      try {
        if (refreshToken) {
          await api.post("/auth/logout", { refreshToken });
        }
      } catch (error) {
        console.warn("Logout API failed, fallback to local logout", error);
      } finally {
        clearAuthData();
        navigate("/login", { replace: true });
      }
    };

    logout();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="text-center">
        <div
          className="spinner-border text-primary"
          role="status"
          aria-hidden="true"
        />
        <p className="mt-3 mb-0 text-secondary">Đang đăng xuất...</p>
      </div>
    </div>
  );
}

export default LogoutPage;
