// src/routes/adminRoutes.js
import AdminDashboard from "../features/admin/components/AdminDashboard";
import AdminCommunities from "../features/admin/components/AdminCommunities";
import AdminPayments from "../features/admin/components/AdminPayments";
import AdminApplications from "../features/admin/components/AdminApplications";
import AdminProfile from "../features/admin/components/AdminProfile";
import AdminSubscriptionPlans from "../features/admin/components/AdminSubscriptionPlans";

export const adminRoutes = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "communities", element: <AdminCommunities /> },
  { path: "payments", element: <AdminPayments /> },
  { path: "subscription-plans", element: <AdminSubscriptionPlans /> },
  { path: "applications", element: <AdminApplications /> },
  { path: "profile", element: <AdminProfile /> },
];
