import { useState } from 'react'
import DemandZoneForm from './components/DemandZoneForm.jsx'
import DemandZoneTable from './components/DemandZoneTable.jsx'

function App() {
  const [zones, setZones] = useState([])
  const [error, setError] = useState(null)

  const handleFormSubmit = (newZones, errorMessage) => {
    setZones(newZones || [])
    setError(errorMessage || null)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">GTF Demand Zone Finder</h1>
        <DemandZoneForm onSubmit={handleFormSubmit} />
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <DemandZoneTable zones={zones} />
      </div>
    </div>
  )
}

export default App