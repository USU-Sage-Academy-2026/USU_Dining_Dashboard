import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

function ProtectedDashboard({ isAdmin }) {
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/session/", { credentials: "same-origin" })
      .then((response) => {
        if (response.status === 401) {
          window.location.replace("/accounts/login/?next=/dashboard/");
          return false;
        }
        if (!response.ok) {
          throw new Error(`Could not verify sign-in (status ${response.status})`);
        }
        return true;
      })
      .then((isAuthorized) => {
        if (active && isAuthorized) setAuthorized(true);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!authorized) return <p>Checking sign-in...</p>;
  return <Dashboard isAdmin={isAdmin} />;
}

function LoginRedirect() {
  useEffect(() => {
    window.location.replace("/accounts/login/");
  }, []);

  return null;
}

export default function App({ isAdmin }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginRedirect />} />

        <Route
          path="/static/frontend/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/login"
          element={<Navigate to="/accounts/login/" replace />}
        />

        <Route
          path="/dashboard"
          element={<ProtectedDashboard isAdmin={isAdmin} />}
        />
      </Routes>
    </BrowserRouter>
  );
}