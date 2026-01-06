import React, { useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { NavbarAdmin, NavbarBidder, NavbarSeller, Navbar } from '../Navbar';

const NavbarSelector = () => {
    const { user, isAuthenticated } = useContext(AuthContext); //Lấy user từ context

    if (!isAuthenticated) {
        return <Navbar />;
    }

    switch (user?.role) {
        case 'admin':
            return <NavbarAdmin />;
        case 'seller':
            return <NavbarSeller />;
        case 'bidder':
            return <NavbarBidder />;
        default:
            return <Navbar />;
    }
};

export default NavbarSelector;