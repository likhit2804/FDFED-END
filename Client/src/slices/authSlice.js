import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// FIX 1: The Safety Net
// We safely try to parse the user. If it's corrupted or "undefined", we wipe it clean.
const rawUserData = localStorage.getItem("user");
let parsedUser = null;

if (rawUserData && rawUserData !== "undefined") {
  try {
    parsedUser = JSON.parse(rawUserData);
  } catch (error) {
    console.error("Corrupted local storage data. Clearing it out.");
    localStorage.removeItem("user");
  }
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, userType }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "/login",
        { email, password, userType },
        { withCredentials: true }
      );
      
      // FIX 2: REMOVED the premature localStorage.setItem calls from here!
      // You should only save to localStorage AFTER checking if they need 2FA/OTP.
      // We handle saving to localStorage down in the extraReducers instead.
      
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
        "/verify-otp",
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
        "/api/auth/register",
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
    user: parsedUser, //  FIX 1: Using our safe variable from the top!
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
    pending2fa: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");  // Make sure to clean up on logout!
      localStorage.removeItem("token"); // Make sure to clean up on logout!
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
          //  FIX 3: Mismatched Backend payload check!
          // Based on your earlier tests, your backend sends 'userPayload', not 'user'.
          // Using action.payload.userPayload prevents JSON.stringify() from saving "undefined".
          
          const actualUser = action.payload.userPayload || action.payload.user; 
          const actualToken = action.payload.token || action.payload.tempToken;

          state.user = actualUser;
          state.token = actualToken;
          state.pending2fa = null;
          
          try {
            if (actualToken) localStorage.setItem("token", actualToken);
            if (actualUser) localStorage.setItem("user", JSON.stringify(actualUser));
          } catch (e) {
            console.warn("Failed to persist auth to localStorage", e);
          }
        }
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        
        //  Same fix applied here: check for userPayload just in case!
        const actualUser = action.payload.userPayload || action.payload.user;
        const actualToken = action.payload.token;

        state.user = actualUser;
        state.token = actualToken;
        state.pending2fa = null;
        
        try {
          if (actualToken) localStorage.setItem("token", actualToken);
          if (actualUser) localStorage.setItem("user", JSON.stringify(actualUser));
        } catch (e) {
          console.warn("Failed to persist auth to localStorage", e);
        }
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
