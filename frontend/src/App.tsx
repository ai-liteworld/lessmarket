import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
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
import { Icon } from "./components/icons";

type NavItem = { to: string; label: string; icon: React.ReactNode };

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const items: NavItem[] = [
    { to: "/", label: "Home", icon: <Icon.Home /> },
    { to: "/search", label: "Browse", icon: <Icon.Search /> },
    { to: "/profile", label: "Profile", icon: <Icon.User /> },
    { to: "/sell", label: "Post Ad", icon: <Icon.Plus /> },
    { to: "/manage-ads", label: "Manage Ads", icon: <Icon.List /> },
  ];

  return (
    <nav className="fixed right-0 top-0 z-40 flex h-full w-16 flex-col items-center justify-center gap-3 border-l border-[var(--border)] bg-[var(--background)]">
      {items.map(({ to, label, icon }) => (
        <Link
          key={to}
          to={to}
          title={label}
          className={`sidebar-icon flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted-foreground)] ${
            location.pathname === to ? "active" : ""
          }`}
        >
          {icon}
        </Link>
      ))}
      <div className="mt-6 flex w-full justify-center border-t border-[var(--border)] pt-4">
        <button
          onClick={onLogout}
          title="Log out"
          className="sidebar-icon flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-red-400"
        >
          <Icon.LogOut />
        </button>
      </div>
    </nav>
  );
}

function GuestHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
          Less<span className="text-[var(--accent)]">.</span>Market
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/search" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Browse
          </Link>
          <Link to="/login" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-[var(--radius-md)] bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const token = useAppStore((s) => s.token);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)]" style={{ fontFamily: "var(--font-body)" }}>
      {token ? (
        <Sidebar
          onLogout={() => {
            logout();
            navigate("/");
          }}
        />
      ) : (
        <GuestHeader />
      )}
      <main className={token ? "pr-16" : ""}>
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
