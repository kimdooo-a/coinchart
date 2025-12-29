// Sample React/TSX Component File
// This fixture is used for testing routing rules

import React from 'react';

interface SampleProps {
  message: string;
}

export const SampleComponent: React.FC<SampleProps> = ({ message }) => {
  // Per rules.yaml, this file should route to Interface agent
  // Action: notify_user
  // Latency: real-time

  return (
    <div>
      <h1>Sample Component</h1>
      <p>{message}</p>
    </div>
  );
};
