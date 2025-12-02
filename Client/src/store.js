import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './Slices/CommonSpaceSlice.js';
import auth from './Slices/authSlice.js';
import worker from './Slices/workerSlice.js';


export const store = configureStore({
  reducer: {
    CommonSpace,
    auth,
    worker
  },
});
