'use client'

export default function Loading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-blue-200">
            <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 rounded-t-xl">
              <div className="h-5 w-40 bg-blue-100 rounded animate-pulse"></div>
            </div>
            <div className="p-6 space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-full bg-blue-200 rounded animate-pulse"></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-green-200">
            <div className="px-6 py-4 border-b border-green-100 bg-green-50 rounded-t-xl">
              <div className="h-5 w-40 bg-green-100 rounded animate-pulse"></div>
            </div>
            <div className="p-6 space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-full bg-green-200 rounded animate-pulse"></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-64 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

