import { WorkerDashboard } from "../features/worker/components/Dashboard";
import { Tasks } from "../features/worker/components/Tasks";
import { History } from "../features/worker/components/History";
import { WorkerProfile } from "../features/worker/components/Profile";

export const workerRoutes = [
    { path: "dashboard", element: <WorkerDashboard /> },
    { path: "tasks", element: <Tasks /> },
    { path: "history", element: <History /> },
    { path: "profile", element: <WorkerProfile /> },
];
