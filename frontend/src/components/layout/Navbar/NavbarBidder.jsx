import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './Navbar.css';

const NavbarBidder = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        🔨 Đấu Giá Realtime
                    </Link>

                    <div className="navbar-menu">
                        <Link to="/" className="navbar-link">Trang chủ</Link>

                        {isAuthenticated ? (
                            <>
                                <Link to="/auction-list" className="navbar-link">Auction</Link>
                                <Link to="/auction-community" className="navbar-link">Community</Link>
                                <div className="navbar-user">
                                    <span className="navbar-username">👤 {user?.fullName}</span>
                                    <span className="navbar-balance">
                                        💰 {user?.balance?.toLocaleString('vi-VN')} VND
                                    </span>
                                    <button onClick={handleLogout} className="btn btn-secondary">
                                        Đăng xuất
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
                                <Link to="/register" className="btn btn-success">Đăng ký</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavbarBidder;
