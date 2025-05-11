import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Cars from './pages/Cars';
import Users from './pages/Users';
import Auctions from './pages/Auctions';
import TestUsers from './pages/TestUsers';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <AdminRoute>
                  <Layout>
                    <Navigate to="/cars" />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/cars"
              element={
                <AdminRoute>
                  <Layout>
                    <Cars />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/auctions"
              element={
                <AdminRoute>
                  <Layout>
                    <Auctions />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/test-users"
              element={
                <AdminRoute>
                  <Layout>
                    <TestUsers />
                  </Layout>
                </AdminRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
