import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './features/common/CommonSpaceSlice.js';
import auth from './features/auth/authSlice.js'
import IssueSlice from './features/issues/IssueSlice.js';
import ManagerIssuesSlice from './features/manager/ManagerIssuesSlice.js';
import WorkerTasksSlice from './features/worker/WorkerTasksSlice.js';
import worker from './features/worker/workerSlice.js';


export const store = configureStore({
  reducer: {
    CommonSpace,
    auth,
    Issue:IssueSlice,
    managerIssues: ManagerIssuesSlice,
    WorkerTasks: WorkerTasksSlice,
    worker
  },
});
