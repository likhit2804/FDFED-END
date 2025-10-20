import { configureStore } from "@reduxjs/toolkit";
import CommonSpace from './Slices/CommonSpaceSlice.js'

export const store = configureStore({
  reducer: {
    CommonSpace
  },
});
