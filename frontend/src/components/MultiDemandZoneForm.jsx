import { useState } from "react";
import axios from "axios";

function MultiDemandZoneForm({ onZonesFetched }) {
  // Constants for default date range (1 year from June 20, 2025)
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // Initial form state aligned with StockRequest model (excluding ticker)
  const [formData, setFormData] = useState({
    start_date: oneYearAgo.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
    higher_interval: "1wk",
    lower_interval: "1d",
    leginMinBodyPercent: 50,
    ltf_leginMinBodyPercent: 50,
    legoutMinBodyPercent: 50,
    ltf_legoutMinBodyPercent: 50,
    baseMaxBodyPercent: 50,
    ltf_baseMaxBodyPercent: 50,
    minLeginMovement: 3,
    ltf_minLeginMovement: 1,
    minLegoutMovement: 5,
    ltf_minLegoutMovement: 3,
    minBaseCandles: 1,
    maxBaseCandles: 5,
    detectLowerZones: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form field configurations aligned with StockRequest model (excluding ticker)
  const formFields = [
    // Common Parameters
    {
      section: "Common Parameters",
      id: "start_date",
      label: "Start Date",
      type: "date",
      tooltip: "Select the start date for historical data.",
    },
    {
      section: "Common Parameters",
      id: "end_date",
      label: "End Date",
      type: "date",
      tooltip: "Select the end date for historical data.",
    },
    // Higher Timeframe Settings
    {
      section: "Higher Timeframe Settings",
      id: "higher_interval",
      label: "Higher Timeframe Interval",
      type: "select",
      options: [
        { value: "3mo", label: "Quaterly" },
        { value: "1mo", label: "Monthly" },
        { value: "1wk", label: "Weekly" },
        { value: "1d", label: "Daily" },
        { value: "1h", label: "Hourly" },
        { value: "30m", label: "30 Minutes" },
        { value: "15m", label: "15 Minutes" },
        { value: "5m", label: "5 Minutes" },
      ],
      tooltip: "Choose the higher timeframe interval.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "leginMinBodyPercent",
      label: "Leg-in Min Body %",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      tooltip: "Minimum body size (% of range) for higher timeframe leg-in candle.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "legoutMinBodyPercent",
      label: "Leg-out Min Body %",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      tooltip: "Minimum body size (% of range) for higher timeframe leg-out candle.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "baseMaxBodyPercent",
      label: "Base Max Body %",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      tooltip: "Maximum body size (% of range) for higher timeframe base candles.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "minLeginMovement",
      label: "Min Leg-in Movement %",
      type: "number",
      min: 0,
      step: 1,
      tooltip: "Minimum movement (% from previous close) for higher timeframe leg-in candle.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "minLegoutMovement",
      label: "Min Leg-out Movement %",
      type: "number",
      min: 0,
      step: 1,
      tooltip: "Minimum movement (% from previous close) for higher timeframe leg-out candle.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "minBaseCandles",
      label: "Min Number of Base Candles",
      type: "number",
      min: 1,
      step: 1,
      tooltip: "Minimum number of base candles in the demand zone.",
    },
    {
      section: "Higher Timeframe Settings",
      id: "maxBaseCandles",
      label: "Max Number of Base Candles",
      type: "number",
      min: 1,
      step: 1,
      tooltip: "Maximum number of base candles in the demand zone.",
    },
    // Lower Timeframe Settings
    {
      section: "Lower Timeframe Settings",
      id: "lower_interval",
      label: "Lower Timeframe Interval",
      type: "select",
      options: [
        { value: "3mo", label: "Quarterly" },
        { value: "1mo", label: "Monthly" },
        { value: "1wk", label: "Weekly" },
        { value: "1d", label: "Daily" },
        { value: "1h", label: "Hourly" },
        { value: "30m", label: "30 Minutes" },
        { value: "15m", label: "15 Minutes" },
        { value: "5m", label: "5 Minutes" },
      ],
      tooltip: "Choose the lower timeframe interval for nested zone scan.",
    },
    {
      section: "Lower Timeframe Settings",
      id: "ltf_leginMinBodyPercent",
      label: "Leg-in Min Body %",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      tooltip: "Minimum body size (% of range) for lower timeframe leg-in candle.",
    },
    {
      section: "Lower Timeframe Settings",
      id: "ltf_legoutMinBodyPercent",
      label: "Leg-out Min Body %",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      tooltip: "Minimum body size (% of range) for lower timeframe leg-out candle.",
    },
    {
      section: "Lower Timeframe Settings",
      id: "ltf_baseMaxBodyPercent",
      label: "Base Max Body %",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      tooltip: "Maximum body size (% of range) for lower timeframe base candles.",
    },
    {
      section: "Lower Timeframe Settings",
      id: "ltf_minLeginMovement",
      label: "Min Leg-in Movement %",
      type: "number",
      min: 0,
      step: 0.1,
      tooltip: "Minimum movement (% from previous close) for lower timeframe leg-in candle.",
    },
    {
      section: "Lower Timeframe Settings",
      id: "ltf_minLegoutMovement",
      label: "Min Leg-out Movement %",
      type: "number",
      min: 0,
      step: 0.1,
      tooltip: "Minimum movement (% from previous close) for lower timeframe leg-out candle.",
    },
    {
      section: "Lower Timeframe Settings",
      id: "detectLowerZones",
      label: "Detect Lower Timeframe Zones",
      type: "checkbox",
      tooltip: "Check to enable detection of zones in the lower timeframe.",
    },
  ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = "End date must be after start date";
    }
    if (formData.minBaseCandles > formData.maxBaseCandles) {
      newErrors.maxBaseCandles = "Max base candles must be greater than or equal to min base candles";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        leginMinBodyPercent: parseInt(formData.leginMinBodyPercent, 10),
        ltf_leginMinBodyPercent: parseInt(formData.ltf_leginMinBodyPercent, 10),
        legoutMinBodyPercent: parseInt(formData.legoutMinBodyPercent, 10),
        ltf_legoutMinBodyPercent: parseInt(formData.ltf_legoutMinBodyPercent, 10),
        baseMaxBodyPercent: parseInt(formData.baseMaxBodyPercent, 10),
        ltf_baseMaxBodyPercent: parseInt(formData.ltf_baseMaxBodyPercent, 10),
        minLeginMovement: parseInt(formData.minLeginMovement, 10),
        ltf_minLeginMovement: parseInt(formData.ltf_minLeginMovement, 10),
        minLegoutMovement: parseInt(formData.minLegoutMovement, 10),
        ltf_minLegoutMovement: parseInt(formData.ltf_minLegoutMovement, 10),
        minBaseCandles: parseInt(formData.minBaseCandles, 10),
        maxBaseCandles: parseInt(formData.maxBaseCandles, 10),
        detectLowerZones: formData.detectLowerZones,
      };
      
      const response = await axios.post("http://127.0.0.1:8000/multi-demand-zones", payload);
      const rawZonesByTicker = response.data;
      
      // Pass both zones and settings to the parent
      onZonesFetched(rawZonesByTicker, payload, null);
    } catch (error) {
      onZonesFetched(null, null, error.response?.data?.detail || "An error occurred while fetching demand zones");
    } finally {
      setIsLoading(false);
    }
  };

  // Group fields by section
  const sections = [
    { title: "Common Parameters", fields: formFields.filter((field) => field.section === "Common Parameters") },
    { title: "Higher Timeframe Settings", fields: formFields.filter((field) => field.section === "Higher Timeframe Settings") },
    { title: "Lower Timeframe Settings", fields: formFields.filter((field) => field.section === "Lower Timeframe Settings") },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Multi-Ticker Demand Zone Scanner</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{section.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.id} className="relative">
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.tooltip && (
                      <span className="ml-1 text-gray-500 cursor-help" title={field.tooltip}>
                        ⓘ
                      </span>
                    )}
                  </label>
                  {field.type === "select" ? (
                    <select
                      id={field.id}
                      name={field.id}
                      value={formData[field.id]}
                      onChange={handleChange}
                      className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-colors"
                      disabled={isLoading}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        id={field.id}
                        name={field.id}
                        checked={formData[field.id]}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      value={formData[field.id]}
                      onChange={handleChange}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className={`mt-1 block w-full p-2.5 border ${
                        errors[field.id] ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-colors`}
                      disabled={isLoading}
                    />
                  )}
                  {errors[field.id] && (
                    <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200"
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
            "Find Demand Zones for All Tickers"
          )}
        </button>
      </form>
    </div>
  );
}

export default MultiDemandZoneForm;