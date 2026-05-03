import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { LikesProvider } from './context/LikesContext';
import { PagesProvider } from './context/PagesContext';

function App() {
  return (
    <AuthProvider>
      <LikesProvider>
        <PagesProvider>
          <RouterProvider router={router} />
        </PagesProvider>
      </LikesProvider>
    </AuthProvider>
  );
}

export default App
