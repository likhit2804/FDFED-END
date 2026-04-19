import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch tasks assigned to the worker
export const fetchWorkerTasks = createAsyncThunk(
  "workerTasks/fetchWorkerTasks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/worker/api/tasks");
      const data = res.data;
      return data.tasks || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Start a task
export const startWorkerTask = createAsyncThunk(
  "workerTasks/startWorkerTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/worker/issue/start/${taskId}`);
      const data = res.data;
      if (!data.success) throw new Error(data.message);
      return { taskId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Resolve a task
export const resolveWorkerTask = createAsyncThunk(
  "workerTasks/resolveWorkerTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/worker/issue/resolve/${taskId}`);
      const data = res.data;
      if (!data.success) throw new Error(data.message);
      return { taskId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Mark as misassigned
export const misassignedWorkerTask = createAsyncThunk(
  "workerTasks/misassignedWorkerTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/worker/issue/misassigned/${taskId}`);
      const data = res.data;
      if (!data.success) throw new Error(data.message);
      return { taskId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const workerTasksSlice = createSlice({
  name: "workerTasks",
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkerTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkerTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchWorkerTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startWorkerTask.fulfilled, (state, action) => {
        const idx = state.tasks.findIndex(t => t._id === action.payload.taskId);
        if (idx !== -1) state.tasks[idx].status = "In Progress";
      })
      .addCase(resolveWorkerTask.fulfilled, (state, action) => {
        const idx = state.tasks.findIndex(t => t._id === action.payload.taskId);
        if (idx !== -1) state.tasks[idx].status = "Resolved (Awaiting Confirmation)";
      })
      .addCase(misassignedWorkerTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload.taskId);
      });
  },
});

export default workerTasksSlice.reducer;
