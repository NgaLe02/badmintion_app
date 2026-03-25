import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "../utils/authStorage";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const accessToken = getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
