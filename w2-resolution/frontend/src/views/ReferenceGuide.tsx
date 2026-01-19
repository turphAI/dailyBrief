import { BookOpen, Info } from 'lucide-react'

export default function ReferenceGuide() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reference Guide</h2>
        <p className="text-gray-600">Your personal AI model decision framework</p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Data Yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start testing models in the Testing Lab to build your reference guide.
          Your insights will automatically populate here.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Coming Soon
              </p>
              <p className="text-sm text-blue-700">
                The Reference Guide will show model recommendations by use case,
                priority, and detailed model profiles based on your testing data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
