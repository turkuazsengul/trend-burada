import React, {useEffect, useRef, useState} from 'react';

const FEEDBACK_DURATION = 420;

export const ProductCardCartCta = ({
    quantity = 0,
    disabled = false,
    language = 'tr',
    onAdd,
    onIncrease,
    onDecrease
}) => {
    const [uiState, setUiState] = useState(quantity > 0 ? 'in-cart' : 'idle');
    const feedbackTimerRef = useRef(null);

    useEffect(() => {
        if (quantity <= 0) {
            setUiState('idle');
            return;
        }

        setUiState((prev) => (prev === 'added-feedback' ? prev : 'in-cart'));
    }, [quantity]);

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current) {
                window.clearTimeout(feedbackTimerRef.current);
            }
        };
    }, []);

    const centerLabel = language === 'en' ? `${quantity} Item` : `${quantity} Adet`;

    const runFeedback = () => {
        setUiState('added-feedback');
        if (feedbackTimerRef.current) {
            window.clearTimeout(feedbackTimerRef.current);
        }
        feedbackTimerRef.current = window.setTimeout(() => {
            setUiState('in-cart');
        }, FEEDBACK_DURATION);
    };

    const handleAdd = async (event) => {
        if (disabled || !onAdd) {
            return;
        }

        await onAdd(event);
        runFeedback();
    };

    const handleIncrease = async (event) => {
        if (disabled || !onIncrease) {
            return;
        }

        await onIncrease(event);
        setUiState('in-cart');
    };

    const handleDecrease = async (event) => {
        if (disabled || !onDecrease) {
            return;
        }

        await onDecrease(event);
    };

    return (
        <div className={`product-card-cart-cta is-${uiState} ${disabled ? 'is-disabled' : ''}`} data-state={uiState}>
            <div className="product-card-cart-cta-track">
                <div className="product-card-cart-cta-shell" aria-live="polite">
                    <button
                        type="button"
                        className="product-card-cart-cta-step-btn"
                        onClick={handleDecrease}
                        disabled={disabled || uiState !== 'in-cart'}
                        aria-label={language === 'en' ? 'Decrease quantity' : 'Adedi azalt'}
                    >
                        −
                    </button>

                    <div className="product-card-cart-cta-center">
                        <button
                            type="button"
                            className="product-card-cart-cta-main"
                            onClick={handleAdd}
                            disabled={disabled || uiState === 'in-cart'}
                            aria-label={language === 'en' ? 'Add to cart' : 'Sepete ekle'}
                        >
                            <i className="pi pi-shopping-cart" aria-hidden="true"/>
                            <span>{language === 'en' ? 'Add to Cart' : 'Sepete Ekle'}</span>
                        </button>

                        <div className="product-card-cart-cta-feedback">
                            <span className="product-card-cart-cta-feedback-icon" aria-hidden="true">✓</span>
                            <span>{language === 'en' ? 'Added to Cart' : 'Sepete Eklendi'}</span>
                        </div>

                        <div className="product-card-cart-cta-stepper" aria-label={language === 'en' ? 'Cart quantity control' : 'Sepet adet kontrolü'}>
                            <span>{centerLabel}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="product-card-cart-cta-step-btn"
                        onClick={handleIncrease}
                        disabled={disabled || uiState !== 'in-cart'}
                        aria-label={language === 'en' ? 'Increase quantity' : 'Adedi artır'}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};
