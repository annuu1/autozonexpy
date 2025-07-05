import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateSelector = ({ selectedDate, onChange }) => (
  <div className="flex flex-col text-xs w-[200px]">
    <DatePicker
      selected={selectedDate}
      onChange={onChange}
      dateFormat="yyyy-MM-dd"
      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
      isClearable
      placeholderText="Pick a date"
    />
  </div>
);

export default DateSelector;
