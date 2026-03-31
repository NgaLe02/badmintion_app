import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

function SsoEntryPage({ mode = "login" }) {
  const location = useLocation();

  const targetUrl = useMemo(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const redirectUri = `${window.location.origin}/sso/callback`;

    const stateFromRoute = location.state?.from?.pathname;
    const state = mode === "login" ? stateFromRoute || "/" : "/";
    const ssoPath = mode === "register" ? "/sso/register" : "/sso/login";

    return (
      `${apiBaseUrl}${ssoPath}?` +
      new URLSearchParams({
        redirect_uri: redirectUri,
        state,
      }).toString()
    );
  }, [location.state, mode]);

  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <h2 className="h4">Đang chuyển đến SSO...</h2>
        <p className="text-secondary mb-3">
          Nếu không tự chuyển, bấm nút bên dưới.
        </p>
        <a href={targetUrl} className="btn btn-primary">
          Đi đến SSO
        </a>
      </div>
    </div>
  );
}

export default SsoEntryPage;
