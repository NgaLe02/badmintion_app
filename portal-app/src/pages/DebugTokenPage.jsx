import {
  getAccessToken,
  getRefreshToken,
  getUserRole,
} from "../utils/authStorage";

function DebugTokenPage() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const userRole = getUserRole();

  return (
    <div className="card">
      <div className="card-body p-4 p-md-5">
        <h1 className="h4 mb-2">Debug Token (Dev)</h1>
        <p className="text-secondary mb-4">
          Trang nay chi dung cho che do dev. Hay xoa sau khi test.
        </p>

        <div className="mb-4">
          <h2 className="h6">Access token</h2>
          <pre className="bg-light border rounded p-3 text-break">
            {accessToken || "(empty)"}
          </pre>
        </div>

        <div className="mb-4">
          <h2 className="h6">Refresh token</h2>
          <pre className="bg-light border rounded p-3 text-break">
            {refreshToken || "(empty)"}
          </pre>
        </div>

        <div>
          <h2 className="h6">User role</h2>
          <pre className="bg-light border rounded p-3 text-break">
            {userRole || "(empty)"}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default DebugTokenPage;
