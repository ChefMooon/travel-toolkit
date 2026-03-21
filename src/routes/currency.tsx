import { useQuery } from '@tanstack/react-query';

async function loadCurrencySnapshot() {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 120));
  return {
    base: 'USD',
    updatedAt: 'Live rate source pending integration',
    supported: ['USD', 'EUR', 'GBP', 'CAD'],
  };
}

export default function CurrencyPage() {
  const query = useQuery({
    queryKey: ['currency', 'snapshot'],
    queryFn: loadCurrencySnapshot,
  });

  return (
    <section className="tool-page" aria-label="Currency converter">
      <h1>Currency Converter</h1>
      {query.isPending ? <p>Loading currency data...</p> : null}
      {query.isError ? <p>Unable to load currency data right now.</p> : null}
      {query.data ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Rate Snapshot</p>
          </div>
          <div className="card-body">
            <p>Base currency: {query.data.base}</p>
            <p>{query.data.updatedAt}</p>
            <p>Supported: {query.data.supported.join(', ')}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
