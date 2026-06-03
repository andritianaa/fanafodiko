import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { faqCategories, searchFaq } from '@ext/utils'
import { Input } from '@/components/ui/input'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'

export default function HelpPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const searchResults = useMemo(() => searchFaq(query), [query])
  const isSearching = query.trim().length > 0

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:underline"
          >
            ← Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="Fanafodiko" className="w-10 h-10 rounded-xl" />
            <h1 className="text-2xl font-bold text-gray-900">Aide & FAQ</h1>
          </div>
          <p className="text-sm text-gray-400 mb-6">Trouvez rapidement une réponse à votre question.</p>

          {/* Barre de recherche */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <Input
              placeholder="Rechercher une question…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Résultats de recherche */}
          {isSearching ? (
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Aucun résultat pour «&nbsp;{query}&nbsp;». Essayez d'autres mots-clés ou{' '}
                  <a href="mailto:pro@andritiana.tech" className="text-blue-500 underline">
                    contactez-nous
                  </a>
                  .
                </p>
              ) : (
                searchResults.map((item) => (
                  <FaqItemCard key={item.id} question={item.question} answer={item.answer} />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {faqCategories.map((category) => (
                <section key={category.id}>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-100 pb-2">
                    {category.label}
                  </h2>
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <FaqItemCard key={item.id} question={item.question} answer={item.answer} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Vous n'avez pas trouvé votre réponse ?{' '}
              <a href="mailto:pro@andritiana.tech" className="text-blue-500 underline">
                Contactez-nous
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItemCard({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{question}</span>
        <span className="text-gray-400 text-lg leading-none shrink-0">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{answer}</p>
        </div>
      )}
    </div>
  )
}
