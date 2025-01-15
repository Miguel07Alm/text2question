interface SubmitProps {
  children: React.ReactNode
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  primaryColor?: 'black' | 'green-600' | 'red-600'
  foregroundColor?: 'white' | 'black'
}

export function Submit({ 
  children, 
  onClick, 
  loading, 
  disabled, 
  primaryColor = "black", 
  foregroundColor = "white" 
}: SubmitProps) {
  const getButtonClasses = () => {
    if (children === "Stop Generation") {
      return "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800";
    }

    const colorMap = {
      'black': 'bg-black hover:bg-black/90 dark:bg-black dark:hover:bg-black/90',
      'green-600': 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800',
      'red-600': 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
    };

    const textColorMap = {
      'white': 'text-white',
      'black': 'text-black'
    };

    return `${colorMap[primaryColor]} ${textColorMap[foregroundColor]}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`w-full rounded-full py-3 font-medium transition-all ${getButtonClasses()} disabled:opacity-50`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
