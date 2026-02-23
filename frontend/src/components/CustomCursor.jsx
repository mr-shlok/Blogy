import React from 'react';

const CustomCursor = React.memo(({ x, y, isVisible }) => {
    return (
        <div
            className="fixed top-0 left-0 pointer-events-none"
            style={{
                zIndex: 99999,
                transform: `translate3d(${x}px, ${y}px, 0)`,
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.15s ease-out',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                perspective: 1000,
            }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
                style={{ 
                    marginTop: '-4px', 
                    marginLeft: '-4px',
                    display: 'block'
                }}
            >
                <path
                    d="M3 3L21 12L12 15L9 21L3 3Z"
                    fill="#8B5CF6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
});

CustomCursor.displayName = 'CustomCursor';

export default CustomCursor;
