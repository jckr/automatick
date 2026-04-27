import React from 'react';

type Props = {
  label?: string;
  children: React.ReactNode;
};

export function Callout({ label, children }: Props) {
  return (
    <aside className='callout'>
      {label ? <div className='lbl'>{label}</div> : null}
      {children}
    </aside>
  );
}
