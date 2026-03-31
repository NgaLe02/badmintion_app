import { Link } from "react-router-dom";
import { getAccessToken, getUserRole } from "../utils/authStorage";

function AppNavbar() {
  const accessToken = getAccessToken();
  const userRole = getUserRole();

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
              <Link className="btn btn-outline-danger btn-sm" to="/logout">
                Đăng xuất
              </Link>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary btn-sm" to="/signup">
                Đăng ký SSO
              </Link>
              <Link className="btn btn-primary btn-sm" to="/login">
                Đăng nhập SSO
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;
