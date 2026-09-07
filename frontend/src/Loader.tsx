import React from 'react';

const Loader: React.FC = () => {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      color: '#a1a1aa',
      fontSize: '13px',
      fontFamily: 'inherit'
    }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'clean-spin 0.8s linear infinite'
        }}
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="#27272a"
          strokeWidth="2"
        />
        <path
          d="M14 8C14 4.68629 11.3137 2 8 2"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>Processing response...</span>
      <style>{`
        @keyframes clean-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;

