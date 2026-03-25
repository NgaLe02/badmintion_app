import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthData,
  getAccessToken,
  getUserRole,
} from "../utils/authStorage";

function AppNavbar() {
  const navigate = useNavigate();
  const accessToken = getAccessToken();
  const userRole = getUserRole();

  const handleLogout = () => {
    clearAuthData();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          Badmintion Portal
        </Link>
        <div className="d-flex align-items-center gap-2">
          {accessToken ? (
            <>
              <span className="badge text-bg-light border">
                Vai trò: {userRole || "N/A"}
              </span>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link className="btn btn-primary btn-sm" to="/login">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;
