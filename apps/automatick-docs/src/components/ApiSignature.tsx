import React from 'react';

type Props = {
  children: React.ReactNode;
};

export function ApiSignature({ children }: Props) {
  return <pre className='api-sig'>{children}</pre>;
}
