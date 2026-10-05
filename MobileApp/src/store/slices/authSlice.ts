import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type User = {
  id: number | string;
  email: string;
  username?: string;
  name?: string;
  role?: string;
  phone?: string;
};

export type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        user: User | null;
      }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },

    logout: state => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },

    restoreSession: (
      state,
      action: PayloadAction<{
        token: string;
        user: User | null;
      }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
});

export const {setCredentials, logout, restoreSession} = authSlice.actions;

export default authSlice.reducer;