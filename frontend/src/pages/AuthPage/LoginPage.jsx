import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Gavel } from 'lucide-react';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setLoginError('');
    try {
      const result = await login(data);
      if (result.success) {
        navigate('/');
      } else {
        setLoginError(result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error) {
      setLoginError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1c130d] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/60"></div>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3lOhq_3Y6OrfAix1xjc_nb_LlR4TQDtxBQWydEaqI0T0ttRqz3C2fi6m7w3Vo3d8bGgxZKsGKUL09yr-qJdb1D5lPBNON3EbSNIj3Q6-J8NTdGK3m4bc-1iyG8kBDOa3S0zVKTmA-y0yszjlpwtiGwK65D1QCRwz_fUT2MGrx_eoDWlAUQlSEaY7kmWyOoIILUi8ROpGkxTeYNFgzXlMHVE7si1vpp4H-fCu2HvAPDpZnqm1UYA7YMjbkx_pphC1sJ0Yvz0njcCDA"
          alt="Login Background"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="relative z-20 p-12 text-white max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#f26c0d] p-3 rounded-2xl">
              <Gavel className="text-white" size={32} />
            </div>
            <span className="text-3xl font-black tracking-tighter">BidMaster</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Khám phá những món đồ <span className="text-[#f26c0d]">độc bản</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Tham gia cộng đồng đấu giá trực tuyến hàng đầu. Đấu giá minh bạch, thanh toán an toàn, và sở hữu những vật phẩm giá trị.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8f7f5] lg:bg-white">
        <div className="w-full max-w-md space-y-8 bg-white lg:bg-transparent p-8 lg:p-0 rounded-2xl shadow-xl lg:shadow-none border border-gray-100 lg:border-none">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-[#1c130d] mb-2">Chào mừng trở lại!</h2>
            <p className="text-[#9c6c49]">Vui lòng nhập thông tin để đăng nhập</p>
          </div>

          {loginError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm text-red-700">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#f26c0d] focus:ring-orange-100'} bg-[#f8f7f5] focus:bg-white outline-none transition-all duration-200`}
                placeholder="example@email.com"
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ"
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <a href="#" className="text-sm font-medium text-[#f26c0d] hover:text-orange-700 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
              <input
                type="password"
                className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#f26c0d] focus:ring-orange-100'} bg-[#f8f7f5] focus:bg-white outline-none transition-all duration-200`}
                placeholder="••••••••"
                {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 bg-[#f26c0d] hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transform transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang đăng nhập...
                </span>
              ) : 'Đăng Nhập'}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-[#f26c0d] hover:text-orange-700 transition-colors">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
