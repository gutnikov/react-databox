import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTimezones } from '../Api/useTimezones';

export function Basic(): ReactElement {
  const { state, emit, cancel } = useTimezones({
    initialMessage: {
      data: {
        search: 'Hawaiian',
      },
    },
    options: {
      keepPreviousRequest: true,
    },
  });
  const [search, setSearch] = useState('');
  const [longResponse, setLongResponse] = useState(false);

  useEffect(() => {
    emit({
      data: {
        search,
        delay: longResponse ? '10000' : '0',
      },
    });
  }, [search]);

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
          <h3 className="mb-2">Search timezones</h3>
          <div className="row mb-3">
            <div className="col-9">
              <input
                type="text"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

/*
  Examples:

  0. General
    - Request cancelling
    - Send multiple requests at once

  1. Request/Value hooks
    - set cookies
    - process response

  2. Request cache
    - Reuse ds while re-rendering
    - Use across multiple components

  3. DataSource composition
    - Combine data
    - Data + local timers
    - Debouncing

  4. Testing
    - How to mock datasources to test them?
    - Test example

*/
