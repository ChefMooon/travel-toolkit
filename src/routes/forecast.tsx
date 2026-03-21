import { useQuery } from '@tanstack/react-query';

async function loadForecastSummary() {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 120));
  return {
    destination: 'Barcelona',
    outlook: 'Mild with occasional showers',
    recommendation: 'Pack a light layer and a compact umbrella.',
  };
}

export default function ForecastPage() {
  const query = useQuery({
    queryKey: ['forecast', 'summary'],
    queryFn: loadForecastSummary,
  });

  return (
    <section className="tool-page" aria-label="Destination forecast">
      <h1>Destination Forecast</h1>
      {query.isPending ? <p>Loading forecast data...</p> : null}
      {query.isError ? <p>Unable to load forecast data right now.</p> : null}
      {query.data ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Upcoming Conditions</p>
          </div>
          <div className="card-body">
            <p>{query.data.destination}</p>
            <p>{query.data.outlook}</p>
            <p>{query.data.recommendation}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
