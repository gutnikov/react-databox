import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTimezones } from '../Api/useTimezones';

export function Search(props: {
  rkey: string;
  handle: string;
  search: string;
  onSearch: (s: string) => void;
}): ReactElement {
  const { handle, rkey, search, onSearch } = props;
  const { state, cancel } = useTimezones({
    options: {
      handle,
    },
  });
  const [longResponse, setLongResponse] = useState(false);

  const content = useMemo(() => {
    const { error, pending, value } = state;
    if (error) {
      return <div>{`Error: ${error}`}</div>;
    }
    if (pending) {
      return <div>Loading...</div>;
    }
    if (value) {
      return (
        <div>
          {value.data?.items.map((it) => (
            <div key={`${it.abbr}-${it.value}`} className="p-1">
              {it.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, [state]);

  return (
    <div className="p-3" style={{ minWidth: '420px', maxWidth: '560px', margin: 'auto' }}>
      <form className="sticky-top bg-light">
        <div className="p-3">
          <h3 className="mb-2">#{rkey} Search timezones</h3>
          <div className="row mb-3">
            <div className="col-9">
              <input
                // eslint-disable-next-line
                autoFocus
                type="text"
                className="form-control"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <div className="col-1">
              <button className="btn btn-primary" disabled={!cancel} onClick={cancel} type="button">
                Cancel
              </button>
            </div>
          </div>
          <div className="mb-2">
            <label htmlFor="long-response" className="form-label">
              <input
                className="form-check-input"
                name="long-response"
                type="checkbox"
                checked={longResponse}
                onChange={(e) => setLongResponse(e.target.checked)}
              />{' '}
              Emulate long response
            </label>
          </div>
        </div>
        <hr />
      </form>
      {content}
    </div>
  );
}

export function Handle(): ReactElement {
  const [rnd, setRnd] = useState('xxx');

  const [search, setSearch] = useState('');
  const { emit } = useTimezones({
    initialMessage: {
      data: {
        search: 'Ame',
      },
    },
    options: {
      handle: 'search',
    },
  });

  function handleSearch(search: string): void {
    setSearch(search);
    emit({
      data: {
        search,
      },
    });
  }

  useEffect(() => {
    const intid = setInterval(() => {
      setRnd(String(Math.random()).slice(-6));
    }, 3000);
    return () => {
      clearInterval(intid);
    };
  }, []);

  return (
    <div className="position-relative">
      <div style={{ display: 'flex' }}>
        <div style={{ height: '500px' }}>
          <Search
            key={`${rnd}-left`}
            handle="search"
            rkey={rnd}
            search={search}
            onSearch={handleSearch}
          />
        </div>
        <div style={{ height: '500px' }}>
          <Search
            key={`${rnd}-right`}
            handle="search"
            rkey={rnd}
            search={search}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </div>
  );
}
