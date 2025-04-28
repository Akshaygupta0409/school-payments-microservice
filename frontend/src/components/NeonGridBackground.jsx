import React from 'react';

const NeonGridBackground = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-dark-bg"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(42, 42, 42, 0.7) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(42, 42, 42, 0.7) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px', // Slightly larger grid size
      }}
    >
      {/* Optional radial gradient for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-dark-bg/40"></div>
    </div>
  );
};

export default NeonGridBackground;
