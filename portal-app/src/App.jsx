import AppNavbar from "./components/AppNavbar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const isDev = import.meta.env.VITE_DEV;

  return (
    <div className="min-vh-100 bg-light">
      <AppNavbar />
      <main className="container py-4">
        <AppRoutes isDev={isDev} />
      </main>
    </div>
  );
}

export default App;
