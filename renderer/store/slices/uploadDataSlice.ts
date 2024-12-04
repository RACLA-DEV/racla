import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UploadDataState {
  projectRaData: any
  vArchiveData: any
}

const initialState: UploadDataState = {
  projectRaData: null,
  vArchiveData: null,
}

const uploadDataSlice = createSlice({
  name: 'uploadData',
  initialState,
  reducers: {
    setProjectRaData: (state, action: PayloadAction<any>) => {
      state.projectRaData = action.payload
    },
    setVArchiveData: (state, action: PayloadAction<any>) => {
      state.vArchiveData = action.payload
    },
    clearProjectRaData: (state) => {
      state.projectRaData = null
    },
    clearVArchiveData: (state) => {
      state.vArchiveData = null
    },
  },
})

export const { setProjectRaData, setVArchiveData, clearProjectRaData, clearVArchiveData } = uploadDataSlice.actions

export default uploadDataSlice.reducer
