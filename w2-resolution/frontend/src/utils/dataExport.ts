import type { ComparisonResult } from '../types'

export function exportToJSON(comparisons: ComparisonResult[]) {
  const dataStr = JSON.stringify(comparisons, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `model-mapper-tests-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importFromJSON(file: File): Promise<ComparisonResult[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Validate the data structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: expected an array')
        }

        // Basic validation that it looks like ComparisonResult[]
        const isValid = data.every(item =>
          item.id &&
          item.prompt &&
          item.timestamp &&
          Array.isArray(item.results)
        )

        if (!isValid) {
          throw new Error('Invalid data format: missing required fields')
        }

        resolve(data)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
