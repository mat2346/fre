import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DiagramViewer } from './components/DiagramViewer';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { isAuthenticated, loading } = useAuth();
  
  const router = createBrowserRouter([
    {
      path: "/",
      element: isAuthenticated ? <DiagramViewer /> : <Navigate to="/login" replace />
    },
    {
      path: "/login",
      element: isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
    }
  ]);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return (
    <div className="app-container">
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
