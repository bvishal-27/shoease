import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import * as cartApi from "@/api/cartApi";
import { logout } from "./authSlice";

const getError = (err) => ({
  message: err.response?.data?.message || err.message || "Something went wrong",
  status: err.response?.status,
});

// Small helper so we don't repeat try/catch in every thunk
const makeThunk = (name, request) =>
  createAsyncThunk(`cart/${name}`, async (arg, { rejectWithValue }) => {
    try {
      return await request(arg);
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  });

export const fetchCart = makeThunk("fetch", () => cartApi.getCart());
export const addToCart = makeThunk("add", ({ productId, quantity }) =>
  cartApi.addItem(productId, quantity)
);
export const updateCartItem = makeThunk("update", ({ productId, quantity }) =>
  cartApi.updateItem(productId, quantity)
);
export const removeFromCart = makeThunk("remove", (productId) =>
  cartApi.removeItem(productId)
);
export const clearCart = makeThunk("clear", () => cartApi.clearAll());

const initialState = {
  items: [],
  itemsCount: 0,
  itemsPrice: 0,
  shippingPrice: 0,
  taxPrice: 0,
  totalPrice: 0,
  loading: false, // first load of the cart
  updating: false, // add / update / remove in progress
  loaded: false, // true once the first load has finished
};

const changeThunks = [addToCart, updateCartItem, removeFromCart, clearCart];

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // After an order is placed the server has already emptied the cart
    resetCart: () => ({ ...initialState, loaded: true }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.loading = false;
        state.loaded = true;
      })
      .addCase(fetchCart.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      // logging out clears the cart from the screen
      .addCase(logout, () => initialState)
      .addMatcher(isAnyOf(...changeThunks.map((t) => t.pending)), (state) => {
        state.updating = true;
      })
      .addMatcher(
        isAnyOf(...changeThunks.map((t) => t.fulfilled)),
        (state, action) => {
          Object.assign(state, action.payload);
          state.updating = false;
        }
      )
      .addMatcher(isAnyOf(...changeThunks.map((t) => t.rejected)), (state) => {
        state.updating = false;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;