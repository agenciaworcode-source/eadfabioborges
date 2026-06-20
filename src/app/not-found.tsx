import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-2xl font-semibold text-gray-800">404 — Página não encontrada</h2>
      <p className="text-sm text-gray-500">A página que você procura não existe ou foi removida.</p>
      <Link
        href="/"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
