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

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <PreferencesProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/setup"
                  element={
                    <ProtectedRoute requireSetup>
                      <Setup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <Documents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/collaborate"
                  element={
                    <ProtectedRoute>
                      <Collaborate />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          </PreferencesProvider>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
