const Loading = () => (
  <main aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading…</span>
    <div className="h-9 w-64 animate-pulse rounded-lg bg-gray-200" />
    <div className="companions-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[280px] w-full max-w-[380px] animate-pulse rounded-4xl bg-gray-200 max-sm:max-w-[320px]"
        />
      ))}
    </div>
  </main>
);

export default Loading;
