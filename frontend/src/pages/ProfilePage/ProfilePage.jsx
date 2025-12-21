import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user) {
            setValue('username', user.username);
            setValue('email', user.email);
            setValue('fullName', user.fullName);
            setValue('phone', user.phone || '');
        }
    }, [user, setValue]);

    const onUpdateProfile = async (data) => {
        setLoading(true);
        try {
            const { username, email, ...updateData } = data; // Không cho phép đổi username/email
            await authAPI.updateProfile(updateData);
            toast.success('Cập nhật thông tin thành công! 🎉');
        } catch (error) {
            toast.error('Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    const onChangePassword = async (data) => {
        setLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            toast.success('Đổi mật khẩu thành công! 🎉');
            setValue('currentPassword', '');
            setValue('newPassword', '');
            setValue('confirmPassword', '');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return <div className="flex-center" style={{ minHeight: '50vh' }}>Loading...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1 className="page-title">👤 Thông Tin Cá Nhân</h1>

                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Hồ sơ
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        Đổi mật khẩu
                    </button>
                </div>

                <div className="profile-content">
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSubmit(onUpdateProfile)} className="profile-form">
                            <div className="user-info-card">
                                <div className="user-avatar">
                                    <div className="avatar-circle">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="user-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Số dư</span>
                                        <span className="stat-value">
                                            {user.balance?.toLocaleString('vi-VN') || 0} ₫
                                        </span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Đấu giá tham gia</span>
                                        <span className="stat-value">{user.auctionsParticipated || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Đấu giá thắng</span>
                                        <span className="stat-value">{user.auctionsWon || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    disabled
                                    {...register('username')}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    disabled
                                    {...register('email')}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Họ tên *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    {...register('fullName', { required: 'Họ tên là bắt buộc' })}
                                />
                                {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Số điện thoại</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    {...register('phone', {
                                        pattern: {
                                            value: /^[0-9]{10,11}$/,
                                            message: 'Số điện thoại không hợp lệ'
                                        }
                                    })}
                                />
                                {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang cập nhật...' : '✅ Cập nhật'}
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleLogout}>
                                    🚪 Đăng xuất
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handleSubmit(onChangePassword)} className="profile-form">
                            <div className="form-group">
                                <label className="form-label">Mật khẩu hiện tại *</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    {...register('currentPassword', {
                                        required: 'Mật khẩu hiện tại là bắt buộc'
                                    })}
                                />
                                {errors.currentPassword && (
                                    <p className="form-error">{errors.currentPassword.message}</p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mật khẩu mới *</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    {...register('newPassword', {
                                        required: 'Mật khẩu mới là bắt buộc',
                                        minLength: {
                                            value: 6,
                                            message: 'Mật khẩu phải có ít nhất 6 ký tự'
                                        },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                            message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số'
                                        }
                                    })}
                                />
                                {errors.newPassword && (
                                    <p className="form-error">{errors.newPassword.message}</p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Xác nhận mật khẩu mới *</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    {...register('confirmPassword', {
                                        required: 'Vui lòng xác nhận mật khẩu',
                                        validate: (value, formValues) =>
                                            value === formValues.newPassword || 'Mật khẩu không khớp'
                                    })}
                                />
                                {errors.confirmPassword && (
                                    <p className="form-error">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-success" disabled={loading}>
                                    {loading ? 'Đang đổi...' : '🔒 Đổi mật khẩu'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
