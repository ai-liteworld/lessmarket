import React from "react";
import ReactDOM from "react-dom/client";
// HashRouter (not BrowserRouter) because GitHub Pages is pure static
// hosting with no server-side rewrites: a direct link or refresh on e.g.
// /sell would 404 under BrowserRouter. Hash-based routes (#/sell) never
// touch the server on navigation, so they work unmodified on Pages.
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
