import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


const initialState = {
  avalaibleSpaces: [],
  Bookings: [],
  loading: false,
  error: null,
};


const fetchuserBookings = createAsyncThunk("commonSpace/fetchBookings", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("http://localhost:3000/resident/api/booking");
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData);
    }
    const data = await response.json();
    return data.data.bookings;
  } catch (error) {
    return rejectWithValue(error.message);
  }
})


const CommonSpaceSlice = createSlice({
  name: "CommonSpace",
  initialState,
  reducers: {
    cancelBooking: (state, action) => {
      const { id } = action.payload;
      const existingBooking = state.Bookings.find((b) => b._id === id);
      if (existingBooking && existingBooking.status === "Approved") {
        existingBooking.status = "CancelledByResident";
        existingBooking.isCancelled = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchuserBookings.pending, (state) => {
        state.loading = true;
      }
    );
    builder.addCase(fetchuserBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.Bookings = action.payload;
    });
    builder.addCase(fetchuserBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
  },
  
});


export const { cancelBooking } = CommonSpaceSlice.actions;

export default CommonSpaceSlice.reducer;
