import { Loader2 } from 'lucide-react';

/**
 * Loading, error, and empty state wrapper.
 */
export default function LoadingState({ loading, error, empty, emptyMessage = 'No data available.', children }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <span className="text-xl">⚠</span>
        </div>
        <p className="text-sm font-medium text-red-600">Something went wrong</p>
        <p className="text-xs text-gray-500 mt-1 max-w-md text-center">{error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <span className="text-xl">📋</span>
        </div>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return children;
}
