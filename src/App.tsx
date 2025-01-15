import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Inventory from './pages/Inventory';
import Documents from './pages/Documents';
import Collaborate from './pages/Collaborate';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/collaborate" element={<Collaborate />} />
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
}

export default App;
