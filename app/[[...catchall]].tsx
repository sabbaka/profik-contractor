import React from 'react';
import Index from './index';

export default function CatchAll() {
  // Render the same entry (React Navigation stack) for any unmatched route so web refresh works
  return <Index />;
}
