// Component for managing zone lines on charts
export const addZoneLines = (candlestickSeries, zones) => {
  if (!zones || zones.length === 0) return [];

  const addedLines = [];

  zones.forEach((zone, index) => {
    try {
      const baseColor = zone.pattern === 'RBR' ? '#26a69a' : '#ef5350';
      
      // Add proximal line (solid)
      const proximalLine = candlestickSeries.createPriceLine({
        price: parseFloat(zone.proximal_line),
        color: baseColor,
        lineWidth: 2,
        lineStyle: 0, // solid
        axisLabelVisible: true,
        title: `${zone.pattern} Proximal (F:${zone.freshness})`,
      });

      // Add distal line (dashed)
      const distalLine = candlestickSeries.createPriceLine({
        price: parseFloat(zone.distal_line),
        color: baseColor,
        lineWidth: 1,
        lineStyle: 1, // dashed
        axisLabelVisible: true,
        title: `${zone.pattern} Distal`,
      });

      addedLines.push({ proximalLine, distalLine });
      console.log(`Added zone ${index + 1}: ${zone.pattern} P:${zone.proximal_line} D:${zone.distal_line}`);
    } catch (error) {
      console.error(`Error adding zone ${index}:`, error, zone);
    }
  });

  return addedLines;
};