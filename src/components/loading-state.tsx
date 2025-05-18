export function LoadingState() {
    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto">
            <div className="flex w-full justify-end">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            </div>
            <div className="space-y-8 mt-8">
                <div className="text-center space-y-4">
                    <div className="h-12 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-8 w-2/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                </div>

                {/* Simulated questions loading */}
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="space-y-4 p-6 border rounded-lg border-gray-200 dark:border-gray-800"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-8 bg-primary/30 rounded animate-pulse" />
                            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        </div>

                        {/* Simulated multiple choice options */}
                        <div className="space-y-3 pl-4 mt-4">
                            {[1, 2, 3, 4].map((j) => (
                                <div
                                    key={j}
                                    className="flex items-center space-x-3"
                                >
                                    <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Simulated progress bar */}
                <div className="relative h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]" />
                </div>
            </div>
        </div>
    );
}
