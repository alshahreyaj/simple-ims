import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // blue
    },
    secondary: {
      main: '#00bfae', // teal
    },
    background: {
      default: '#f5f6fa',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: 18,
    h5: { fontWeight: 700, fontSize: '2rem' },
    h6: { fontWeight: 600, fontSize: '1.3rem' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '1.1rem' },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          background: '#fff',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          background: '#f0f4f8',
          fontWeight: 700,
        },
        body: {
          fontSize: 15,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme; 