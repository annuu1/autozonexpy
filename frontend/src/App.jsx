import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import DemandZoneForm from "./components/DemandZoneForm.jsx";
import DemandZoneTable from "./components/DemandZoneTable.jsx";
import CoincidingZoneForm from "./components/CoincidingZoneForm.jsx";
import CoincidingZoneTable from "./components/CoincidingZoneTable.jsx";
import MultiDemandZoneForm from "./components/MultiDemandZoneForm.jsx";
import MultiDemandZoneTable from "./components/MultiDemandZoneTable.jsx";
import ZoneCharts from "./components/ZoneCharts.jsx";
import ZoneChartsTable from "./components/ZoneChartsTable.jsx";
import ZoneChart from "./components/charts/ZoneChart.jsx";
import TradesTable from "./components/tables/TradesTable.jsx";
import AllZonesTable from "./components/tables/AllZonesTable.jsx";
import 'react-toastify/dist/ReactToastify.css';
import { TradeJournal } from "./components/TradeJournal.jsx";
import Dmat from "./components/pages/Dmat.jsx";
import DmatDetail from "./components/pages/DmatDetail.jsx";

function App() {
  const [zones, setZones] = useState([]);
  const [error, setError] = useState(null);

  // Shared state for multi-ticker zones and settings
  const [multiTickerZones, setMultiTickerZones] = useState([]);
  const [multiTickerSettings, setMultiTickerSettings] = useState(null);

  const handleFormSubmit = (newZones, errorMessage) => {
    setZones(newZones || []);
    setError(errorMessage || null);
  };

  // Handler for multi-ticker form that updates both zones and settings
  const handleMultiTickerSubmit = (newZones, settings, errorMessage) => {
    const allZones = newZones ? Object.entries(newZones).flatMap(([ticker, zones]) =>
      zones.map((zone) => ({ ...zone, ticker }))
    ) : [];

    setMultiTickerZones(allZones);
    setMultiTickerSettings(settings);
    setZones(allZones); // Also update the regular zones for backward compatibility
    setError(errorMessage || null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-full mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            GTF Demand Zone Finder
          </h1>

          {/* Enhanced Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              to="/dmats"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-blue-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-blue-200"
            >
              Dmats
            </Link>
            <Link
              to="/coinciding-zones"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-indigo-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-indigo-200"
            >
              Coinciding Zones
            </Link>
            <Link
              to="/all-demand-zones"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-purple-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-purple-200"
            >
              Multi Ticker Zones
            </Link>
            <Link
              to="/zone-charts-table"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-emerald-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-emerald-200"
            >
              Zone Charts Table
            </Link>
            <Link
              to="/stock-chart"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-green-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-green-200"
            >
              Zone Charts
            </Link>
            <Link
              to="/trades"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-amber-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-amber-200"
            >
              Trades
            </Link>
            <Link
              to="/all-zones"
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-amber-700 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 border border-amber-200"
            >
              All Zones
            </Link>
          </div>

          {/* Routes */}
          <Routes>
            <Route
              path="/dmat"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                  <Dmat />
                </div>
              }
            />
            <Route
              path="/dmats"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                  <DmatDetail />
                </div>
              }
            />

            <Route
              path="/coinciding-zones"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                  <CoincidingZoneForm onSubmit={handleFormSubmit} />
                  {error && (
                    <div className="mt-6 p-4 bg-red-100/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-200">
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
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                  <MultiDemandZoneForm onZonesFetched={handleMultiTickerSubmit} />
                  <MultiDemandZoneTable zones={multiTickerZones} />
                </div>
              }
            />

            <Route
              path="/zone-charts-table"
              element={
                <div className="h-screen flex flex-col p-4">
                  <ZoneChartsTable
                    initialZones={multiTickerZones}
                    initialSettings={multiTickerSettings}
                    onZonesUpdate={setMultiTickerZones}
                  />
                </div>
              }
            />

            <Route
              path="/stock-chart"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                  <ZoneCharts />
                </div>
              }
            />

            <Route
              path="/trades"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Trades</h2>
                  <div className="h-[700px] w-full">
                    <TradesTable />
                  </div>
                </div>
              }
            />

            <Route
              path="/all-zones"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">All Zones</h2>
                  <div className="h-[700px] w-full">
                    <AllZonesTable />
                  </div>
                </div>
              }
            />
            <Route
              path="/trade-journal"
              element={
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Trade Journal</h2>
                  <div className="h-[700px] w-full">
                    <TradeJournal />
                  </div>
                </div>
              }
            />

            <Route
              path="*"
              element={
                <div className="text-center mt-16 bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg">
                  <div className="text-gray-500 text-xl mb-4">
                    Welcome to GTF Demand Zone Finder
                  </div>
                  <p className="text-gray-400">
                    Please select a route from the navigation above to get started.
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;