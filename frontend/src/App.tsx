import { Routes, Route, Link, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SearchPage from "./pages/SearchPage";
import SellPage from "./pages/SellPage";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ManageAdsPage from "./pages/ManageAdsPage";
import AdDetailPage from "./pages/AdDetailPage";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <nav className="flex flex-wrap items-center gap-4 border-b p-4">
        <Link to="/" className="font-semibold">lessmarket</Link>
        <Link to="/search">Browse</Link>
        {token ? (
          <>
            <Link to="/sell">Sell</Link>
            <Link to="/manage-ads">My ads</Link>
            <div className="ml-auto flex items-center gap-4">
              <Link to="/profile" className="text-sm text-neutral-600">
                {user?.full_name || "My account"}
              </Link>
              <button
                className="text-sm text-neutral-500"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </div>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-4">
            <Link to="/login" className="text-sm">Log in</Link>
            <Link to="/signup" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
              Sign up
            </Link>
          </div>
        )}
      </nav>
      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/manage-ads" element={<ManageAdsPage />} />
          <Route path="/ad/:id" element={<AdDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
