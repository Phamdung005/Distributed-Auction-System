import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { auctionAPI } from '../../services/api';
import './CreateAuctionPage.css';

const CreateAuctionPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imageUrls, setImageUrls] = useState(['']);

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
            // Lọc image URLs không rỗng
            const validImages = imageUrls.filter(url => url.trim() !== '');

            const auctionData = {
                ...data,
                startPrice: parseInt(data.startPrice),
                minBidIncrement: parseInt(data.minBidIncrement),
                startTime: new Date(data.startTime).toISOString(),
                endTime: new Date(data.endTime).toISOString(),
                images: validImages
            };

            await auctionAPI.createAuction(auctionData);
            toast.success('Tạo đấu giá thành công! 🎉');
            navigate('/my-auctions');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Tạo đấu giá thất bại');
        } finally {
            setLoading(false);
        }
    };

    const addImageUrl = () => {
        if (imageUrls.length < 5) {
            setImageUrls([...imageUrls, '']);
        }
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
        <div className="create-auction-page">
            <div className="create-auction-container">
                <h1 className="page-title">📝 Tạo Đấu Giá Mới</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="create-auction-form">
                    <div className="form-row">
                        <div className="form-group full-width">
                            <label className="form-label">Tiêu đề *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nhập tiêu đề sản phẩm"
                                {...register('title', {
                                    required: 'Tiêu đề là bắt buộc',
                                    minLength: {
                                        value: 10,
                                        message: 'Tiêu đề phải có ít nhất 10 ký tự'
                                    }
                                })}
                            />
                            {errors.title && <p className="form-error">{errors.title.message}</p>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group full-width">
                            <label className="form-label">Mô tả *</label>
                            <textarea
                                className="form-textarea"
                                rows="5"
                                placeholder="Mô tả chi tiết về sản phẩm..."
                                {...register('description', {
                                    required: 'Mô tả là bắt buộc',
                                    minLength: {
                                        value: 20,
                                        message: 'Mô tả phải có ít nhất 20 ký tự'
                                    }
                                })}
                            />
                            {errors.description && <p className="form-error">{errors.description.message}</p>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Danh mục *</label>
                            <select
                                className="form-select"
                                {...register('category', { required: 'Danh mục là bắt buộc' })}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <p className="form-error">{errors.category.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Giá khởi điểm (VND) *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="1000000"
                                {...register('startPrice', {
                                    required: 'Giá khởi điểm là bắt buộc',
                                    min: {
                                        value: 1000,
                                        message: 'Giá tối thiểu 1,000 VND'
                                    }
                                })}
                            />
                            {errors.startPrice && <p className="form-error">{errors.startPrice.message}</p>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Bước giá (VND) *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="10000"
                                {...register('minBidIncrement', {
                                    required: 'Bước giá là bắt buộc',
                                    min: {
                                        value: 1000,
                                        message: 'Bước giá tối thiểu 1,000 VND'
                                    }
                                })}
                            />
                            {errors.minBidIncrement && <p className="form-error">{errors.minBidIncrement.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Điều kiện</label>
                            <select
                                className="form-select"
                                {...register('condition')}
                            >
                                <option value="new">Mới</option>
                                <option value="like-new">Như mới</option>
                                <option value="good">Tốt</option>
                                <option value="fair">Khá</option>
                                <option value="poor">Cũ</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Thời gian bắt đầu *</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                {...register('startTime', {
                                    required: 'Thời gian bắt đầu là bắt buộc'
                                })}
                            />
                            {errors.startTime && <p className="form-error">{errors.startTime.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Thời gian kết thúc *</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                {...register('endTime', {
                                    required: 'Thời gian kết thúc là bắt buộc'
                                })}
                            />
                            {errors.endTime && <p className="form-error">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label className="form-label">Hình ảnh (URL)</label>
                        {imageUrls.map((url, index) => (
                            <div key={index} className="image-url-row">
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://example.com/image.jpg"
                                    value={url}
                                    onChange={(e) => updateImageUrl(index, e.target.value)}
                                />
                                {imageUrls.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => removeImageUrl(index)}
                                    >
                                        ❌
                                    </button>
                                )}
                            </div>
                        ))}
                        {imageUrls.length < 5 && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={addImageUrl}
                            >
                                ➕ Thêm ảnh
                            </button>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={loading}
                        >
                            {loading ? 'Đang tạo...' : '✅ Tạo đấu giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAuctionPage;
