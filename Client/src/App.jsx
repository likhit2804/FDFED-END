
import ErrorBoundary from "./components/ErrorBoundary";
import { Layout } from "../src/Layout";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from "react-router-dom";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { InterestForm } from "./components/InterestForm";
import { Landingpage } from "./components/LandingPage";
import { ToastContainer } from "react-toastify";
import { ProtectedRoute } from "./components/ProtectedRout.jsx";
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/Admin/AdminLayout';
import { adminRoutes } from "./routes/adminRoutes";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedAdminRoute from "./components/Admin/ProtectedAdminRoute";
import { useEffect, Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "./slices/authSlice";
import OnboardingPayment from "./components/Onboarding/OnboardingPayment";
import { Loader } from "./components/Loader";
import { withApiBase } from "./utils/apiBaseUrl";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

// Helper to gracefully retry and reload when a chunk is not found due to a new deployment
const lazyWithRetry = (factory) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      const isDynamicImportError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("dynamically imported module") ||
        error?.name === "TypeError";

      const key = "vite_chunk_retry_" + window.location.pathname;
      const alreadyTried = sessionStorage.getItem(key);

      if (isDynamicImportError && !alreadyTried) {
        sessionStorage.setItem(key, "true");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(key);
      throw error;
    }
  });

// --> LAZY LOADED ROUTE CHUNKS <--
// Manager Routes
const ManagerDashboard = lazyWithRetry(() => import('./components/Manager/Dashboard').then(m => ({ default: m.ManagerDashboard })));
const CommonSpace = lazyWithRetry(() => import('./components/Manager/CommonSpace').then(m => ({ default: m.CommonSpace })));
const ManagerProfile = lazyWithRetry(() => import('./components/Manager/Profile').then(m => ({ default: m.ManagerProfile })));
const IssueResolving = lazyWithRetry(() => import('./components/Manager/IssueResolving').then(m => ({ default: m.IssueResolving })));
const Payments = lazyWithRetry(() => import('./components/Manager/Payments').then(m => ({ default: m.Payments })));
const UserManagement = lazyWithRetry(() => import('./components/Manager/UserManagement.jsx'));
const Subscription = lazyWithRetry(() => import('./components/Manager/Subscription.jsx'));
const ManagerSetup = lazyWithRetry(() => import('./components/Manager/ManagerSetup.jsx'));
const ManagerLeaveList = lazyWithRetry(() => import('./components/ManagerLeaveList'));
// Resident Routes
const CommonSpaceBooking = lazyWithRetry(() => import('./components/Resident/CommonSpace').then(m => ({ default: m.CommonSpaceBooking })));
const IssueRaising = lazyWithRetry(() => import('./components/Resident/IssueRaising').then(m => ({ default: m.IssueRaising })));
const ResidentDashboard = lazyWithRetry(() => import('./components/Resident/Dashboard').then(m => ({ default: m.ResidentDashboard })));
const PreApproval = lazyWithRetry(() => import('./components/Resident/PreApproval').then(m => ({ default: m.PreApproval })));
const ResidentProfile = lazyWithRetry(() => import('./components/Resident/Profile').then(m => ({ default: m.ResidentProfile })));
const ResidentPayments = lazyWithRetry(() => import('./components/Resident/ResidentPayments.jsx').then(m => ({ default: m.ResidentPayments })));
const ResidentRegister = lazyWithRetry(() => import('./components/Resident/ResidentRegister.jsx').then(m => ({ default: m.ResidentRegister })));
// Worker Routes
const WorkerDashboard = lazyWithRetry(() => import("./components/Worker/Dashboard").then(m => ({ default: m.WorkerDashboard })));
const Tasks = lazyWithRetry(() => import("./components/Worker/Tasks").then(m => ({ default: m.Tasks })));
const History = lazyWithRetry(() => import("./components/Worker/History").then(m => ({ default: m.History })));
const WorkerProfile = lazyWithRetry(() => import("./components/Worker/Profile").then(m => ({ default: m.WorkerProfile })));
const WorkerLeaveList = lazyWithRetry(() => import("./components/Worker/WorkerLeaveList"));
// Security Routes
const SecurityDashboard = lazyWithRetry(() => import("./components/security/Dashboard.jsx").then(m => ({ default: m.SecurityDashboard })));
const VisitorManagement = lazyWithRetry(() => import("./components/security/visitorManagement.jsx").then(m => ({ default: m.VisitorManagement })));
const SecurityPreApproval = lazyWithRetry(() => import("./components/security/preapproval.jsx").then(m => ({ default: m.SecurityPreApproval })));
const SecurityIssues = lazyWithRetry(() => import("./components/security/Issues.jsx").then(m => ({ default: m.SecurityIssues })));
const SecurityProfile = lazyWithRetry(() => import("./components/security/profile.jsx").then(m => ({ default: m.SecurityProfile })));
const SubscriptionExpired = lazyWithRetry(() => import("./components/SubscriptionExpired.jsx"));
function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    fetch(withApiBase("/api/auth/getUser"), {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        console.log("user fetched", data);
        if (data && data.user) {
          dispatch(setUser(data.user));
        }
      })
      .catch(() => {});
  }, [dispatch]);
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<RouteErrorBoundary />}>
        <Route path="/" element={<Landingpage />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/residentRegister" element={<ResidentRegister />} />
        <Route path="/interestForm" element={<InterestForm />} />
        {/* Public Onboarding Route */}
        <Route path="/onboarding/payment" element={<OnboardingPayment />} />
        {/* Shared page when community subscription is inactive/expired */}
        <Route path="/subscription-expired" element={<SubscriptionExpired />} />
        <Route path='/adminLogin' element={<AdminLogin />} ></Route>
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout userType="admin" />
            </ProtectedAdminRoute>
          }
        >
          {adminRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>
        <Route element={<ProtectedRoute allowedUserType="CommunityManager" />}>
          <Route path="/manager" element={<Layout userType="manager" />}>
            <Route path="subscription" element={<Subscription />} />
            <Route path="setup" element={<ManagerSetup />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="issueResolving" element={<IssueResolving />} />
            <Route path="commonSpace" element={<CommonSpace />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<ManagerProfile />} />
            <Route path="userManagement" element={<UserManagement />} />
            <Route path="leaves" element={<ManagerLeaveList />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedUserType="Resident" />}>
          <Route path="/resident" element={<Layout userType="Resident" />}>
            <Route path="dashboard" element={<ResidentDashboard />} />
            <Route path="preApproval" element={<PreApproval />} />
            <Route path="commonSpace" element={<CommonSpaceBooking />} />
            <Route path="issueRaising" element={<IssueRaising />} />
            <Route path="payments" element={<ResidentPayments />} />
            <Route path="profile" element={<ResidentProfile />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedUserType="Worker" />}>
          <Route path="/worker" element={<Layout userType="Worker" />}>
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="history" element={<History />} />
            <Route path="leaves" element={<WorkerLeaveList />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedUserType="Security" />}>
          <Route path="/security" element={<Layout userType="security" />}>
            <Route path="dashboard" element={<SecurityDashboard />} />
            <Route path="visitorManagement" element={<VisitorManagement />} />
            <Route path="preapproval" element={<SecurityPreApproval />} />
            <Route path="issues" element={<SecurityIssues />} />
            <Route path="profile" element={<SecurityProfile />} />
          </Route>
        </Route>
      </Route>
    )
  );
  return (
    <AdminAuthProvider>
      <ErrorBoundary>
        <ToastContainer
          position="top-right"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
          style={{ zIndex: 999999 }}
        />
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </AdminAuthProvider>
  );
}
export default App;
