import { useState } from 'react'
import axios from 'axios'

function CoincidingZoneForm({ onSubmit }) {
  // Constants for default date range (1 year from June 20, 2025)
  const today = new Date('2025-06-20')
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  // Initial form state aligned with StockRequest model
  const [formData, setFormData] = useState({
    ticker: '',
    start_date: oneYearAgo.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
    higher_interval: '1d',
    lower_interval: '1h',
    leginMinBodyPercent: 50,
    ltf_leginMinBodyPercent: 50,
    legoutMinBodyPercent: 50,
    ltf_legoutMinBodyPercent: 50,
    baseMaxBodyPercent: 50,
    ltf_baseMaxBodyPercent: 50,
    minLegoutMovement: 7,
    ltf_minLegoutMovement: 3,
    minBaseCandles: 1,
    maxBaseCandles: 5,
    detectLowerZones: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Form field configurations aligned with StockRequest model
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
      id: 'higher_interval',
      label: 'Higher Timeframe Interval',
      type: 'select',
      options: [
        { value: '1mo', label: 'Monthly' },
        { value: '1wk', label: 'Weekly' },
        { value: '1d', label: 'Daily' },
        { value: '1h', label: 'Hourly' },
        { value: '30m', label: '30 Minutes' },
        { value: '15m', label: '15 Minutes' },
        { value: '5m', label: '5 Minutes' },
      ],
      tooltip: 'Choose the higher timeframe interval.',
    },
    {
      id: 'lower_interval',
      label: 'Lower Timeframe Interval',
      type: 'select',
      options: [
        { value: '1mo', label: 'Monthly' },
        { value: '1wk', label: 'Weekly' },
        { value: '1d', label: 'Daily' },
        { value: '1h', label: 'Hourly' },
        { value: '30m', label: '30 Minutes' },
        { value: '15m', label: '15 Minutes' },
        { value: '5m', label: '5 Minutes' },
      ],
      tooltip: 'Choose the lower timeframe interval for nested zone scan.',
    },
    {
      id: 'leginMinBodyPercent',
      label: 'Higher TF Leg-in Min Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Minimum body size (% of range) for higher timeframe leg-in candle.',
    },
    {
      id: 'ltf_leginMinBodyPercent',
      label: 'Lower TF Leg-in Min Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Minimum body size (% of range) for lower timeframe leg-in candle.',
    },
    {
      id: 'legoutMinBodyPercent',
      label: 'Higher TF Leg-out Min Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Minimum body size (% of range) for higher timeframe leg-out candle.',
    },
    {
      id: 'ltf_legoutMinBodyPercent',
      label: 'Lower TF Leg-out Min Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Minimum body size (% of range) for lower timeframe leg-out candle.',
    },
    {
      id: 'baseMaxBodyPercent',
      label: 'Higher TF Base Max Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Maximum body size (% of range) for higher timeframe base candles.',
    },
    {
      id: 'ltf_baseMaxBodyPercent',
      label: 'Lower TF Base Max Body %',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      tooltip: 'Maximum body size (% of range) for lower timeframe base candles.',
    },
    {
      id: 'minLegoutMovement',
      label: 'Higher TF Min Leg-out Movement %',
      type: 'number',
      min: 0,
      step: 1,
      tooltip: 'Minimum movement (% from previous close) for higher timeframe leg-out candle.',
    },
    {
      id: 'ltf_minLegoutMovement',
      label: 'Lower TF Min Leg-out Movement %',
      type: 'number',
      min: 0,
      step: 1,
      tooltip: 'Minimum movement (% from previous close) for lower timeframe leg-out candle.',
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
    {
      id: 'detectLowerZones',
      label: 'Detect Lower Timeframe Zones',
      type: 'checkbox',
      tooltip: 'Check to enable detection of zones in the lower timeframe.',
    },
  ]

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    // Clear error for the field when user starts typing
    setErrors({ ...errors, [name]: '' })
  }

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {}
    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker is required'
    }
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
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
      ltf_leginMinBodyPercent: parseInt(formData.ltf_leginMinBodyPercent, 10),
      legoutMinBodyPercent: parseInt(formData.legoutMinBodyPercent, 10),
      ltf_legoutMinBodyPercent: parseInt(formData.ltf_legoutMinBodyPercent, 10),
      baseMaxBodyPercent: parseInt(formData.baseMaxBodyPercent, 10),
      ltf_baseMaxBodyPercent: parseInt(formData.ltf_baseMaxBodyPercent, 10),
      minLegoutMovement: parseInt(formData.minLegoutMovement, 10),
      ltf_minLegoutMovement: parseInt(formData.ltf_minLegoutMovement, 10),
      minBaseCandles: parseInt(formData.minBaseCandles, 10),
      maxBaseCandles: parseInt(formData.maxBaseCandles, 10),
      detectLowerZones: formData.detectLowerZones,
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
            ) : field.type === 'checkbox' ? (
              <input
                type="checkbox"
                id={field.id}
                name={field.id}
                checked={formData[field.id]}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                disabled={isLoading}
              />
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

export default CoincidingZoneForm