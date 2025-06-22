import { useState } from 'react'
import axios from 'axios'

function MultiDemandZoneForm({ onZonesFetched }) {
  const today = new Date('2025-06-20')
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const [formData, setFormData] = useState({
    start_date: oneYearAgo.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
    higher_interval: '1d',
    lower_interval: '1h',
    leginMinBodyPercent: 50,
    legoutMinBodyPercent: 50,
    baseMaxBodyPercent: 47,
    minBaseCandles: 1,
    maxBaseCandles: 5,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const formFields = [
    { id: 'start_date', label: 'Start Date', type: 'date' },
    { id: 'end_date', label: 'End Date', type: 'date' },
    {
      id: 'higher_interval',
      label: 'Higher Timeframe',
      type: 'select',
      options: ['1mo', '1wk', '1d', '1h', '30m', '15m', '5m'],
    },
    {
      id: 'lower_interval',
      label: 'Lower Timeframe',
      type: 'select',
      options: ['1mo', '1wk', '1d', '1h', '30m', '15m', '5m'],
    },
    { id: 'leginMinBodyPercent', label: 'Leg-in Min %', type: 'number', min: 0, max: 100 },
    { id: 'legoutMinBodyPercent', label: 'Leg-out Min %', type: 'number', min: 0, max: 100 },
    { id: 'baseMaxBodyPercent', label: 'Base Max %', type: 'number', min: 0, max: 100 },
    { id: 'minBaseCandles', label: 'Min Base Candles', type: 'number', min: 1 },
    { id: 'maxBaseCandles', label: 'Max Base Candles', type: 'number', min: 1 },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setErrors({ ...errors, [name]: '' })
  }

  const validateForm = () => {
    const newErrors = {}
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date'
    }
    if (formData.minBaseCandles > formData.maxBaseCandles) {
      newErrors.maxBaseCandles = 'Max base candles must be greater than or equal to min base candles'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        leginMinBodyPercent: parseInt(formData.leginMinBodyPercent, 10),
        legoutMinBodyPercent: parseInt(formData.legoutMinBodyPercent, 10),
        baseMaxBodyPercent: parseInt(formData.baseMaxBodyPercent, 10),
        minBaseCandles: parseInt(formData.minBaseCandles, 10),
        maxBaseCandles: parseInt(formData.maxBaseCandles, 10),
      }
      await axios.post('http://127.0.0.1:8000/multi-demand-zones', payload)
      onZonesFetched(response.data)
    } catch (error) {
      console.error(error)
      onZonesFetched({})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            {field.type === 'select' ? (
              <select
                name={field.id}
                value={formData[field.id]}
                onChange={handleChange}
                disabled={isLoading}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.id}
                value={formData[field.id]}
                onChange={handleChange}
                min={field.min}
                max={field.max}
                step={field.step}
                disabled={isLoading}
                className={`mt-1 block w-full p-2 border ${
                  errors[field.id] ? 'border-red-500' : 'border-gray-300'
                } rounded-md`}
              />
            )}
            {errors[field.id] && <p className="text-sm text-red-600 mt-1">{errors[field.id]}</p>}
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Find Demand Zones for All Tickers'}
      </button>
    </form>
  )
}

export default MultiDemandZoneForm
