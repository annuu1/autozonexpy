import { useState } from 'react'
import axios from 'axios'

function DemandZoneForm({ onSubmit }) {
  // Constants for default date range (1 year from June 20, 2025)
  const today = new Date('2025-06-20')
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  // Initial form state
  const [formData, setFormData] = useState({
    ticker: '',
    start_date: oneYearAgo.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
    interval: '1d',
    leginMinBodyPercent: 50,
    legoutMinBodyPercent: 50,
    baseMaxBodyPercent: 47,
    minBaseCandles: 1,
    maxBaseCandles: 5,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Form field configurations for reusability
  const formFields = [
    {
      id: 'ticker',
      label: 'Ticker',
      type: 'text',
      placeholder: 'e.g., RELIANCE',
      required: true,
      tooltip: 'Enter an Indian stock ticker (e.g., RELIANCE). .NS will be added automatically.',
    },
    {
      id: 'start_date',
      label: 'Start Date',
      type: 'date',
      tooltip: 'Select the start date for historical data.',
    },
    {
      id: 'end_date',
      label: 'End Date',
      type: 'date',
      tooltip: 'Select the end date for historical data.',
    },
    {
      id: 'interval',
      label: 'Interval',
      type: 'select',
      options: [
        { value: '1d', label: 'Daily' },
        { value: '1h', label: 'Hourly' },
        { value: '1wk', label: 'Weekly' },
      ],
      tooltip: 'Choose the time interval for candlestick data.',
    },
    {
      id: 'leginMinBodyPercent',
      label: 'Leg-in Candle Body Min %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Minimum body size (% of range) for the leg-in candle.',
    },
    {
      id: 'legoutMinBodyPercent',
      label: 'Leg-out Candle Body Min %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Minimum body size (% of range) for the leg-out candle.',
    },
    {
      id: 'baseMaxBodyPercent',
      label: 'Base Candle Maximum Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Maximum body size (% of range) for base candles.',
    },
    {
      id: 'minBaseCandles',
      label: 'Min Number of Base Candles',
      type: 'number',
      min: 1,
      step: 1,
      tooltip: 'Minimum number of base candles in the demand zone.',
    },
    {
      id: 'maxBaseCandles',
      label: 'Max Number of Base Candles',
      type: 'number',
      min: 1,
      step: 1,
      tooltip: 'Maximum number of base candles in the demand zone.',
    },
  ]

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error for the field when user starts typing
    setErrors({ ...errors, [name]: '' })
  }

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {}
    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker is required'
    }
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date'
    }
    if (formData.minBaseCandles > formData.maxBaseCandles) {
      newErrors.maxBaseCandles = 'Max base candles must be greater than or equal to min base candles'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    // Normalize ticker: uppercase and append .NS if not present
    const normalizedTicker = formData.ticker.toUpperCase().endsWith('.NS')
      ? formData.ticker.toUpperCase()
      : `${formData.ticker.toUpperCase()}.NS`

    const payload = {
      ...formData,
      ticker: normalizedTicker,
      leginMinBodyPercent: parseInt(formData.leginMinBodyPercent, 10),
      legoutMinBodyPercent: parseInt(formData.legoutMinBodyPercent, 10),
      baseMaxBodyPercent: parseInt(formData.baseMaxBodyPercent, 10),
      minBaseCandles: parseInt(formData.minBaseCandles, 10),
      maxBaseCandles: parseInt(formData.maxBaseCandles, 10),
    }

    try {
      const response = await axios.post('/demand-zones', payload)
      onSubmit(response.data, null)
    } catch (error) {
      onSubmit(null, error.response?.data?.detail || 'An error occurred while fetching demand zones')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formFields.map((field) => (
          <div key={field.id} className="relative">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.tooltip && (
                <span className="ml-1 text-gray-500 cursor-help" title={field.tooltip}>
                  ⓘ
                </span>
              )}
            </label>
            {field.type === 'select' ? (
              <select
                id={field.id}
                name={field.id}
                value={formData[field.id]}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                id={field.id}
                name={field.id}
                value={formData[field.id]}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                className={`mt-1 block w-full p-2 border ${
                  errors[field.id] ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`}
                disabled={isLoading}
              />
            )}
            {errors[field.id] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
            Loading...
          </span>
        ) : (
          'Find Demand Zones'
        )}
      </button>
    </form>
  )
}

export default DemandZoneForm