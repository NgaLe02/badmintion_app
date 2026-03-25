import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { REFRESH_TOKEN_KEY, saveAuthData } from "../utils/authStorage";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const onInputChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleRegister = async () => {
    await api.post("/auth/register", {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });

    setSuccessMessage("Đăng ký thành công. Vui lòng đăng nhập.");
    setIsLoginMode(true);
  };

  const handleLogin = async () => {
    const response = await api.post("/auth/login", {
      username: formData.username,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });

    const { accessToken, refreshToken, userRole } = response.data || {};

    if (!accessToken) {
      throw new Error("Đăng nhập thất bại: thiếu accessToken.");
    }

    saveAuthData({
      accessToken,
      userRole,
      refreshToken: formData.rememberMe ? refreshToken : null,
    });

    if (!(formData.rememberMe && refreshToken)) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    navigate(from, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    resetMessages();

    try {
      if (isLoginMode) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setErrorMessage(backendMessage || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5">
            <div className="card auth-card">
              <div className="card-body p-4 p-md-5">
                <h2 className="fw-bold text-center mb-2">
                  {isLoginMode ? "Đăng nhập" : "Đăng ký"}
                </h2>
                <p className="text-secondary text-center mb-4">
                  Sử dụng tài khoản để tiếp tục vào hệ thống.
                </p>

                {errorMessage && (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-medium">
                      Tên đăng nhập
                    </label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      className="form-control form-control-lg"
                      value={formData.username}
                      onChange={onInputChange}
                      required
                    />
                  </div>

                  {!isLoginMode && (
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-medium">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        className="form-control form-control-lg"
                        value={formData.email}
                        onChange={onInputChange}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">
                      Mật khẩu
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      className="form-control form-control-lg"
                      value={formData.password}
                      onChange={onInputChange}
                      required
                    />
                  </div>

                  {isLoginMode && (
                    <div className="form-check mb-4">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        name="rememberMe"
                        className="form-check-input"
                        checked={formData.rememberMe}
                        onChange={onInputChange}
                      />
                      <label htmlFor="rememberMe" className="form-check-label">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading
                      ? "Đang xử lý..."
                      : isLoginMode
                        ? "Đăng nhập"
                        : "Tạo tài khoản"}
                  </button>
                </form>

                <div className="text-center mt-4">
                  {isLoginMode ? (
                    <p className="mb-0">
                      Chưa có tài khoản?{" "}
                      <button
                        type="button"
                        className="btn btn-link p-0 align-baseline"
                        onClick={() => {
                          setIsLoginMode(false);
                          resetMessages();
                        }}
                      >
                        Đăng ký ngay
                      </button>
                    </p>
                  ) : (
                    <p className="mb-0">
                      Đã có tài khoản?{" "}
                      <button
                        type="button"
                        className="btn btn-link p-0 align-baseline"
                        onClick={() => {
                          setIsLoginMode(true);
                          resetMessages();
                        }}
                      >
                        Đăng nhập
                      </button>
                    </p>
                  )}
                </div>

                <div className="text-center mt-2">
                  <Link to="/" className="small text-decoration-none">
                    Quay về trang chủ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
