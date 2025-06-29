// page to diplay the zone data and their charts
import React from 'react'
import StockChart from './StockChart'

const ZoneCharts = () => {
    return (
        <div>
            <h1>Zone Charts</h1>
            <StockChart ticker="RELIANCE" interval="1d" selectedZone={null}/>
        </div>
    )
}

export default ZoneCharts
