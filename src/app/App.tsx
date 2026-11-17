/**
 * App Component
 * Main application component with routing and auth provider
 */

import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@routes';
import { AuthProvider } from '@hooks/useAuth';
import { UserProfileProvider } from '@context/UserProfileContext';

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProfileProvider>
          <AppRoutes />
        </UserProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
