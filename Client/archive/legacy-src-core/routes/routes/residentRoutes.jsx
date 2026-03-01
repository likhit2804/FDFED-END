import { CommonSpaceBooking } from '../features/resident/components/CommonSpace';
import { IssueRaising } from '../features/resident/components/IssueRaising';
import { ResidentDashboard } from '../features/resident/components/Dashboard';
import { PreApproval } from '../features/resident/components/PreApproval';
import { ResidentProfile } from '../features/resident/components/Profile';
import { ResidentPayments } from '../features/resident/components/ResidentPayments.jsx';

export const residentRoutes = [
    { path: "dashboard", element: <ResidentDashboard /> },
    { path: "preApproval", element: <PreApproval /> },
    { path: "commonSpace", element: <CommonSpaceBooking /> },
    { path: "issueRaising", element: <IssueRaising /> },
    { path: "payments", element: <ResidentPayments /> },
    { path: "profile", element: <ResidentProfile /> },
];
