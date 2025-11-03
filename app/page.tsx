import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          KFactor - Viral Growth System
        </h1>
        <p className="text-center text-gray-600 mb-8">
          MVP Foundation - Phase 1 & 2 Complete
        </p>
        <div className="text-center">
          <Link
            href="/practice"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Take Practice Test
          </Link>
        </div>
      </div>
    </main>
  )
}

