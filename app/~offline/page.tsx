export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-9xl font-black">Offline</h1>
      <p className="mt-4 text-muted-foreground">
        You&apos;re offline. Check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-full bg-foreground px-4 py-2 text-background"
      >
        Try again
      </button>
    </div>
  )
}
