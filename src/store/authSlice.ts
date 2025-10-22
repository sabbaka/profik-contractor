import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getToken, saveToken, deleteToken } from '../utils/tokenStorage';

interface AuthState {
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  token: null,
  loading: true,
};

export const loadTokenFromStorage = createAsyncThunk('auth/loadToken', async () => {
  const token = await getToken();
  console.log('🔑 Loaded token from SecureStore:', token);
  return token;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      saveToken(action.payload);
    },
    logout: (state) => {
      state.token = null;
      deleteToken();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadTokenFromStorage.fulfilled, (state, action) => {
      state.token = action.payload;
      state.loading = false;
    });
    builder.addCase(loadTokenFromStorage.rejected, (state) => {
      state.loading = false;
    });
  }
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
