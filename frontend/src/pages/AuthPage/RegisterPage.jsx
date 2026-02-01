import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Gavel, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setRegisterError('');
    try {
      const { confirmPassword, ...userData } = data;
      const result = await registerUser(userData);
      if (result.success) {
        navigate('/');
      } else {
        setRegisterError(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setRegisterError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
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
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-AbqajDCQX7o5jQRIv_yp4wBxOOHlakS5HmUeWK4KRxInsyz9Z3jnhjNv2Ck3BnPDNUsmz-YBzNffUAse0c_a1sf9EpY5UvIZNBUH2kgdaJalof6LPeGXHcEXQtJLy_TwyWiPvAFvxeAyOxRZCxuEc2w2jiZaOI_90veWICVYLZ_saRJKg0YpvQweKV4sz_i2drzbPvXEwk5voxWZgp5qTvx8BP22zw4HuTOdJFvldHr_odtVfyfJUjXbXWx0YkQQUV_gFiEGfD2W"
          alt="Registration Background"
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
            Bắt đầu hành trình <span className="text-[#f26c0d]">đấu giá</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Tạo tài khoản miễn phí để tham gia đấu giá, theo dõi sản phẩm yêu thích và trở thành người chiến thắng.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8f7f5] lg:bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-6 bg-white lg:bg-transparent p-8 lg:p-0 rounded-2xl shadow-xl lg:shadow-none border border-gray-100 lg:border-none my-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-[#1c130d] mb-2">Tạo tài khoản mới</h2>
            <p className="text-[#9c6c49]">Điền thông tin bên dưới để đăng ký</p>
          </div>

          {registerError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm text-red-700">{registerError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#f26c0d]'} bg-[#f8f7f5] focus:bg-white outline-none transition-all`}
                placeholder="example@email.com"
                {...register('email', {
                  required: 'Email là bắt buộc',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Email không hợp lệ' }
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#f26c0d]'} bg-[#f8f7f5] focus:bg-white outline-none transition-all`}
                  placeholder="Nguyễn Văn A"
                  {...register('fullName', { required: 'Họ tên là bắt buộc' })}
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#f26c0d]'} bg-[#f8f7f5] focus:bg-white outline-none transition-all`}
                  placeholder="0123456789"
                  {...register('phone', {
                    pattern: { value: /^[0-9]{10,11}$/, message: 'SĐT không hợp lệ' }
                  })}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label>
              <select
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.role ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#f26c0d]'} bg-[#f8f7f5] focus:bg-white outline-none transition-all cursor-pointer`}
                {...register('role', { required: 'Vai trò là bắt buộc' })}
                defaultValue="bidder"
              >
                <option value="bidder">Người mua (Bidder)</option>
                <option value="seller">Người bán (Seller)</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#f26c0d]'} bg-[#f8f7f5] focus:bg-white outline-none transition-all pr-12`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Mật khẩu là bắt buộc',
                    minLength: { value: 6, message: 'Tối thiểu 6 ký tự' },
                    pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Cần 1 hoa, 1 thường, 1 số' }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#f26c0d] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#f26c0d]'} bg-[#f8f7f5] focus:bg-white outline-none transition-all pr-12`}
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: 'Xác nhận mật khẩu',
                    validate: value => value === password || 'Mật khẩu không khớp'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#f26c0d] transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 mt-4 bg-[#f26c0d] hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transform transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang tạo tài khoản...
                </span>
              ) : 'Đăng Ký Tài Khoản'}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-[#f26c0d] hover:text-orange-700 transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
