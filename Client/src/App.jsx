import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { io } from "socket.io-client";

import ErrorBoundary from "./components/ErrorBoundary";

import { Layout } from "../src/Layout";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { InterestForm } from "./components/InterestForm";
import { Landingpage } from "./components/LandingPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute } from "./components/ProtectedRout.jsx";

import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/Admin/AdminLayout';
import { adminRoutes } from "./routes/adminRoutes";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedAdminRoute from "./components/Admin/ProtectedAdminRoute";

import React, { useEffect, Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "./Slices/authSlice";

import OnboardingPayment from "./components/Onboarding/OnboardingPayment";
import { Loader } from "./components/Loader";

// --> LAZY LOADED ROUTE CHUNKS <--

// Manager Routes
const ManagerDashboard = lazy(() => import('./components/Manager/Dashboard').then(m => ({ default: m.ManagerDashboard })));
const CommonSpace = lazy(() => import('./components/Manager/CommonSpace').then(m => ({ default: m.CommonSpace })));
const ManagerProfile = lazy(() => import('./components/Manager/Profile').then(m => ({ default: m.ManagerProfile })));
const IssueResolving = lazy(() => import('./components/Manager/IssueResolving').then(m => ({ default: m.IssueResolving })));
const Advertisement = lazy(() => import('./components/Manager/Advertisement').then(m => ({ default: m.Advertisement })));
const Payments = lazy(() => import('./components/Manager/Payments').then(m => ({ default: m.Payments })));
const UserManagement = lazy(() => import('./components/Manager/UserManagement.jsx'));
const Subscription = lazy(() => import('./components/Manager/Subscription.jsx'));
const ManagerSetup = lazy(() => import('./components/Manager/ManagerSetup.jsx'));
const ManagerLeaveList = lazy(() => import('./components/ManagerLeaveList'));

// Resident Routes
const CommonSpaceBooking = lazy(() => import('./components/Resident/CommonSpace').then(m => ({ default: m.CommonSpaceBooking })));
const IssueRaising = lazy(() => import('./components/Resident/IssueRaising').then(m => ({ default: m.IssueRaising })));
const ResidentDashboard = lazy(() => import('./components/Resident/Dashboard').then(m => ({ default: m.ResidentDashboard })));
const PreApproval = lazy(() => import('./components/Resident/PreApproval').then(m => ({ default: m.PreApproval })));
const ResidentProfile = lazy(() => import('./components/Resident/Profile').then(m => ({ default: m.ResidentProfile })));
const ResidentPayments = lazy(() => import('./components/Resident/ResidentPayments.jsx').then(m => ({ default: m.ResidentPayments })));
const ResidentRegister = lazy(() => import('./components/Resident/ResidentRegister.jsx').then(m => ({ default: m.ResidentRegister })));

// Worker Routes
const WorkerDashboard = lazy(() => import("./components/Worker/Dashboard").then(m => ({ default: m.WorkerDashboard })));
const Tasks = lazy(() => import("./components/Worker/Tasks").then(m => ({ default: m.Tasks })));
const History = lazy(() => import("./components/Worker/History").then(m => ({ default: m.History })));
const WorkerProfile = lazy(() => import("./components/Worker/Profile").then(m => ({ default: m.WorkerProfile })));

// Security Routes
const SecurityDashboard = lazy(() => import("./components/security/Dashboard.jsx").then(m => ({ default: m.SecurityDashboard })));
const VisitorManagement = lazy(() => import("./components/security/visitorManagement.jsx").then(m => ({ default: m.VisitorManagement })));
const SecurityPreApproval = lazy(() => import("./components/security/preapproval.jsx").then(m => ({ default: m.SecurityPreApproval })));
const SecurityProfile = lazy(() => import("./components/security/profile.jsx").then(m => ({ default: m.SecurityProfile })));

const SubscriptionExpired = lazy(() => import("./components/SubscriptionExpired.jsx"));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    fetch("/api/auth/getUser", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        console.log("user fetched", data);
        if (data.user) {
          dispatch(setUser(data.user));
        }
      });
  }, [dispatch]);



  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Landingpage />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/interestForm" element={<InterestForm />} />

        <Route path='/' element={<Landingpage />} />
        <Route path='/SignIn' element={<SignIn />} />
        <Route path='/SignUp' element={<SignUp />} />
        <Route path='/residentRegister' element={<ResidentRegister />} />
        <Route path='/interestForm' element={<InterestForm />} />

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
            <Route path="advertisement" element={<Advertisement />} />
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
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Security" />}>
          <Route path="/security" element={<Layout userType="security" />}>
            <Route path="dashboard" element={<SecurityDashboard />} />
            <Route path="visitorManagement" element={<VisitorManagement />} />
            <Route path="preapproval" element={<SecurityPreApproval />} />
            <Route path="profile" element={<SecurityProfile />} />
          </Route>
        </Route>
      </>
    )
  );

  return (
    <AdminAuthProvider>
      <ErrorBoundary>
        <ToastContainer />
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </AdminAuthProvider>
  );
}

export default App;
