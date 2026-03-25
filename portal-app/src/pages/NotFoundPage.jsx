import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-6">404 - Không tìm thấy trang</h1>
      <p className="text-secondary">Trang bạn tìm không tồn tại.</p>
      <Link className="btn btn-primary" to="/">
        Quay về trang chủ
      </Link>
    </div>
  );
}

export default NotFoundPage;
