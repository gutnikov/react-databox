import React, { ReactElement, useEffect, useState } from 'react';
import { useTimezones, Handle } from '../Api/useTimezones';

function SearchInput(props: { handle: Handle }): ReactElement | null {
  const { handle } = props;
  const [, setRequest] = useTimezones({ handle });
  const [search, setSearch] = useState('');

  useEffect(() => {
    setRequest({ search });
  }, [search]);

  return (
    <div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );
}

function SearchContent(props: { handle: Handle }): ReactElement | null {
  const { handle } = props;
  const [{ pending, value, error }] = useTimezones({ handle });
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
  useTimezones({
    debug: true,
    request: {
      search: 'Hawaiian',
    },
  });
  return (
    <div>
      Done
      {/* <SearchInput handle={handle} />
      <SearchContent handle={handle} /> */}
    </div>
  );
}
