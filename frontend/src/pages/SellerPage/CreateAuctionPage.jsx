import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { auctionAPI } from '../../services/api';
import { Upload, X, DollarSign, Clock, Tag, FileText, Image as ImageIcon, AlertCircle, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

const CreateAuctionPage = () => {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [imageUrls, setImageUrls] = useState(['']);

    // Fetch auction details if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchAuction = async () => {
                try {
                    setLoading(true);
                    const response = await auctionAPI.getAuctionById(id, { incrementView: false });
                    const auction = response.data.data || response.data; // Handle API response structure

                    // Populate form fields
                    setValue('title', auction.title);
                    setValue('category', auction.category);
                    setValue('condition', auction.condition || 'good'); // Adjust if condition field exists
                    setValue('description', auction.description);
                    setValue('startPrice', auction.startPrice);
                    setValue('minBidIncrement', auction.minBidIncrement);

                    // Format dates for datetime-local input (adjust to local time)
                    const formatDatetime = (dateStr) => {
                        const date = new Date(dateStr);
                        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                        return localDate.toISOString().slice(0, 16);
                    };
                    setValue('startTime', formatDatetime(auction.startTime));
                    setValue('endTime', formatDatetime(auction.endTime));

                    if (auction.images && auction.images.length > 0) {
                        setImageUrls(auction.images);
                    }
                } catch (error) {
                    console.error('Failed to load auction:', error);
                    toast.error('Không thể tải thông tin đấu giá');
                    navigate('/my-auctions');
                } finally {
                    setLoading(false);
                }
            };
            fetchAuction();
        }
    }, [id, isEditMode, setValue, navigate]);

    const categories = [
        { value: 'electronics', label: 'Điện tử' },
        { value: 'fashion', label: 'Thời trang' },
        { value: 'art', label: 'Nghệ thuật' },
        { value: 'collectibles', label: 'Sưu tầm' },
        { value: 'vehicles', label: 'Xe cộ' },
        { value: 'real-estate', label: 'Bất động sản' },
        { value: 'other', label: 'Khác' },
    ];

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const validImages = imageUrls.filter(url => url.trim() !== '');
            const auctionData = {
                ...data,
                startPrice: parseInt(data.startPrice),
                minBidIncrement: parseInt(data.minBidIncrement),
                startTime: new Date(data.startTime).toISOString(),
                endTime: new Date(data.endTime).toISOString(),
                images: validImages
            };

            if (isEditMode) {
                await auctionAPI.updateAuction(id, auctionData);
                // toast.success('Cập nhật đấu giá thành công! 🎉'); // Removed as notification system handles this
            } else {
                await auctionAPI.createAuction(auctionData);
                // toast.success('Tạo đấu giá thành công! 🎉'); // Removed as notification system handles this
            }
            navigate('/my-auctions', { state: { refresh: true } });
        } catch (error) {
            console.error('Auction operation failed:', error);
            toast.error(error.response?.data?.message || (isEditMode ? 'Cập nhật thất bại' : 'Tạo đấu giá thất bại'));
        } finally {
            setLoading(false);
        }
    };

    const addImageUrl = () => {
        if (imageUrls.length < 5) setImageUrls([...imageUrls, '']);
    };

    const removeImageUrl = (index) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };

    const updateImageUrl = (index, value) => {
        const newUrls = [...imageUrls];
        newUrls[index] = value;
        setImageUrls(newUrls);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-[95%] lg:max-w-[1600px] mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Quay lại
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <FileText className="w-8 h-8 opacity-90" />
                            {isEditMode ? 'Chỉnh Sửa Đấu Giá' : 'Tạo Đấu Giá Mới'}
                        </h1>
                        <p className="text-orange-100 mt-2 text-sm opacity-90">
                            {isEditMode ? 'Cập nhật thông tin chi tiết cho phiên đấu giá của bạn' : 'Điền thông tin chi tiết để bắt đầu phiên đấu giá của bạn'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                <Tag className="text-orange-500" size={20} />
                                Thông tin cơ bản
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề sản phẩm <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'} outline-none transition-all`}
                                        placeholder="Nhập tiêu đề hấp dẫn cho sản phẩm..."
                                        {...register('title', {
                                            required: 'Tiêu đề là bắt buộc',
                                            minLength: { value: 10, message: 'Tiêu đề ít nhất 10 ký tự' }
                                        })}
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.title.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục <span className="text-red-500">*</span></label>
                                        <select
                                            className={`w-full px-4 py-3 rounded-xl border ${errors.category ? 'border-red-500' : 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'} outline-none transition-all bg-white`}
                                            {...register('category', { required: 'Vui lòng chọn danh mục' })}
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.category.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
                                            {...register('condition')}
                                        >
                                            <option value="new">Mới 100%</option>
                                            <option value="like-new">Như mới</option>
                                            <option value="good">Tốt</option>
                                            <option value="fair">Khá</option>
                                            <option value="poor">Cũ</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả sản phẩm <span className="text-red-500">*</span></label>
                                    <textarea
                                        rows="5"
                                        className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-500' : 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'} outline-none transition-all`}
                                        placeholder="Mô tả chi tiết, tình trạng, xuất xứ..."
                                        {...register('description', {
                                            required: 'Mô tả là bắt buộc',
                                            minLength: { value: 20, message: 'Mô tả ít nhất 20 ký tự' }
                                        })}
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.description.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pricing & Timing */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">

                                Giá & Thời gian
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá khởi điểm (VND) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                            placeholder="0"
                                            {...register('startPrice', {
                                                required: 'Nhập giá khởi điểm',
                                                min: { value: 1000, message: 'Tối thiểu 1,000 VND' }
                                            })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₫</span>
                                    </div>
                                    {errors.startPrice && <p className="mt-1 text-sm text-red-500">{errors.startPrice.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bước giá tối thiểu (VND) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                            placeholder="10000"
                                            {...register('minBidIncrement', {
                                                required: 'Nhập bước giá',
                                                min: { value: 1000, message: 'Tối thiểu 1,000 VND' }
                                            })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₫</span>
                                    </div>
                                    {errors.minBidIncrement && <p className="mt-1 text-sm text-red-500">{errors.minBidIncrement.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian bắt đầu <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                            {...register('startTime', { required: 'Nhập thời gian bắt đầu' })}
                                        />
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                    {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian kết thúc <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                            {...register('endTime', { required: 'Nhập thời gian kết thúc' })}
                                        />
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                    {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Images */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">

                                Hình ảnh sản phẩm
                            </h3>

                            <div className="space-y-4">
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="flex items-center gap-3 animate-fadeIn">
                                        <div className="relative flex-1">
                                            <input
                                                type="url"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                                placeholder="https://example.com/image.jpg"
                                                value={url}
                                                onChange={(e) => updateImageUrl(index, e.target.value)}
                                            />
                                            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                        {imageUrls.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeImageUrl(index)}
                                                className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {imageUrls.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={addImageUrl}
                                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                                    >
                                        <PlusCircle size={18} />
                                        Thêm ảnh URL
                                    </button>
                                )}
                            </div>

                            {/* Image Preview Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                {imageUrls.map((url, idx) => url && (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group bg-gray-100">
                                        <img
                                            src={url}
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang xử lý...
                                    </span>
                                ) : (isEditMode ? 'Cập Nhật Đấu Giá' : 'Tạo Đấu Giá Ngay')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Additional CSS for animations can be inline or global */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

// Missing icon import hack
const PlusCircle = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
);

export default CreateAuctionPage;
