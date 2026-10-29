import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

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

        <Route path="/dashboard" element={<Dashboard isAdmin={isAdmin} />} />
      </Routes>
    </BrowserRouter>
  );
}