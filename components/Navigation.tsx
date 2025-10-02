
import React, { useState, useEffect } from 'react';
import BottomNavBar, { BottomNavBarProps } from './BottomNavBar';
import QuickNavButton from './QuickNavButton';

// A simple hook to check for screen size
const useIsMobile = (breakpoint = 640) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

const Navigation: React.FC<BottomNavBarProps> = (props) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        if (props.isFormView) {
            return null;
        }
        return <BottomNavBar {...props} />;
    }

    return <QuickNavButton {...props} />;
};

export default Navigation;
