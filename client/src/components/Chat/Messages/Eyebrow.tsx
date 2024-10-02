import React from 'react';

interface EyebrowProps {
  model?: string;
}

const Eyebrow: React.FC<EyebrowProps> = ({ model }) => {
  return (
    <div className="text-xs text-token-text-secondary mb-2">
      Model: {model || 'Unknown'}
    </div>
  );
};

export default Eyebrow;