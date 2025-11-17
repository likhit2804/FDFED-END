import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Layout } from '../src/Layout';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { InterestForm } from './components/InterestForm';
import { Landingpage } from './components/LandingPage';

import { ManagerDashboard } from './components/Manager/Dashboard';
import { CommonSpace } from './components/Manager/CommonSpace';
import { ManagerProfile } from './components/Manager/Profile';
import { IssueResolving } from './components/Manager/IssueResolving';
import { Advertisement } from './components/Manager/Advertisement';
import { Payments } from './components/Manager/Payments';

import { CommonSpaceBooking } from './components/Resident/CommonSpace';
import { IssueRaising } from './components/Resident/IssueRaising';
import { ResidentDashboard } from './components/Resident/dashboard';
import { PreApproval } from './components/Resident/PreApproval';
import { ResidentProfile } from './components/Resident/Profile';
import { ResidentPayments } from './components/Resident/ResidentPayments.jsx';

import { WorkerDashboard } from './components/Worker/Dashboard';
import { Tasks } from './components/Worker/Tasks';
import { History } from './components/Worker/History';
import { WorkerProfile } from './components/Worker/Profile';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute } from './components/ProtectedRout.jsx'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Landingpage />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/interestForm" element={<InterestForm />} />

        <Route element={<ProtectedRoute allowedUserType="communityManager" />}>
          <Route path="/manager" element={<Layout userType="manager" />}>
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="issueResolving" element={<IssueResolving />} />
            <Route path="commonSpace" element={<CommonSpace />} />
            <Route path="advertisement" element={<Advertisement />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<ManagerProfile />} />
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
      </>
    )
  );

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
