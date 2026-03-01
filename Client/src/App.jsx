import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { io } from "socket.io-client";

import ErrorBoundary from "./features/common/components/ErrorBoundary";

import { Layout } from "../src/Layout";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { SignIn } from "./features/auth/SignIn";
import { SignUp } from "./features/auth/SignUp";
import { InterestForm } from "./features/common/components/InterestForm";
import { Landingpage } from "./features/common/components/LandingPage";

import { managerRoutes } from "./routes/managerRoutes";
import { residentRoutes } from "./routes/residentRoutes";
import { workerRoutes } from "./routes/workerRoutes";
import { securityRoutes } from "./routes/securityRoutes";
import { ResidentRegister } from './features/resident/components/ResidentRegister.jsx';
import SubscriptionExpired from "./features/common/components/SubscriptionExpired.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute } from "./features/common/components/ProtectedRoute.jsx";

import AdminLogin from './features/admin/components/AdminLogin';

import AdminLayout from './features/admin/components/AdminLayout';
import { adminRoutes } from "./routes/adminRoutes";

import { AdminAuthProvider } from "./features/admin/context/AdminAuthContext";
import ProtectedAdminRoute from "./features/admin/components/ProtectedAdminRoute";

import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "./features/auth/authSlice";

import OnboardingPayment from "./features/common/components/Onboarding/OnboardingPayment";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    fetch("http://localhost:3000/api/auth/getUser", {
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
            {managerRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Resident" />}>
          <Route path="/resident" element={<Layout userType="Resident" />}>
            {residentRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Worker" />}>
          <Route path="/worker" element={<Layout userType="Worker" />}>
            {workerRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedUserType="Security" />}>
          <Route path="/security" element={<Layout userType="security" />}>
            {securityRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>
      </>
    )
  );

  return (
    <AdminAuthProvider>
      <ErrorBoundary>
        <ToastContainer />
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AdminAuthProvider>
  );
}

export default App;
