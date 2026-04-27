import {useEffect, useState} from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

const getViewportWidth = () => {
    if (typeof window === 'undefined') {
        return 1440;
    }

    return window.innerWidth || document.documentElement.clientWidth || 1440;
};

export const useResponsiveMode = () => {
    const [viewportWidth, setViewportWidth] = useState(getViewportWidth);

    useEffect(() => {
        const handleResize = () => setViewportWidth(getViewportWidth());
        window.addEventListener('resize', handleResize, {passive: true});
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        viewportWidth,
        isMobile: viewportWidth <= MOBILE_BREAKPOINT,
        isTablet: viewportWidth > MOBILE_BREAKPOINT && viewportWidth <= TABLET_BREAKPOINT
    };
};

export default useResponsiveMode;
