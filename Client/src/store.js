import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './Slices/CommonSpaceSlice.js';
import auth from './Slices/authSlice.js'
import IssueSlice from './Slices/IssueSlice.js';

import WorkerTasksSlice from './Slices/WorkerTasksSlice.js';
export const store = configureStore({
  reducer: {
    CommonSpace,
    auth,
    Issue:IssueSlice,
    WorkerTasks: WorkerTasksSlice,
  },
});
