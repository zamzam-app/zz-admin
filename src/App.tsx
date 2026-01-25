import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import router from './routes';
import { AuthProvider } from './lib/context/AuthContext';
import { ForgotPasswordProvider } from './lib/context/ForgotPasswordContext';
import { queryClient } from './lib/react-query/react-query';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ForgotPasswordProvider>
          <RouterProvider router={router} />
        </ForgotPasswordProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
