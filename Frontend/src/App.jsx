import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

export default function App({ isAdmin }) {
  return (
    <BrowserRouter>
      <Routes>
        {/* Automatically redirect /static/frontend/ (and /) to /dashboard */}
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