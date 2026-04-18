import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


const initialState = {
  avalaibleSpaces: [],
  Bookings: [],
  loading: false,
  error: null,
};


export const fetchuserBookings = createAsyncThunk("commonSpace/fetchBookings", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/resident/commonSpace", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include"
    });
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData);
    }
    const data = await response.json();
    console.log("data : ", data);

    if (data.success) {
      return data;
    } else {
      return rejectWithValue(data);
    }
  } catch (error) {
    return rejectWithValue(error.message);
  }
})


export const ConfirmBooking = createAsyncThunk("commonSpace/ConfirmBooking", async ({ data, newBooking, requestId }, { rejectWithValue }) => {
  try {
    const response = await fetch("/resident/commonSpace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },

      credentials: "include",
      body: JSON.stringify({ data, newBooking }),

    });
    const d = await response.json();
    if (!response.ok) {
      return rejectWithValue({ error: d, requestId });
    }
    return { space: d.space, requestId };
  } catch (error) {
    return rejectWithValue(error.message);
  }
}
)



export const fetchDataforManager = createAsyncThunk("commonSpace/fetchDataforManager", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/manager/commonSpace",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
      }
    );
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
        `/manager/spaces/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          credentials: "include",

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
        `/manager/spaces/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },

          credentials: "include"
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
      const response = await fetch("/manager/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
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

export const updateSpaceAvailabilityControls = createAsyncThunk(
  "commonSpace/updateSpaceAvailabilityControls",
  async ({ id, availabilityControls }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/manager/spaces/${id}/availability-controls`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ availabilityControls }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const ProceedPayment = createAsyncThunk("commonSpace/ProceedPayment",
  async ({ paymentData, bookingId }, { rejectWithValue }) => {
    console.log("Data in slice :", paymentData);

    try {
      const response = await fetch("/resident/payment/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },

        credentials: "include",
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }

      return data.Id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
)

export const cancelUserBooking = createAsyncThunk(
  "commonSpace/cancelBooking",
  async ({ bookingId, originalStatus }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/resident/booking/cancel/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          credentials: "include"
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue({ error: data, bookingId, originalStatus });
      }
      return { id: bookingId, message: data.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelBookingByManager = createAsyncThunk(
  "commonSpace/cancelBookingByManager",
  async (
    { bookingId, reason, refundType = "none", refundPercentage, refundAmount },
    { rejectWithValue },
  ) => {
    try {
      const payload = { reason, refundType };
      if (
        refundPercentage !== undefined &&
        refundPercentage !== null &&
        refundPercentage !== ""
      ) {
        payload.refundPercentage = Number(refundPercentage);
      }
      if (
        refundAmount !== undefined &&
        refundAmount !== null &&
        refundAmount !== ""
      ) {
        payload.refundAmount = Number(refundAmount);
      }

      const response = await fetch(`/manager/commonSpace/reject/${bookingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }

      return {
        bookingId,
        booking: data.booking,
        message: data.message,
        refund: data.refund,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);




const CommonSpaceSlice = createSlice({
  name: "CommonSpace",
  initialState,
  reducers: {
    optimisticAddBooking: (state, action) => {
      const { bookingData, requestId } = action.payload;
      state.loading = true;
      state.Bookings.push({
        ...bookingData,
        _id: requestId,
        ID: `TEMP-${requestId}`,
        name: bookingData?.name || bookingData?.facility || "Common Space",
        description: bookingData?.purpose || "No purpose specified",
        status: "Processing...",
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        payment: bookingData?.amount > 0 ? { status: "Processing..." } : null,
      });
    },

    optimisticCancelBooking: (state, action) => {
      const { bookingId, originalStatus } = action.payload;
      const bookingToUpdate = state.Bookings.find(b => b._id === bookingId);
      if (bookingToUpdate) {
        bookingToUpdate.status = "Cancelled";
      }
    },

    optimisticProceedPayment: (state, action) => {
      const { bookingId } = action.payload;
      const bookingToUpdate = state.Bookings.find(b => b._id === bookingId);
      if (bookingToUpdate) {
        if (!bookingToUpdate.payment) {
          bookingToUpdate.payment = {};
        }
        bookingToUpdate.payment.status = 'Processing...';
        state.loading = true;
      }
    },

    optimisticDeleteSpace: (state, action) => {
      state.avalaibleSpaces = state.avalaibleSpaces.filter(b => b._id !== action.payload.id)
      state.loading = false
    },

    removeOptimisticBooking: (state, action) => {
      state.Bookings = state.Bookings.filter(b => b._id !== action.payload.requestId);
      state.loading = false;
    },

    revertBookingStatus: (state, action) => {
      const { bookingId } = action.payload;
      const bookingToRevert = state.Bookings.find(b => b._id === bookingId);
      if (bookingToRevert && bookingToRevert.originalStatus) {
        bookingToRevert.status = bookingToRevert.originalStatus;
        delete bookingToRevert.originalStatus;
      }
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchuserBookings.pending, (state) => {
      state.loading = true;
    }
    ).addCase(fetchuserBookings.fulfilled, (state, action) => {
      state.loading = false;
      console.log("after fetching : ", action);
      state.Bookings = action.payload.bookings;
      state.avalaibleSpaces = action.payload.spaces;
    }).addCase(fetchuserBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(ConfirmBooking.fulfilled, (state, action) => {
      const { space, requestId } = action.payload;
      state.Bookings = state.Bookings.filter(b => b._id !== requestId);
      state.Bookings.unshift(space);


      state.loading = false;
    }).addCase(ConfirmBooking.rejected, (state, action) => {
      const requestId = action.payload?.requestId || action.meta.arg.requestId;
      state.Bookings = state.Bookings.filter(b => b._id !== requestId);
      state.loading = false;
      state.error = action.payload.error || action.payload;
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
      })
      .addCase(updateSpaceAvailabilityControls.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSpaceAvailabilityControls.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSpace = action.payload?.space;
        if (!updatedSpace) return;

        const index = state.avalaibleSpaces.findIndex(
          (space) => space._id === updatedSpace._id,
        );
        if (index !== -1) {
          state.avalaibleSpaces[index] = updatedSpace;
        }
      })
      .addCase(updateSpaceAvailabilityControls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(cancelUserBooking.fulfilled, (state, action) => {
        const idToCancel = action.payload.id;
        const bookingToUpdate = state.Bookings.find(b => b._id === idToCancel);
        if (bookingToUpdate) {
          bookingToUpdate.status = "Cancelled";
          bookingToUpdate.isCancelled = true;
          delete bookingToUpdate.originalStatus;
        }
        state.loading = false;
      })
      .addCase(cancelUserBooking.rejected, (state, action) => {
        const bookingId = action.meta.arg.bookingId;
        const bookingToRevert = state.Bookings.find(b => b._id === bookingId);
        if (bookingToRevert && bookingToRevert.originalStatus) {
          bookingToRevert.status = bookingToRevert.originalStatus;
          delete bookingToRevert.originalStatus;
        }
        state.loading = false;
        state.error = action.payload.error || action.payload;
      })
      .addCase(ProceedPayment.fulfilled, (state, action) => {

        const bookingId = action.payload;
        const bookingToUpdate = state.Bookings.find(b => b._id === bookingId);

        if (bookingToUpdate) {
          bookingToUpdate.status = 'Booked';
          bookingToUpdate.payment.status = 'Completed';
        }
        state.loading = false;
      })
      .addCase(ProceedPayment.rejected, (state, action) => {
        const bookingId = action.meta.arg.bookingId;
        const bookingToRevert = state.Bookings.find(b => b._id === bookingId);

        if (bookingToRevert && bookingToRevert.payment) {
          bookingToRevert.payment.status = 'Failed';
        }
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelBookingByManager.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelBookingByManager.fulfilled, (state, action) => {
        const { bookingId, booking } = action.payload;
        const index = state.Bookings.findIndex((entry) => entry._id === bookingId);
        if (index !== -1) {
          state.Bookings[index] = booking || {
            ...state.Bookings[index],
            status: "Cancelled By Manager",
          };
        }
        state.loading = false;
      })
      .addCase(cancelBookingByManager.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },

});


export const { optimisticDeleteSpace, optimisticAddBooking, optimisticCancelBooking, optimisticProceedPayment, removeOptimisticBooking, revertBookingStatus } = CommonSpaceSlice.actions;

export default CommonSpaceSlice.reducer;
