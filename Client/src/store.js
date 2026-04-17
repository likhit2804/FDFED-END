import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './slices/CommonSpaceSlice.js';
import auth from './slices/authSlice.js'
import IssueSlice from './slices/IssueSlice.js';
import ManagerIssuesSlice from './slices/ManagerIssuesSlice.js';
import WorkerTasksSlice from './slices/WorkerTasksSlice.js';
import worker from './slices/workerSlice.js';
import leave from './slices/leaveSlice.js';


export const store = configureStore({
  reducer: {
    CommonSpace,
    auth,
    Issue:IssueSlice,
    managerIssues: ManagerIssuesSlice,
    WorkerTasks: WorkerTasksSlice,
    worker
    ,
    leave
  },
});
