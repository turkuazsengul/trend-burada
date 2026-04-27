import React, {useEffect, useMemo, useRef, useState} from 'react';

export const ImageLightbox = ({
    items = [],
    initialIndex = 0,
    onClose,
    getAlt,
    renderMeta,
    showMeta = true,
    labels = {}
}) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isMobileViewport, setIsMobileViewport] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
    const [panOffset, setPanOffset] = useState({x: 0, y: 0});
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        baseX: 0,
        baseY: 0,
        moved: false
    });

    const safeItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
    const activeItem = safeItems[activeIndex] || null;

    useEffect(() => {
        setActiveIndex(initialIndex);
        setZoomLevel(1);
        setPanOffset({x: 0, y: 0});
    }, [initialIndex, items]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileViewport(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize, {passive: true});
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (onClose) {
                    onClose();
                }
                return;
            }

            if (event.key === 'ArrowLeft') {
                setActiveIndex((prev) => (prev - 1 + safeItems.length) % safeItems.length);
                return;
            }

            if (event.key === 'ArrowRight') {
                setActiveIndex((prev) => (prev + 1) % safeItems.length);
            }
        };

        if (safeItems.length > 0) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, safeItems.length]);

    if (!safeItems.length || !activeItem) {
        return null;
    }

    const clampZoom = (nextValue) => Math.min(3, Math.max(1, nextValue));
    const cycleDesktopZoom = () => {
        setZoomLevel((prev) => {
            if (prev < 1.5) return 2;
            if (prev < 2.5) return 3;
            return 1;
        });
    };

    const resetPan = () => {
        setPanOffset({x: 0, y: 0});
        dragStateRef.current = {
            isDragging: false,
            startX: 0,
            startY: 0,
            baseX: 0,
            baseY: 0,
            moved: false
        };
    };

    const updateZoomLevel = (updater) => {
        setZoomLevel((prev) => {
            const nextZoom = typeof updater === 'function' ? updater(prev) : updater;
            const clamped = clampZoom(nextZoom);
            if (clamped === 1) {
                setPanOffset({x: 0, y: 0});
            }
            return clamped;
        });
    };

    const showPrev = () => {
        setActiveIndex((prev) => (prev - 1 + safeItems.length) % safeItems.length);
        setZoomLevel(1);
        resetPan();
    };
    const showNext = () => {
        setActiveIndex((prev) => (prev + 1) % safeItems.length);
        setZoomLevel(1);
        resetPan();
    };

    const handlePointerDown = (event) => {
        if (zoomLevel <= 1) {
            return;
        }

        dragStateRef.current = {
            isDragging: true,
            startX: event.clientX,
            startY: event.clientY,
            baseX: panOffset.x,
            baseY: panOffset.y,
            moved: false
        };

        if (event.currentTarget.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };

    const handlePointerMove = (event) => {
        if (!dragStateRef.current.isDragging || zoomLevel <= 1) {
            return;
        }

        const deltaX = event.clientX - dragStateRef.current.startX;
        const deltaY = event.clientY - dragStateRef.current.startY;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            dragStateRef.current.moved = true;
        }

        setPanOffset({
            x: dragStateRef.current.baseX + deltaX,
            y: dragStateRef.current.baseY + deltaY
        });
    };

    const handlePointerUp = (event) => {
        if (dragStateRef.current.isDragging && event.currentTarget.releasePointerCapture) {
            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            } catch (e) {
            }
        }

        window.setTimeout(() => {
            dragStateRef.current.isDragging = false;
        }, 0);
    };

    return (
        <div className="review-photo-modal-backdrop" onClick={onClose}>
            <div className="review-photo-modal" onClick={(event) => event.stopPropagation()}>
                <div className="review-photo-modal-head">
                    <div/>
                    <button type="button" onClick={onClose} aria-label={labels.close || ''}>
                        <i className="pi pi-times"/>
                    </button>
                </div>

                <div className="review-photo-slider">
                    <button type="button" className="review-photo-nav prev" onClick={showPrev} aria-label={labels.prev || ''}>
                        <i className="pi pi-angle-left"/>
                    </button>

                    <div
                        className={`review-photo-stage ${!isMobileViewport ? 'is-desktop-zoomable' : ''} ${zoomLevel > 1 ? 'is-zoomed is-pan-enabled' : ''} ${dragStateRef.current.isDragging ? 'is-dragging' : ''}`}
                        onClick={() => {
                            if (!isMobileViewport && !dragStateRef.current.moved) {
                                cycleDesktopZoom();
                                if (zoomLevel >= 2.5) {
                                    resetPan();
                                }
                            }
                            dragStateRef.current.moved = false;
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        <img
                            src={activeItem.photo || activeItem.src}
                            alt={getAlt ? getAlt(activeItem, activeIndex) : ''}
                            className="review-photo-active-image"
                            style={{transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`}}
                            onDoubleClick={() => {
                                if (isMobileViewport) {
                                    updateZoomLevel((prev) => (prev > 1 ? 1 : 2));
                                    if (zoomLevel > 1) {
                                        resetPan();
                                    }
                                }
                            }}
                            draggable={false}
                        />
                    </div>

                    <button type="button" className="review-photo-nav next" onClick={showNext} aria-label={labels.next || ''}>
                        <i className="pi pi-angle-right"/>
                    </button>
                </div>

                <div className="review-photo-meta">
                    <div className="review-photo-counter">
                        {activeIndex + 1} / {safeItems.length}
                    </div>
                    {showMeta && renderMeta ? renderMeta(activeItem, activeIndex) : null}
                </div>
            </div>
        </div>
    );
};
