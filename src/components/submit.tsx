interface SubmitProps {
  children: React.ReactNode
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export function Submit({ children, onClick, loading, disabled }: SubmitProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`w-full rounded-full py-3 font-medium transition-all ${
        children === 'Stop Generation'
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
      } disabled:opacity-50`}
    >
      {loading ? 'Generating...' : children}
    </button>
  )
}
