import { useQuery } from '@tanstack/react-query';

async function loadTimezoneLookup() {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 120));
  return ['Tokyo (JST)', 'London (GMT)', 'New York (EST)'];
}

export default function TimezonePage() {
  const query = useQuery({
    queryKey: ['timezone', 'lookup'],
    queryFn: loadTimezoneLookup,
  });

  return (
    <section className="tool-page" aria-label="Timezone converter">
      <h1>Timezone Converter</h1>
      {query.isPending ? <p>Loading timezone data...</p> : null}
      {query.isError ? <p>Unable to load timezone data right now.</p> : null}
      {query.data ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Popular Destinations</p>
          </div>
          <div className="card-body">
            <ul className="tool-list">
              {query.data.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
