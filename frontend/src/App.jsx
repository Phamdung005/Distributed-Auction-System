import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth';
import { NavbarSelector } from './components/layout/Navbar';

// Pages
import { LoginPage, RegisterPage } from './pages/AuthPage';
import { HomePage, AuctionDetailPage, BidderProfilePage, AuctionListPage, AuctionCommunityPage, BidderNotification, SearchResultPage, WalletPage } from './pages/BidderPage';
import { CreateAuctionPage, MyAuctionsPage, SellerProfilePage } from './pages/SellerPage';
import { SupportPage } from './components/support';
import OrderListPage from './pages/OrderPage/OrderListPage';
import OrderDetailPage from './pages/OrderPage/OrderDetailPage';
import AdminDashboard from './pages/AdminPage/AdminDashboard';

const MainContainer = ({ children }) => {
    const location = useLocation();
    const isFullWidthPage = location.pathname === '/' ||
        location.pathname === '/auction-list' ||
        location.pathname.startsWith('/search') ||
        location.pathname === '/login' ||
        location.pathname === '/register' ||
        location.pathname === '/profile' ||
        location.pathname === '/wallet' ||
        location.pathname === '/notifications' ||
        location.pathname.startsWith('/auction/');

    return (
        <div
            className={isFullWidthPage ? "w-full" : "container mx-auto px-4"}
            style={{ minHeight: 'calc(100vh - 80px)' }}
        >
            {children}
        </div>
    );
};

import { useAuth } from './contexts/AuthContext';

const ProfileRedirect = () => {
    const { user } = useAuth();
    if (user?.role === 'seller') {
        return <SellerProfilePage />;
    }
    return <BidderProfilePage />;
};

const AdminRouteWrapper = ({ children }) => {
    const location = useLocation();
    if (location.pathname.startsWith('/admin')) {
        return null;
    }
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <div className="webapp">
                    <AdminRouteWrapper>
                        <NavbarSelector />
                    </AdminRouteWrapper>
                    <MainContainer>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/" element={<HomePage />} />
                            <Route path="/auction/:id" element={<AuctionDetailPage />} />
                            <Route path="/support" element={<SupportPage />} />
                            <Route path="/auction-list" element={<AuctionListPage />} />
                            <Route path="/search" element={<SearchResultPage />} />

                            {/* Protected routes */}
                            <Route path="/create-auction" element={
                                <PrivateRoute>
                                    <CreateAuctionPage />
                                </PrivateRoute>
                            } />
                            <Route path="/edit-auction/:id" element={
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
                                    <ProfileRedirect />
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
                            <Route path="/wallet" element={
                                <PrivateRoute>
                                    <WalletPage />
                                </PrivateRoute>
                            } />
                            <Route path="/orders" element={
                                <PrivateRoute>
                                    <OrderListPage />
                                </PrivateRoute>
                            } />
                            <Route path="/orders/:id" element={
                                <PrivateRoute>
                                    <OrderDetailPage />
                                </PrivateRoute>
                            } />
                            <Route path="/admin" element={
                                <PrivateRoute>
                                    <AdminDashboard />
                                </PrivateRoute>
                            } />

                            {/* Redirect */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </MainContainer>

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
