import React, {useContext, useState} from 'react';
import {Rating} from 'primereact/rating';
import AppContext from "../../AppContext";
import {ImageLightbox} from "./ImageLightbox";

export const ProductFeedbackPanel = ({
    product,
    mode,
    reviews,
    questionAnswers,
    onModeChange
}) => {
    const {t = (key) => key} = useContext(AppContext) || {};
    const isReviewMode = mode === 'reviews';
    const [activePhotoModal, setActivePhotoModal] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const reviewPhotoItems = (reviews || []).flatMap((review) => (
        Array.isArray(review.photos)
            ? review.photos.map((photo, index) => ({
                id: `${review.id}-${index}`,
                photo,
                user: review.user,
                rating: review.rating,
                text: review.text,
                date: review.date
            }))
            : []
    ));

    const openPhotoModal = (review, photoIndex = 0) => {
        const targetPhoto = review?.photos?.[photoIndex];
        const nextIndex = reviewPhotoItems.findIndex((item) => item.photo === targetPhoto && item.user === review.user);
        setActivePhotoModal({items: reviewPhotoItems});
        setActivePhotoIndex(nextIndex >= 0 ? nextIndex : 0);
    };

    const closePhotoModal = () => {
        setActivePhotoModal(null);
        setActivePhotoIndex(0);
    };

    return (
        <>
            <div className="product-feedback-layout">
                <aside className="product-feedback-media">
                    <img src={product?.img} alt={product?.title || t('feedback.productImageAlt')}/>
                    <div className="product-feedback-media-meta">
                        <strong>{product?.mark}</strong>
                        <span>{product?.title}</span>
                    </div>
                </aside>

                <div className="product-feedback-content">
                    <div className="product-feedback-topbar">
                        <button
                            type="button"
                            className={`product-feedback-tab ${isReviewMode ? 'is-active' : ''}`}
                            onClick={() => onModeChange('reviews')}
                        >
                            {t('feedback.reviews')} ({reviews.length})
                        </button>
                        <button
                            type="button"
                            className={`product-feedback-tab ${!isReviewMode ? 'is-active' : ''}`}
                            onClick={() => onModeChange('qa')}
                        >
                            {t('feedback.qa')} ({questionAnswers.length})
                        </button>
                    </div>

                    {isReviewMode && (
                        <div className="product-feedback-list is-review-scroll">
                            {reviews.map((review) => (
                                <article key={review.id} className="product-feedback-item">
                                    <div className="product-feedback-item-head">
                                        <strong>{review.user}</strong>
                                        <span>{review.date}</span>
                                    </div>
                                    <Rating value={review.rating} readOnly cancel={false}/>
                                    <p>{review.text}</p>

                                    {Array.isArray(review.photos) && review.photos.length > 0 && (
                                        <button
                                            type="button"
                                            className="review-photo-preview"
                                            onClick={() => openPhotoModal(review, 0)}
                                        >
                                            <img src={review.photos[0]} alt={t('feedback.reviewPhotoAlt', {user: review.user})}/>
                                        </button>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}

                    {!isReviewMode && (
                        <div className="product-feedback-list">
                            {questionAnswers.map((qa) => (
                                <article key={qa.id} className="product-feedback-item qa-item">
                                    <div className="qa-row">
                                        <span className="qa-badge question">{t('feedback.question')}</span>
                                        <p>{qa.question}</p>
                                    </div>
                                    <div className="qa-row">
                                        <span className="qa-badge answer">{t('feedback.answer')}</span>
                                        <p>{qa.answer}</p>
                                    </div>
                                    <div className="product-feedback-item-foot">{qa.date}</div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {activePhotoModal && (
                <ImageLightbox
                    items={activePhotoModal.items}
                    initialIndex={activePhotoIndex}
                    onClose={closePhotoModal}
                    getAlt={() => t('feedback.reviewPhotoPlainAlt')}
                    labels={{
                        prev: t('common.previousSlide'),
                        next: t('common.nextSlide'),
                        close: t('common.close'),
                        zoomIn: t('feedback.zoomIn'),
                        zoomOut: t('feedback.zoomOut'),
                        resetZoom: t('feedback.resetZoom')
                    }}
                    renderMeta={(item) => (
                        <div className="review-photo-review-card">
                            <div className="review-photo-review-head">
                                <strong>{item.user}</strong>
                                <span>{item.date}</span>
                            </div>
                            <Rating value={item.rating} readOnly cancel={false}/>
                            <p>{item.text}</p>
                        </div>
                    )}
                />
            )}
        </>
    );
};
