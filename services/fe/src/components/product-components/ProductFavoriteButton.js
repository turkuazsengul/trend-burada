import React, {useEffect, useRef, useState} from 'react';

const FAVORITE_BOUNCE_DURATION = 220;

export const ProductFavoriteButton = ({
    isFavorited = false,
    onToggleFavorite,
    ariaLabel,
    className = ''
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                window.clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    const handleToggle = (event) => {
        setIsAnimating(false);

        window.requestAnimationFrame(() => {
            setIsAnimating(true);
            if (animationTimeoutRef.current) {
                window.clearTimeout(animationTimeoutRef.current);
            }
            animationTimeoutRef.current = window.setTimeout(() => {
                setIsAnimating(false);
            }, FAVORITE_BOUNCE_DURATION);
        });

        if (onToggleFavorite) {
            onToggleFavorite(event);
        }
    };

    return (
        <button
            type="button"
            className={`product-favorite-toggle ${isFavorited ? 'is-active' : ''} ${isAnimating ? 'is-bouncing' : ''} ${className}`.trim()}
            onClick={handleToggle}
            aria-label={ariaLabel}
            aria-pressed={isFavorited}
        >
            <span className="product-favorite-toggle-glow" aria-hidden="true"/>
            <span className="product-favorite-toggle-ring" aria-hidden="true"/>
            <span className="product-favorite-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="product-favorite-icon-svg">
                    <path
                        d="M12 20.6 4.95 13.8a4.72 4.72 0 0 1 0-6.86 5.1 5.1 0 0 1 7.05 0L12 7.87l.01-.93a5.1 5.1 0 0 1 7.04 0 4.72 4.72 0 0 1 0 6.86L12 20.6Z"
                        className="product-favorite-icon-path"
                    />
                </svg>
            </span>
        </button>
    );
};
