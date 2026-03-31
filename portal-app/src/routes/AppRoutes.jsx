import { Navigate, Route, Routes } from "react-router-dom";
import DebugTokenPage from "../pages/DebugTokenPage";
import HomePage from "../pages/HomePage";
import LogoutPage from "../pages/LogoutPage";
import NotFoundPage from "../pages/NotFoundPage";
import SsoCallbackPage from "../pages/SsoCallbackPage";
import SsoEntryPage from "../pages/SsoEntryPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes({ isDev }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          //   <ProtectedRoute>
          <HomePage />
          //   </ProtectedRoute>
        }
      />
      <Route path="/login" element={<SsoEntryPage mode="login" />} />
      <Route path="/signup" element={<SsoEntryPage mode="register" />} />
      <Route path="/sso/callback" element={<SsoCallbackPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      {isDev && <Route path="/debug/tokens" element={<DebugTokenPage />} />}
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
