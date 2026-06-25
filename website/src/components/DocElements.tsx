function Code({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '16px 20px',
      overflowX: 'auto',
      margin: '16px 0',
      lineHeight: 1.65,
    }}>
      <code style={{ fontSize: '13px', color: '#1e293b', fontFamily: "'JetBrains Mono', monospace" }}>
        {children}
      </code>
    </pre>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '20px',
      fontWeight: 700,
      color: '#0f172a',
      marginTop: '40px',
      marginBottom: '14px',
      paddingBottom: '10px',
      borderBottom: '1px solid #e2e8f0',
    }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '16px',
      fontWeight: 600,
      color: '#0f172a',
      marginTop: '28px',
      marginBottom: '10px',
    }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: '#475569',
      marginBottom: '16px',
      lineHeight: 1.75,
      fontSize: '15px',
    }}>
      {children}
    </p>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', margin: '16px 0', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', fontSize: '13.5px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 16px', color: '#334155' }}>
                  <code style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: '#1e293b' }}>
                    {cell}
                  </code>
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
