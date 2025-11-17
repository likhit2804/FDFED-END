import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './Slices/CommonSpaceSlice.js';
import auth from './Slices/authSlice.js'

export const store = configureStore({
  reducer: {
    CommonSpace,
    auth
  },
});
