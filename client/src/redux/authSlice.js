import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import api from "@/api/axios";

const STORAGE_KEY = "shopease_user";

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

const saveUser = (user) => localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
const clearUser = () => localStorage.removeItem(STORAGE_KEY);

// Turns an Axios error into a simple object
const getError = (err) => ({
  message: err.response?.data?.message || err.message || "Something went wrong",
  status: err.response?.status,
});

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/register", data);
      return res.data.user;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", data);
      return res.data.user;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// Checks the saved token with the server when the app loads
export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data.user;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

const storedUser = loadUser();

const initialState = {
  user: storedUser,
  loading: false,
  // true while we verify a saved token, so protected pages don't flash the login page
  checking: Boolean(storedUser?.token),
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      clearUser();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        // keep the token, refresh name/email/role from the server
        state.user = { ...state.user, ...action.payload };
        state.checking = false;
        saveUser(state.user);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.checking = false;
        // only log out if the token is really invalid (not if the server is down)
        if (action.payload?.status === 401) {
          state.user = null;
          clearUser();
        }
      })
      .addMatcher(isAnyOf(registerUser.pending, loginUser.pending), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(
        isAnyOf(registerUser.fulfilled, loginUser.fulfilled),
        (state, action) => {
          state.loading = false;
          state.user = action.payload;
          saveUser(action.payload);
        }
      )
      .addMatcher(
        isAnyOf(registerUser.rejected, loginUser.rejected),
        (state, action) => {
          state.loading = false;
          state.error = action.payload?.message || "Something went wrong";
        }
      );
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;