# Portal App

ReactJS portal app scaffold using Vite, Bootstrap 5, React Router, and Axios.

## Run locally

1. Install dependencies
   npm install
2. Configure environment
   Create .env with:
   VITE_API_BASE_URL=http://localhost:8080
3. Start dev server
   npm run dev

## Structure

- src/api: Axios config and interceptors
- src/pages: Route pages (Login, Home, 404)
- src/components: Shared UI components
- src/routes: Route guards
- src/utils: Auth localStorage helpers

## Auth flow

- Login/Register at /login
- Remember me sends rememberMe=true and stores refreshToken
- Access token auto attached in Authorization header
- Silent refresh on 401 via /auth/refresh
- Redirect back to previous page after login
