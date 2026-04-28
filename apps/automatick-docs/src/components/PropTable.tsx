import React from 'react';

export type PropRow = {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description: React.ReactNode;
};

type Props = {
  rows: PropRow[];
};

export function PropTable({ rows }: Props) {
  return (
    <table className='proptable'>
      <thead>
        <tr>
          <th style={{ width: '24%' }}>Prop</th>
          <th style={{ width: '32%' }}>Type</th>
          <th>Default · Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>
              <span className='pname'>{r.name}</span>
              {r.required ? <span className='req'>req</span> : null}
            </td>
            <td>
              <span className='ptype'>{r.type}</span>
            </td>
            <td>
              {r.defaultValue !== undefined ? (
                <span className='pdefault'>{r.defaultValue}</span>
              ) : null}
              <div className='pdesc'>{r.description}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
