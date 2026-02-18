// src/routes/adminRoutes.js
import AdminDashboard from "../components/Admin/AdminDashboard";
import AdminCommunities from "../components/Admin/AdminCommunities";
import AdminPayments from "../components/Admin/AdminPayments";
import AdminApplications from "../components/Admin/AdminApplications";
import AdminProfile from "../components/Admin/AdminProfile";
import AdminSubscriptionPlans from "../components/Admin/AdminSubscriptionPlans";

export const adminRoutes = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "communities", element: <AdminCommunities /> },
  { path: "payments", element: <AdminPayments /> },
  { path: "subscription-plans", element: <AdminSubscriptionPlans /> },
  { path: "applications", element: <AdminApplications /> },
  { path: "profile", element: <AdminProfile /> },
];
