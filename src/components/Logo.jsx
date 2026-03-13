import React from 'react';

const Logo = ({ className = "w-32 h-32" }) => {
    return (
        <img
            src="/evidentia-logo.png"
            alt="Evidentia Logo"
            className={`${className} object-contain`}
        />
    );
};

export default Logo;
