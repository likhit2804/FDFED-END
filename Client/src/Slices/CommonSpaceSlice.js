import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


const initialState = {
  avalaibleSpaces: [],
  Bookings: [],
  loading: false,
  error: null,
};


export const fetchuserBookings = createAsyncThunk("commonSpace/fetchBookings", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("http://localhost:3000/resident/commonSpace");
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData);
    }
    const data = await response.json();
    console.log("data : ",data.bookings);
    
    if(data.success){
      return data.bookings;
    }else{
      return rejectWithValue(data);
    }
  } catch (error) {
    return rejectWithValue(error.message);
  }
})


export const sendUserRequest = createAsyncThunk("commonSpace/sendUserRequest", async (bookingData, { rejectWithValue }) => {
  try {
    const response = await fetch("http://localhost:3000/resident/commonSpace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });
    const data = await response.json();
    if (!response.ok) {
      return rejectWithValue(data);
    }
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
}
)


export const fetchDataforManager = createAsyncThunk("commonSpace/fetchDataforManager",async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:3000/manager/commonSpace");
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }
      const data = await response.json();
      if (data.bookings) {
        return data;
      } else {
        return rejectWithValue(data);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
});


export const EditSpace = createAsyncThunk("commonSpace/EditSpace",
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:3000/manager/spaces/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const DeleteSpace = createAsyncThunk(
  "commonSpace/DeleteSpace",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:3000/manager/spaces/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      return id; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const AddSpace = createAsyncThunk(
  "commonSpace/AddSpace",
  async (newSpaceData, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:3000/manager/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSpaceData),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const UpdateBookingRules = createAsyncThunk(
)
  


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
    ).addCase(fetchuserBookings.fulfilled, (state, action) => {
      state.loading = false;
      console.log("after fetching : ",action);
      state.Bookings = action.payload;
    }).addCase(fetchuserBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(sendUserRequest.pending, (state) => {
      state.loading = true;
    }).addCase(sendUserRequest.fulfilled, (state, action) => {
      state.loading = false;
      state.Bookings.push(action.payload.space);
    }).addCase(sendUserRequest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    builder.addCase(fetchDataforManager.pending, (state) => {
      state.loading = true;
    })
    .addCase(fetchDataforManager.fulfilled, (state, action) => {
      state.loading = false;
      state.Bookings = action.payload.bookings;
      state.avalaibleSpaces = action.payload.commonSpaces;
    })
    .addCase(fetchDataforManager.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });


    builder.addCase(EditSpace.pending, (state) => {
      state.loading = true;
    })
    .addCase(EditSpace.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.avalaibleSpaces.findIndex(
        (space) => space._id === action.payload.space._id
      );
      if (index !== -1) {
        state.avalaibleSpaces[index] = action.payload.space;
      }
    })
    .addCase(EditSpace.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    .addCase(DeleteSpace.pending, (state) => {
      state.loading = true;
    })
    .addCase(DeleteSpace.fulfilled, (state, action) => {
      state.loading = false;
      state.avalaibleSpaces = state.avalaibleSpaces.filter(
        (space) => space._id !== action.payload
      );
    })
    .addCase(DeleteSpace.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    .addCase(AddSpace.pending, (state) => {
      state.loading = true;
    })
    .addCase(AddSpace.fulfilled, (state, action) => {
      state.loading = false;
      state.avalaibleSpaces.push(action.payload.space);
    })
    .addCase(AddSpace.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

   
  },
  
});


export const { cancelBooking } = CommonSpaceSlice.actions;

export default CommonSpaceSlice.reducer;
