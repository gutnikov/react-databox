import React, { ReactElement, useEffect, useState } from 'react';
import { useTimezones, Response } from '../Api/useTimezones';

function SearchInput(props: {
  search?: string;
  onSearch: (v: string) => void;
}): ReactElement | null {
  const { search: initialSearch, onSearch } = props;
  const [search, setSearch] = useState<string>(initialSearch || '');
  useEffect(() => {
    onSearch(search);
  }, [search]);

  return (
    <div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );
}

function SearchContent(props: {
  pending: boolean;
  error?: Error;
  value?: Response;
}): ReactElement | null {
  const { error, pending, value } = props;
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
  const [state, setRequest] = useTimezones({
    request: {
      search: 'Hawaiian',
    },
  });

  function handleSearch(s: string): void {
    setRequest({
      search: s,
    });
  }

  return (
    <div>
      <SearchInput search={state.request?.search} onSearch={handleSearch} />
      <SearchContent {...state} />
    </div>
  );
}
