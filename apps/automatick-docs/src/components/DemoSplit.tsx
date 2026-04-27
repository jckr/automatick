import React from 'react';

type Props = {
  /** The simulation rendering — fills the left column on wide viewports. */
  preview: React.ReactNode;
  /** The control panel — fills the 320px right column on wide viewports.
   *  Below ~1500px, the panel drops below the sim and lays its groups out
   *  horizontally. */
  controls: React.ReactNode;
};

export function DemoSplit({ preview, controls }: Props) {
  return (
    <div className='pg-split'>
      <div className='pg-sim'>{preview}</div>
      {controls}
    </div>
  );
}
