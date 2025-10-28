'use client'

export default function CopyUrlButton({ url }: { url: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    alert('URL copied to clipboard!')
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
    >
      Copy URL
    </button>
  )
}

