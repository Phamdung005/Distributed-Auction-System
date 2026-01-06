import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth';
import { NavbarSelector } from './components/layout/Navbar';

// Pages
import { LoginPage, RegisterPage } from './pages/AuthPage';
import { HomePage, AuctionDetailPage, ProfilePage, AuctionListPage, AuctionCommunityPage, BidderNotification } from './pages/BidderPage';
import { CreateAuctionPage, MyAuctionsPage } from './pages/SellerPage';
import { SupportPage } from './components/support';

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <div className="webapp">
                    <NavbarSelector />
                    <div className="container" style={{minHeight: 'calc(100vh - 80px)' }}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/" element={<HomePage />} />
                            <Route path="/auction/:id" element={<AuctionDetailPage />} />
                            <Route path="/support" element={<SupportPage />} />
                            <Route path="/auction-list" element={<AuctionListPage />} />

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
                            <Route path="/auction-community" element={
                                <PrivateRoute>
                                    <AuctionCommunityPage />
                                </PrivateRoute>
                            } />
                            <Route path="/notifications" element={
                                <PrivateRoute>
                                    <BidderNotification />
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
