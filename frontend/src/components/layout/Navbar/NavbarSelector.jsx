import React, { useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { NavbarAdmin, NavbarBidder, NavbarSeller } from '../Navbar';

const NavbarSelector = () => {
    const { user, isAuthenticated } = useContext(AuthContext); //Lấy user từ context

    if (!isAuthenticated) {
        return <NavbarBidder />;
    }

    switch (user?.role) {
        case 'admin':
            return <NavbarAdmin />;
        case 'seller':
            return <NavbarSeller />;
        case 'bidder':
            return <NavbarBidder />;
        default:
            return <NavbarBidder />;
    }
};

export default NavbarSelector;