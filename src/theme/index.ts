import { createTheme } from '@mui/material/styles';
import { components } from './components'

export const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
  },
  components,
})
