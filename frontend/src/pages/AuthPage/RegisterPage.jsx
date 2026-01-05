import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import './RegisterPage.css';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Đăng Ký</h1>
          <p className="auth-subtitle">Tạo tài khoản mới</p>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input
                type="text"
                className="form-input"
                placeholder="username123"
                {...register('username', {
                  required: 'Tên đăng nhập là bắt buộc',
                  minLength: {
                    value: 3,
                    message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Chỉ chứa chữ cái, số và dấu gạch dưới'
                  }
                })}
              />
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="example@email.com"
                {...register('email', {
                  required: 'Email là bắt buộc',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ'
                  }
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Họ tên</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nguyễn Văn A"
                {...register('fullName', {
                  required: 'Họ tên là bắt buộc'
                })}
              />
              {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-input"
                placeholder="0123456789"
                {...register('phone', {
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: 'Số điện thoại không hợp lệ'
                  }
                })}
              />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Mật khẩu là bắt buộc',
                  minLength: {
                    value: 6,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
                  }
                })}
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: value => value === password || 'Mật khẩu không khớp'
                })}
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-success btn-block"
              disabled={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="auth-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
