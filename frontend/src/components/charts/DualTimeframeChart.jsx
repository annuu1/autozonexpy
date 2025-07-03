import React, { useState } from 'react'
import { Settings, Bell, AlarmCheckIcon } from 'lucide-react'
import ChartContainer from './ChartContainer'
import ZoneLegend from './ZoneLegend'
import ZoneDetails from './ZoneDetails'
import CollapsibleSection from '../ui/CollapsibleSection'
import Card from '../ui/Card'
import Button from '../ui/Button'
import AddTrade from '../modals/AddTrade'
import TradesModal from '../modals/TradesModal'
import { getTradeBySymbol } from '../../services/api'

const DualTimeframeChart = ({ ticker, higherTimeframeZone, lowerTimeframeZones = [] }) => {
  const [higherInterval, setHigherInterval] = useState('1wk')
  const [lowerInterval, setLowerInterval] = useState('1d')

  const higherIntervals = [
    { value: '1mo', label: 'Monthly' },
    { value: '1wk', label: 'Weekly' },
    { value: '1d', label: 'Daily' },
    { value: '1h', label: 'Hourly' },
  ]

  const lowerIntervals = [
    { value: '1d', label: 'Daily' },
    { value: '1h', label: 'Hourly' },
    { value: '30m', label: '30 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '5m', label: '5 Minutes' },
  ]

  const [tradesList, setTradesList] = React.useState([]);
  React.useEffect(() => {
    const fetchTrades = async () => {
      try {
        const trades = await getTradeBySymbol(ticker);
        console.log("trades", trades);
        setTradesList(trades);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };
    fetchTrades();
  }, [ticker]);

  const normalizedTicker = ticker?.toUpperCase().endsWith('.NS')
    ? ticker.toUpperCase()
    : `${ticker?.toUpperCase()}.NS`

  const higherZones = higherTimeframeZone ? [higherTimeframeZone] : []
  const lowerZones = lowerTimeframeZones || []

  if (!ticker || !higherTimeframeZone) {
    return (
      <Card>
        <Card.Content className="text-center p-8">
          <p className="text-gray-500 text-lg">No zone data provided for chart display.</p>
          <p className="text-gray-400 text-sm mt-2">Please select a zone to view its charts.</p>
        </Card.Content>
      </Card>
    )
  }

  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [isTradesListModalOpen, setIsTradesListModalOpen] = useState(false)

  const handleBellClick = () => {
    setIsTradeModalOpen(true)
  }
  const handleTradeModalOpen = () => {
    setIsTradeModalOpen(true)
  }

  const handleTradeModalClose = () => {
    setIsTradeModalOpen(false)
  }

  const handleTradesListModalClose = () => {
    setIsTradesListModalOpen(false)
  }

  const handleTradesListModalOpen = () => {
    setIsTradesListModalOpen(true)
  }

  const trades = () => [
    {
      entry_price: parseFloat(higherTimeframeZone.proximal_line).toFixed(2),
      sl: parseFloat(higherTimeframeZone.distal_line).toFixed(2),
      target:
        parseFloat(higherTimeframeZone.proximal_line +
          (higherTimeframeZone.proximal_line - higherTimeframeZone.distal_line) * 2).toFixed(2),
    },
    ...lowerTimeframeZones.map((zone) => ({
      entry_price: parseFloat(zone.proximal_line).toFixed(2),
      sl: parseFloat(zone.distal_line).toFixed(2),
      target: parseFloat(zone.proximal_line).toFixed(2) + (parseFloat(zone.proximal_line).toFixed(2) - parseFloat(zone.distal_line).toFixed(2)) * 2,
    })),
  ];

  return (
    <div className="space-y-4 h-full">
      <AddTrade ticker={normalizedTicker.split('.NS')[0]}
        trades={trades()}
        isOpen={isTradeModalOpen} onClose={handleTradeModalClose} />
      <TradesModal OnClick={handleTradesListModalOpen} isOpen={isTradesListModalOpen} onClose={handleTradesListModalClose} ticker={normalizedTicker.split('.NS')[0]} trades={tradesList} />
      {/* Zone Summary Header */}
      <Card>
        <Card.Content className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ display: 'inline' }} className="text-lg font-semibold text-gray-800">
                {normalizedTicker.split('.NS')[0]}
              </h3>
              <div className='inline-flex items-center gap-2 ml-2'>
                <Bell style={{ cursor: 'pointer', color: 'green' }}
                  size={16} onClick={handleBellClick} />

                <AlarmCheckIcon style={{ cursor: 'pointer', color: 'green' }}
                  size={16} onClick={handleTradesListModalOpen} />
                {tradesList.length > 0 && (
                  <sup className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center ml-[-8px]">
                    {tradesList.length}
                  </sup>
                )}
                {/* show the last created date of the last trade */}
                {tradesList.length > 0 && (
                  <span className="text-xs text-gray-600 ml-2">
                    last trade on : {tradesList[tradesList.length - 1].created_at.split('T')[0]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${higherTimeframeZone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {higherTimeframeZone.pattern}
                </span>
                <span>P: {higherTimeframeZone.proximal_line.toFixed(2)}</span>
                <span>D: {higherTimeframeZone.distal_line.toFixed(2)}</span>
                <span>Score: {higherTimeframeZone.trade_score.toFixed(1)}</span>
                <span className={`font-medium ${higherTimeframeZone.freshness === 3 ? 'text-green-600' :
                  higherTimeframeZone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  F: {higherTimeframeZone.freshness}
                </span>
                {lowerZones.length > 0 && (
                  <span className="text-blue-600 font-medium">+{lowerZones.length} LTF zones</span>
                )}
              </div>
            </div>
            <Button onClick={handleBellClick}>Add Trade</Button>
          </div>
        </Card.Content>
      </Card>

      {/* Timeframe Controls */}
      <CollapsibleSection
        title="Chart Controls & Data Range Info"
        icon={<Settings size={16} />}
        defaultCollapsed={true}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Higher Timeframe:
              </label>
              <select
                value={higherInterval}
                onChange={(e) => setHigherInterval(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {higherIntervals.map(interval => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lower Timeframe:
              </label>
              <select
                value={lowerInterval}
                onChange={(e) => setLowerInterval(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                {lowerIntervals.map(interval => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Range Information */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-3 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Initial Data Ranges:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
              <div>
                <span className="font-medium">Higher TF ({higherInterval}):</span>
                <span className="ml-2">
                  {higherInterval === '1mo' ? '10 years' :
                    higherInterval === '1wk' ? '5 years' :
                      higherInterval === '1d' ? '1 year' :
                        higherInterval === '1h' ? '30 days' : '1 year'}
                </span>
              </div>
              <div>
                <span className="font-medium">Lower TF ({lowerInterval}):</span>
                <span className="ml-2">
                  {lowerInterval === '1mo' ? '10 years' :
                    lowerInterval === '1wk' ? '5 years' :
                      lowerInterval === '1d' ? '1 year' :
                        lowerInterval === '1h' ? '30 days' :
                          lowerInterval === '30m' ? '20 days' :
                            lowerInterval === '15m' ? '15 days' :
                              lowerInterval === '5m' ? '10 days' : '1 year'}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 Use "Load More" buttons to extend historical data further back
            </p>
          </div>
        </div>

        {/* Zone Legend */}
        <ZoneLegend zones={[...higherZones, ...lowerZones]} />
      </CollapsibleSection>


      {/* Dual Charts - Full Height */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-[600px]">
        <ChartContainer
          ticker={normalizedTicker}
          interval={higherInterval}
          zones={higherZones}
          title={`Higher Timeframe (${higherInterval.toUpperCase()})`}
          height={600}
          onIntervalChange={setHigherInterval}
        />

        <ChartContainer
          ticker={normalizedTicker}
          interval={lowerInterval}
          zones={lowerZones}
          title={`Lower Timeframe (${lowerInterval.toUpperCase()})`}
          height={600}
          onIntervalChange={setLowerInterval}
        />
      </div>

      {/* Zone Details */}
      {lowerZones.length > 0 && (
        <CollapsibleSection
          title={`Lower Timeframe Zone Details (${lowerZones.length} zones)`}
          defaultCollapsed={true}
        >
          <ZoneDetails zones={lowerZones} />
        </CollapsibleSection>
      )}
    </div>
  )
}

export default DualTimeframeChart