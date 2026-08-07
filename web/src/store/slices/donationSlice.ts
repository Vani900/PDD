import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
interface DonationState { items: any[]; total: number; isLoading: boolean }
const donationSlice = createSlice({
  name: 'donations', initialState: { items: [], total: 0, isLoading: false } as DonationState,
  reducers: {
    setDonations(state, action: PayloadAction<{ items: any[]; total: number }>) { state.items = action.payload.items; state.total = action.payload.total },
    addDonation(state, action: PayloadAction<any>) { state.items.unshift(action.payload); state.total++ },
    setLoading(state, action: PayloadAction<boolean>) { state.isLoading = action.payload },
  },
})
export const { setDonations, addDonation, setLoading } = donationSlice.actions
export default donationSlice.reducer
