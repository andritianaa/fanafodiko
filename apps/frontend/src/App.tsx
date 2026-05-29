import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import MainLayout from "@/components/layout/MainLayout"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"
import DashboardPage from "@/pages/dashboard/DashboardPage"
import SchedulePage from "@/pages/schedule/SchedulePage"
import MedicationsPage from "@/pages/medications/MedicationsPage"
import HouseholdPage from "@/pages/household/HouseholdPage"

const PrivateRoute = () => {
  const token = localStorage.getItem("token")
  return token ? <Outlet /> : <Navigate to="/register" replace />
}

const PublicRoute = () => {
  const token = localStorage.getItem("token")
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/household" element={<HouseholdPage />} />
          </Route>
        </Route>

        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App