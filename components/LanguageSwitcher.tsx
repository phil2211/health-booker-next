'use client'

export default function LanguageSwitcher() {
  const switchLocale = (locale: 'en' | 'de') => {
    // Get the current pathname without locale prefix
    const currentPath = window.location.pathname
    const pathWithoutLocale = currentPath.replace(/^\/(en|de)/, '') || '/'
    window.location.href = `/${locale}${pathWithoutLocale}`
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLocale('en')}
        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('de')}
        className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        DE
      </button>
    </div>
  )
}
