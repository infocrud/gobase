function Code({ children, lang }: { children: string; lang?: string }) {
  return (
    <pre className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-x-auto my-4">
      <code className="text-sm text-green-400">{children}</code>
    </pre>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-[var(--border)]">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-white mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">{children}</p>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--bg-card)]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--border)]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[var(--text-secondary)]">
                  <code className="text-xs">{cell}</code>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Code, H2, H3, P, Table };
