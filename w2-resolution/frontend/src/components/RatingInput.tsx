import { Star } from 'lucide-react'

interface RatingInputProps {
  label: string
  value?: number
  onChange: (value: number) => void
  max?: number
}

export default function RatingInput({ label, value = 0, onChange, max = 5 }: RatingInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-600 w-16">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="focus:outline-none transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                rating <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
