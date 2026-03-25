import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { REFRESH_TOKEN_KEY, saveAuthData } from "../utils/authStorage";

function SignupPage() {
  const navigate = useNavigate();
  const googleButtonContainerRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const onInputChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = async () => {
    await api.post("/auth/register", {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });

    setSuccessMessage("Đăng ký thành công. Vui lòng đăng nhập.");
    setTimeout(() => navigate("/login", { replace: true }), 600);
  };

  const handleGoogleRegister = async (googleCredential) => {
    const response = await api.post("/auth/google/register", {
      idToken: googleCredential,
      rememberMe: formData.rememberMe,
    });

    const { accessToken, refreshToken, userRole } = response.data || {};
    if (!accessToken) {
      throw new Error("Đăng ký Google thất bại: thiếu accessToken.");
    }

    saveAuthData({
      accessToken,
      userRole,
      refreshToken: formData.rememberMe ? refreshToken : null,
    });

    if (!(formData.rememberMe && refreshToken)) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity || !googleButtonContainerRef.current) {
      return;
    }

    googleIdentity.initialize({
      client_id: googleClientId,
      callback: async (googleResponse) => {
        setGoogleLoading(true);
        setErrorMessage("");
        try {
          await handleGoogleRegister(googleResponse?.credential);
        } catch (error) {
          const backendMessage = error?.response?.data?.message;
          setErrorMessage(
            backendMessage || "Đăng ký Google thất bại. Vui lòng thử lại.",
          );
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    googleButtonContainerRef.current.innerHTML = "";
    googleIdentity.renderButton(googleButtonContainerRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      shape: "pill",
      text: "signup_with",
    });
  }, [googleClientId, formData.rememberMe]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await handleSignup();
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
                <h2 className="fw-bold text-center mb-2">Đăng ký</h2>
                <p className="text-secondary text-center mb-4">
                  Tạo tài khoản mới để sử dụng hệ thống.
                </p>

                {errorMessage && (
                  <div className="alert alert-danger">{errorMessage}</div>
                )}
                {successMessage && (
                  <div className="alert alert-success">{successMessage}</div>
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
                      Ghi nhớ đăng nhập sau khi đăng ký Google
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Tạo tài khoản"}
                  </button>
                </form>

                <div className="text-center my-3 text-secondary">hoặc</div>

                {!googleClientId && (
                  <div className="alert alert-warning py-2" role="alert">
                    Chưa cấu hình Google OAuth Client ID. Vui lòng đặt
                    VITE_GOOGLE_CLIENT_ID.
                  </div>
                )}

                <div className="d-flex justify-content-center">
                  <div ref={googleButtonContainerRef} />
                </div>

                {googleLoading && (
                  <p className="text-center text-secondary mt-2 mb-0">
                    Đang xác thực với Google...
                  </p>
                )}

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
