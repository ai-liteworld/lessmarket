import { Routes, Route, Link } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import SellPage from "./pages/SellPage";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <nav className="flex gap-4 border-b p-4">
        <Link to="/" className="font-semibold">lessmarket</Link>
        <Link to="/sell">Sell</Link>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/sell" element={<SellPage />} />
        </Routes>
      </main>
    </div>
  );
}
