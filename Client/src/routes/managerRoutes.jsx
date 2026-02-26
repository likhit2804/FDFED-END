import { ManagerDashboard } from '../features/manager/components/Dashboard';
import { CommonSpace } from '../features/manager/components/CommonSpace';
import { ManagerProfile } from '../features/manager/components/Profile';
import { IssueResolving } from '../features/manager/components/IssueResolving';
import { Advertisement } from '../features/manager/components/Advertisement';
import { Payments } from '../features/manager/components/Payments';
import UserManagement from '../features/manager/components/UserManagement.jsx';
import Subscription from '../features/manager/components/Subscription.jsx';
import ManagerSetup from '../features/manager/components/ManagerSetup.jsx';

export const managerRoutes = [
    { path: "subscription", element: <Subscription /> },
    { path: "setup", element: <ManagerSetup /> },
    { path: "dashboard", element: <ManagerDashboard /> },
    { path: "issueResolving", element: <IssueResolving /> },
    { path: "commonSpace", element: <CommonSpace /> },
    { path: "advertisement", element: <Advertisement /> },
    { path: "payments", element: <Payments /> },
    { path: "profile", element: <ManagerProfile /> },
    { path: "userManagement", element: <UserManagement /> },
];
