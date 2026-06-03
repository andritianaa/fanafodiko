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
import BackofficeDashboardLayout from "@/pages/backoffice/BackofficeDashboardLayout"
import BOPharmaciesSection from "@/pages/backoffice/dashboard/PharmaciesSection"
import BORequestsSection from "@/pages/backoffice/dashboard/RequestsSection"
import BOUsersSection from "@/pages/backoffice/dashboard/UsersSection"
import BOBugReportsSection from "@/pages/backoffice/dashboard/BugReportsSection"
import BackofficePharmacyLayout from "@/pages/backoffice/BackofficePharmacyLayout"
import BOOverviewSection from "@/pages/backoffice/sections/OverviewSection"
import BOInfoSection from "@/pages/backoffice/sections/InfoSection"
import BOHoursSection from "@/pages/backoffice/sections/HoursSection"
import BOCalendarSection from "@/pages/backoffice/sections/CalendarSection"
import BOImagesSection from "@/pages/backoffice/sections/ImagesSection"
import BOStaffSection from "@/pages/backoffice/sections/StaffSection"
import MapPage from "@/pages/map/MapPage"
import PharmacyDetailPage from "@/pages/pharmacy/PharmacyDetailPage"
import MyPharmacyListPage from "@/pages/my-pharmacy/MyPharmacyListPage"
import MyPharmacyLayout from "@/pages/my-pharmacy/MyPharmacyLayout"
import MyPharmacyOverviewSection from "@/pages/my-pharmacy/sections/OverviewSection"
import MyPharmacyInfoSection from "@/pages/my-pharmacy/sections/InfoSection"
import MyPharmacyHoursSection from "@/pages/my-pharmacy/sections/HoursSection"
import MyPharmacyCalendarSection from "@/pages/my-pharmacy/sections/CalendarSection"
import MyPharmacyImagesSection from "@/pages/my-pharmacy/sections/ImagesSection"
import MyPharmacyMembersSection from "@/pages/my-pharmacy/sections/MembersSection"
import MyPharmacyHistorySection from "@/pages/my-pharmacy/sections/HistorySection"
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
            <Route path="/pharmacy/:id" element={<PharmacyDetailPage />} />
            <Route path="/my-pharmacy" element={<MyPharmacyListPage />} />
            <Route path="/my-pharmacy/:id" element={<MyPharmacyLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<MyPharmacyOverviewSection />} />
              <Route path="info" element={<MyPharmacyInfoSection />} />
              <Route path="hours" element={<MyPharmacyHoursSection />} />
              <Route path="calendar" element={<MyPharmacyCalendarSection />} />
              <Route path="images" element={<MyPharmacyImagesSection />} />
              <Route path="members" element={<MyPharmacyMembersSection />} />
              <Route path="history" element={<MyPharmacyHistorySection />} />
            </Route>
            <Route path="/suggest-pharmacy" element={<SuggestPharmacyPage />} />
            <Route path="/med-search" element={<MedSearchPage />} />
            <Route path="/med-search/history" element={<MedSearchHistoryPage />} />
            <Route path="/med-search/:id" element={<MedSearchResultsPage />} />

            {/* Admin / Support only */}
            <Route element={<AdminRoute />}>
              {/* Dashboard backoffice avec sidebar */}
              <Route element={<BackofficeDashboardLayout />}>
                <Route path="/backoffice" element={<Navigate to="/backoffice/pharmacies" replace />} />
                <Route path="/backoffice/pharmacies" element={<BOPharmaciesSection />} />
                <Route path="/backoffice/requests" element={<BORequestsSection />} />
                <Route path="/backoffice/users" element={<BOUsersSection />} />
              <Route path="/backoffice/bug-reports" element={<BOBugReportsSection />} />
              </Route>
              {/* Détail pharmacie */}
              <Route path="/backoffice/pharmacy/:id" element={<BackofficePharmacyLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<BOOverviewSection />} />
                <Route path="info" element={<BOInfoSection />} />
                <Route path="hours" element={<BOHoursSection />} />
                <Route path="calendar" element={<BOCalendarSection />} />
                <Route path="images" element={<BOImagesSection />} />
                <Route path="staff" element={<BOStaffSection />} />
              </Route>
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