import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { AuthProvider } from './lib/context/AuthContext';
import { ForgotPasswordProvider } from './lib/context/ForgotPasswordContext';

function App() {
  return (
    <AuthProvider>
      <ForgotPasswordProvider>
        <RouterProvider router={router} />
      </ForgotPasswordProvider>
    </AuthProvider>
  );
}

export default App;
