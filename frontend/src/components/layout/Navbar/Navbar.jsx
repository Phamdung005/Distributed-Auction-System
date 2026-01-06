import React, {useState} from 'react';
import { Link, useNavigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Gavel, Bell, LogOut, User, Search } from 'lucide-react';


const NavLink = ({ to, children }) => (
    <Link
        to={to}
        className="px-4 py-2 text-gray-700 text-sm font-semibold rounded-full hover:text-[#f26c0d] hover:bg-white transition-all duration-200"
    >
        {children}
    </Link>
);


const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [searchKeyword, setSearchKeyword] = useState('');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchKeyword.trim()) {
            navigate(`/auction-list?search=${encodeURIComponent(searchKeyword)}`);
        }
    };

    return (
        <div className="w-full font-sans">
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6 flex-1">
                    <Link to="/" className="flex items-center gap-2 shrink-0 group">
                        <div className="bg-[#f26c0d] p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                            <Gavel className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-gray-800">
                            BidMaster
                        </span>
                    </Link>
                    <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-3xl relative">
                        <Search className="absolute left-4 text-gray-400" size={18} />
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-2.5 bg-[#f5f0eb] border-none rounded-2xl text-sm placeholder-gray-500 focus:ring-2 focus:ring-orange-200 focus:bg-white outline-none transition-all"
                            placeholder="Search for items, brands, or categories..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </form>
                </div>
                <nav className="hidden lg:flex items-center bg-gray-50/50 px-2 py-1 rounded-full border border-gray-100">
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/auction-list">Auctions</NavLink>
                    <NavLink to="/support">Support</NavLink>
                </nav>
                <div className="flex items-center gap-3">

                    <div className="flex items-center gap-2">
                        <Link to="/login" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#f26c0d] transition-colors">
                            Login
                        </Link>
                        <Link to="/register" className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#f26c0d] transition-colors">
                            Register
                        </Link>
                    </div>
                </div>
            </header>
        </div>
    );
};

export default Navbar;