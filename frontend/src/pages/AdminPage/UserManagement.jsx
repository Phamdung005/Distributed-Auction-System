import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Check,
    Lock,
    Unlock,
    MoreVertical
} from 'lucide-react';
import AdminService from '../../services/admin.service';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'bidder',
        phone: '',
        isActive: true
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await AdminService.getUsers();
            // Assuming res.data contains the list because of backend structure
            setUsers(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );

    const handleShowAdd = () => {
        setModalMode('add');
        setFormData({
            fullName: '',
            email: '',
            password: '',
            role: 'bidder',
            phone: '',
            isActive: true
        });
        setShowModal(true);
    };

    const handleShowEdit = (user) => {
        setModalMode('edit');
        setCurrentUser(user);
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            password: '', // Don't show password
            role: user.role,
            phone: user.phone || '',
            isActive: user.isActive
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await AdminService.createUser(formData);
                toast.success("Thêm người dùng thành công");
            } else {
                // If password is empty, remove it from update
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;

                await AdminService.updateUser(currentUser.id, updateData);
                toast.success("Cập nhật người dùng thành công");
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa user này? Hành động này không thể hoàn tác.")) return;
        try {
            await AdminService.deleteUser(id);
            toast.success("Xóa người dùng thành công");
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xóa người dùng");
        }
    };

    const toggleStatus = async (user) => {
        try {
            await AdminService.updateUser(user.id, { isActive: !user.isActive });
            toast.success(`Đã ${!user.isActive ? 'mở khóa' : 'khóa'} người dùng`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <button
                    onClick={handleShowAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
                >
                    <Plus size={18} />
                    <span>Thêm người dùng</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8F9FA]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        Không tìm thấy người dùng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                                    {user.fullName?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{user.phone || '---'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border transition-colors ${user.isActive
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                                    }`}
                                            >
                                                {user.isActive ? <Check size={12} /> : <Lock size={12} />}
                                                {user.isActive ? 'Active' : 'Blocked'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleShowEdit(user)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {user.role !== 'admin' && ( // Prevent deleting admin
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {modalMode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa thông tin'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    disabled={modalMode === 'edit'}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none ${modalMode === 'edit' ? 'bg-gray-100 text-gray-500' : ''}`}
                                />
                            </div>

                            {(modalMode === 'add') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                    <input
                                        type="password"
                                        required={modalMode === 'add'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={modalMode === 'edit' ? 'Để trống nếu không đổi' : ''}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            )}

                            {modalMode === 'edit' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (Tùy chọn)</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Để trống nếu không đổi"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                >
                                    <option value="bidder">Bidder</option>
                                    <option value="seller">Seller</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-sm mt-4"
                            >
                                {modalMode === 'add' ? 'Thêm người dùng' : 'Lưu thay đổi'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
