
"use client";

import React from 'react';

export function TranslationLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[hsl(var(--themed-blue))] mb-4"></div>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
        Loading Quiz...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Please wait a moment while we prepare the questions for you.
      </p>
    </div>
  );
}
