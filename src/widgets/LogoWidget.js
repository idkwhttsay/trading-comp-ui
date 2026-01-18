import React from 'react';
import './LogoWidget.css';

const LogoWidget = () => {
    const src = `${process.env.PUBLIC_URL}/logo.jpeg`;
    const alt = 'Trading Competition Logo';

    return (
        <div>
            <img src={src} alt={alt} width={200} height={200} />
        </div>
    );
};

export default LogoWidget;
