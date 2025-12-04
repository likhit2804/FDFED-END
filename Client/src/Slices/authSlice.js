import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, userType }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/login",
        { email, password, userType },
        { withCredentials: true }
      );
      return { ...response.data, email, userType };
    } catch (err) {
      console.log(err);
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ otp, tempToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/verify-otp",
        { otp, tempToken },
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "OTP verification failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password, userType }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        { name, email, password, userType },
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Registration failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    pending2fa: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // If server indicates 2FA is required, store temp and wait
        if (action.payload?.requiresOtp) {
          state.pending2fa = {
            tempToken: action.payload.tempToken,
            email: action.payload.email,
            userType: action.payload.userType,
          };
          state.user = null;
          state.token = null;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.pending2fa = null;
        }
      })
            .addCase(verifyOtp.pending, (state) => {
              state.loading = true;
              state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
              state.loading = false;
              state.user = action.payload.user;
              state.token = action.payload.token;
              state.pending2fa = null;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
              state.loading = false;
              state.error = action.payload;
            })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;