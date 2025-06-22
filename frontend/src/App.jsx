import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import DemandZoneForm from "./components/DemandZoneForm.jsx";
import DemandZoneTable from "./components/DemandZoneTable.jsx";
import CoincidingZoneForm from "./components/CoincidingZoneForm.jsx";
import CoincidingZoneTable from "./components/CoincidingZoneTable.jsx";
import MultiDemandZoneForm from "./components/MultiDemandZoneForm.jsx";
import MultiDemandZoneTable from "./components/MultiDemandZoneTable.jsx";

function App() {
  const [zones, setZones] = useState([]);
  const [error, setError] = useState(null);

  const handleFormSubmit = (newZones, errorMessage) => {
    setZones(newZones || []);
    setError(errorMessage || null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          GTF Demand Zone Finder
        </h1>

        {/* Navigation */}
        <div className="flex justify-center gap-6 mb-8">
          <Link to="/demand-zones" className="text-blue-600 hover:underline">
            Single Demand Zones
          </Link>
          <Link
            to="/coinciding-zones"
            className="text-blue-600 hover:underline"
          >
            Coinciding Zones
          </Link>
          <Link
            to="/all-demand-zones"
            className="text-blue-600 hover:underline"
          >
            Multi Ticker Zones
          </Link>
        </div>

        {/* Routes */}
        <Routes>
          <Route
            path="/demand-zones"
            element={
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
                <DemandZoneForm onSubmit={handleFormSubmit} />
                {error && (
                  <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                <DemandZoneTable zones={zones} />
              </div>
            }
          />

          <Route
            path="/coinciding-zones"
            element={
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
                <CoincidingZoneForm onSubmit={handleFormSubmit} />
                {error && (
                  <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                <CoincidingZoneTable zones={zones} />
              </div>
            }
          />

          <Route
            path="/all-demand-zones"
            element={
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
                <MultiDemandZoneForm onZonesFetched={setZones} />
                <MultiDemandZoneTable zones={zones} />
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div className="text-center mt-16 text-gray-500 text-xl">
                Please select a route from above.
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
