import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth';
import Navbar from './components/layout/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import MyAuctionsPage from './pages/MyAuctionsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="webapp">
                    <Navbar />
                    <div className="container" style={{ marginTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/" element={<HomePage />} />
                            <Route path="/auction/:id" element={<AuctionDetailPage />} />

                            {/* Protected routes */}
                            <Route path="/create-auction" element={
                                <PrivateRoute>
                                    <CreateAuctionPage />
                                </PrivateRoute>
                            } />
                            <Route path="/my-auctions" element={
                                <PrivateRoute>
                                    <MyAuctionsPage />
                                </PrivateRoute>
                            } />
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <ProfilePage />
                                </PrivateRoute>
                            } />

                            {/* Redirect */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>

                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
