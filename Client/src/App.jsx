import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Layout } from '../src/Layout';
import { createBrowserRouter,createRoutesFromElements, Route,RouterProvider } from 'react-router-dom';
import {SignIn} from './components/SignIn'
import { SignUp } from './components/SignUp';
import { InterestForm } from './components/InterestForm';
import { Landingpage } from './components/LandingPage';

import { ManagerDashboard } from './components/Manager/dashboard';
import {CommonSpace} from './components/Manager/CommonSpace';
import {ManagerProfile} from './components/Manager/Profile';
import { IssueResolving } from './components/Manager/IssueResolving';
import { Advertisement } from './components/Manager/Advertisement';
import { Payments } from './components/Manager/Payments';


import {CommonSpaceBooking} from './components/Resident/CommonSpace'
import { IssueRaising } from './components/Resident/IssueRaising';
import { ResidentDashboard } from './components/Resident/dashboard';
import { PreApproval } from './components/Resident/PreApproval';
import {ResidentProfile} from './components/Resident/Profile'


import {WorkerDashboard} from './components/Worker/Dashboard'
import {Tasks} from './components/Worker/Tasks'
import {History} from './components/Worker/History'
import {WorkerProfile} from './components/Worker/Profile'

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/' element={<Landingpage/>} />
        <Route path='/SignIn' element={<SignIn />} />
        <Route path='/SignUp' element={<SignUp />} />
        <Route path='/interestForm' element={<InterestForm />} />

        <Route path='/manager' element={<Layout userType="manager" />} >

          <Route path='dashboard' element={<ManagerDashboard/>} />
          <Route path='issueResolving' element={<IssueResolving/>} />
          <Route path='commonSpace' element={<CommonSpace/>} />
          <Route path='advertisement' element={<Advertisement/>} />
          <Route path='payments' element={<Payments/>} />
          <Route path='profile' element={<ManagerProfile/>} />

        </Route>

        <Route path='/resident' element={<Layout userType="Resident" />} >

          <Route path='dashboard' element={<ResidentDashboard/>} />
          <Route path='preApproval' element={< PreApproval />} />
          <Route path='commonSpace' element={<CommonSpaceBooking/>} />
          <Route path='issueRaising' element={<IssueRaising/>} />
          <Route path='payments' element={<Payments/>} />
          <Route path='profile' element={<ResidentProfile/>} />

        </Route>

        <Route path='/worker' element={<Layout userType="Worker" />} >
          <Route path='dashboard' element={<WorkerDashboard/>} />
          <Route path='tasks' element={<Tasks />} />
          <Route path='history' element={<History/>} />
          <Route path='profile' element={<WorkerProfile/>} />
        </Route>

      </>
    )
  )

  return (
    <RouterProvider router={router} />
  )
}

export default App;
