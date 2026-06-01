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
import AccountPage from "@/pages/account/AccountPage"
import BackofficePage from "@/pages/backoffice/BackofficePage"
import MapPage from "@/pages/map/MapPage"
import MyPharmacyListPage from "@/pages/my-pharmacy/MyPharmacyListPage"
import MyPharmacyManagePage from "@/pages/my-pharmacy/MyPharmacyManagePage"
import SuggestPharmacyPage from "@/pages/suggest/SuggestPharmacyPage"
import MedSearchPage from "@/pages/med-search/MedSearchPage"
import MedSearchResultsPage from "@/pages/med-search/MedSearchResultsPage"
import MedSearchHistoryPage from "@/pages/med-search/MedSearchHistoryPage"
import InvitationPage from "@/pages/pharmacy-invitation/InvitationPage"
import CguPage from "@/pages/legal/CguPage"
import { FontSizeProvider } from "@/contexts/FontSizeContext"
import { useMe } from "@/features/auth/api/hooks"

const PrivateRoute = () => {
  const token = localStorage.getItem("auth")
  return token ? <Outlet /> : <Navigate to="/register" replace />
}

const PublicRoute = () => {
  const token = localStorage.getItem("auth")
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />
}

const AdminRoute = () => {
  const { data: user, isLoading } = useMe()
  if (isLoading) return null
  if (!user || (user.role !== "admin" && user.role !== "support")) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

function App() {
  return (
    <FontSizeProvider>
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
            <Route path="/account" element={<AccountPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/my-pharmacy" element={<MyPharmacyListPage />} />
            <Route path="/my-pharmacy/:id" element={<MyPharmacyManagePage />} />
            <Route path="/suggest-pharmacy" element={<SuggestPharmacyPage />} />
            <Route path="/med-search" element={<MedSearchPage />} />
            <Route path="/med-search/history" element={<MedSearchHistoryPage />} />
            <Route path="/med-search/:id" element={<MedSearchResultsPage />} />

            {/* Admin / Support only */}
            <Route element={<AdminRoute />}>
              <Route path="/backoffice" element={<BackofficePage />} />
            </Route>
          </Route>
        </Route>

        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Open Routes */}
        <Route path="/cgu" element={<CguPage />} />
        <Route path="/pharmacy-invitation/:token" element={<InvitationPage />} />
      </Routes>
    </BrowserRouter>
    </FontSizeProvider>
  )
}

export default App