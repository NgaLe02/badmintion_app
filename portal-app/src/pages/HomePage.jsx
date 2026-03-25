import { getUserRole } from "../utils/authStorage";

function HomePage() {
  const role = getUserRole();

  return (
    <div className="card home-card">
      <div className="card-body p-4 p-md-5">
        <h1 className="h3 mb-3">Chào mừng đến với Cổng thông tin</h1>
        <p className="text-secondary mb-2">Bạn đã đăng nhập thành công.</p>
        <p className="mb-0">
          Vai trò hiện tại:{" "}
          <span className="fw-semibold">{role || "USER"}</span>
        </p>
      </div>
    </div>
  );
}

export default HomePage;
