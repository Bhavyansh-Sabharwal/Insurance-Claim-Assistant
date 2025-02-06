import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Setup from './pages/Setup';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import Documents from './pages/Documents';
import Collaborate from './pages/Collaborate';
import theme from './theme';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSetup?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSetup = false }) => {
  const { currentUser, loading } = useAuth();
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!currentUser) {
        setCheckingSetup(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setSetupCompleted(userDoc.exists() ? userDoc.data()?.setupCompleted ?? false : false);
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [currentUser]);

  if (loading || checkingSetup) {
    return null; // Or a loading spinner
  }

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  // Redirect to inventory if trying to access setup after completion
  if (setupCompleted && requireSetup) {
    return <Navigate to="/inventory" />;
  }

  // Redirect to setup if trying to access protected pages before setup
  if (!setupCompleted && !requireSetup) {
    return <Navigate to="/setup" />;
  }

  return <>{children}</>;
};

/**
 * Main Application Component
 * 
 * This is the root component of the application that handles:
 * - Application routing
 * - Theme provider integration
 * - Authentication state management
 * - Global layout structure
 */

const App: React.FC = () => {
  return (
    // Apply custom theme to all components
    <ChakraProvider theme={theme}>
      {/* Handle authentication state */}
      <AuthProvider>
        {/* Manage user preferences */}
        <PreferencesProvider>
          {/* Set up routing */}
          <Router>
            {/* Apply global layout */}
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<Setup />} />
                
                {/* Protected routes */}
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/collaborate" element={<Collaborate />} />
              </Routes>
            </Layout>
          </Router>
        </PreferencesProvider>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;
