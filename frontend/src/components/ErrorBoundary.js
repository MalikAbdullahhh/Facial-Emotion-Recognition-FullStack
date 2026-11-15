import React from 'react';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // A new deploy replaces old code-split chunks; reload once to pick up the new build.
    if (/Loading chunk|ChunkLoadError|dynamically imported module/i.test(String(error?.message || error?.name))) {
      if (!sessionStorage.getItem('fer-chunk-reload')) {
        sessionStorage.setItem('fer-chunk-reload', '1');
        window.location.reload();
      }
    }
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 420, display: 'grid', gap: 14, justifyItems: 'center' }}>
          <h1 style={{ fontSize: '1.75rem' }}>Something broke on this page</h1>
          <p className="muted">Reloading usually fixes it. If it keeps happening, let us know from the contact page.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
            <a className="btn btn-outline" href="/">Go home</a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
