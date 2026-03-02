import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import leaveService from '../Services/leaveService';

export const applyLeave = createAsyncThunk('leave/apply', async (payload, thunkAPI) => {
  const res = await leaveService.applyLeave(payload);
  return res.data;
});

export const fetchLeaves = createAsyncThunk('leave/fetch', async (params, thunkAPI) => {
  const res = await leaveService.listLeaves(params);
  return res.data;
});

export const approveLeave = createAsyncThunk('leave/approve', async ({ id, notes }, thunkAPI) => {
  const res = await leaveService.approveLeave(id, { notes });
  return res.data;
});

export const rejectLeave = createAsyncThunk('leave/reject', async ({ id, notes }, thunkAPI) => {
  const res = await leaveService.rejectLeave(id, { notes });
  return res.data;
});

const leaveSlice = createSlice({
  name: 'leave',
  initialState: { leaves: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(applyLeave.fulfilled, (state, action) => {
        const added = action.payload.leave || action.payload;
        // support response shape { success:true, leave }
        state.leaves.unshift(added);
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload.leaves || action.payload;
      })
      .addCase(approveLeave.fulfilled, (state, action) => {
        const updated = action.payload.leave || action.payload;
        state.leaves = state.leaves.map(l => (String(l._id) === String(updated._id) ? updated : l));
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const updated = action.payload.leave || action.payload;
        state.leaves = state.leaves.map(l => (String(l._id) === String(updated._id) ? updated : l));
      });
  }
});

export default leaveSlice.reducer;
