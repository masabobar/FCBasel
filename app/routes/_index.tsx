export function meta() {
  return [{ title: "FC Basel Intelligence Platform" }];
}

/**
 * Placeholder shell. The real dashboard is built from Phase 2a onwards; this
 * route exists so the SSR scaffold has something to render and deploy.
 */
export default function Index() {
  return (
    <main>
      <h1>FC Basel Intelligence Platform</h1>
      <p>Prototype scaffold.</p>
    </main>
  );
}
