import { SecurityDashboard } from "../features/security/components/Dashboard.jsx"
import { VisitorManagement } from "../features/security/components/visitorManagement.jsx";
import { SecurityPreApproval } from "../features/security/components/preapproval.jsx";
import { SecurityProfile } from "../features/security/components/profile.jsx";

export const securityRoutes = [
    { path: "dashboard", element: <SecurityDashboard /> },
    { path: "visitorManagement", element: <VisitorManagement /> },
    { path: "preapproval", element: <SecurityPreApproval /> },
    { path: "profile", element: <SecurityProfile /> },
];
