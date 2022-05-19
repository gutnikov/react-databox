import React, { ReactElement } from 'react';
import { GetTimezones, useTimezones } from '../Api/GetTimezones';

function SearchContent(): ReactElement | null {
  const { pending, value, error } = useTimezones();
  if (error) {
    return <div>{`Error: ${error}`}</div>;
  }
  if (pending) {
    return <div>Loading...</div>;
  }
  if (value) {
    return (
      <div>
        {value.items.map((it) => (
          <div key={`${it.abbr}-${it.value}`} style={{ padding: '10px', marginBottom: '10px' }}>
            {it.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function Search(): ReactElement {
  return (
    <GetTimezones name="GetTimezones" debug>
      <SearchContent />
    </GetTimezones>
  );
}
