import { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import './ChartWidget.css';
import CandlestickTracker from '../HelperClasses/CandlestickTracker';

const ChartWidget = ({ selectedStock }) => {
    const [candlestickData, setCandlestickData] = useState([]);

    useEffect(() => {
        // Function to update chart when new data is available
        const updateChartData = (allData) => {
            console.log('📊 Full CandlestickTracker Data:', allData); // Log all data for debugging
            console.log('Selected Stock', selectedStock);
            if (allData[selectedStock] && allData[selectedStock].length > 0) {
                const formattedData = allData[selectedStock]
                    .filter((candle) => candle.x && candle.y?.length === 4) // Ensure valid entries
                    .map((candle) => ({
                        x: new Date(candle.x).getTime(), // Convert to timestamp
                        y: [...candle.y], // Copy OHLC values
                    }));

                console.log(`🔄 Updating Chart for ${selectedStock}:`, formattedData);
                setCandlestickData(formattedData);
            } else {
                console.warn(`⚠ No valid data available for ${selectedStock}`);
                setCandlestickData([]); // Clear chart if no data is available
            }
        };

        // Subscribe to candlestick updates
        CandlestickTracker.subscribe(updateChartData);

        // Initial fetch of data
        updateChartData(CandlestickTracker.getAllCandlestickData());

        // Cleanup: Unsubscribe when component unmounts or stock changes
        return () => CandlestickTracker.unsubscribe(updateChartData);
    }, [selectedStock]);

    // Determine y-axis min and max dynamically
    const minPrice =
        candlestickData.length > 0
            ? Math.min(...candlestickData.map((d) => d.y[2])) * 0.98
            : undefined;
    const maxPrice =
        candlestickData.length > 0
            ? Math.max(...candlestickData.map((d) => d.y[1])) * 1.02
            : undefined;

    const options = {
        chart: {
            type: 'candlestick',
            height: 350,
        },
        title: {
            text: selectedStock || 'Select a Stock',
            align: 'left',
            style: {
                fontWeight: 'bold',
                color: '#FFFFFF',
            },
        },
        xaxis: {
            type: 'datetime',
            labels: {
                style: {
                    fontWeight: 'bold',
                    colors: '#FFFFFF',
                },
            },
        },
        yaxis: {
            min: minPrice,
            max: maxPrice,
            tooltip: {
                enabled: true,
            },
            labels: {
                style: {
                    fontWeight: 'bold',
                    colors: '#FFFFFF',
                },
            },
        },
    };

    return (
        <div className="chart-widget-container">
            {candlestickData.length > 0 ? (
                <ReactApexChart
                    options={options}
                    series={[{ data: candlestickData }]}
                    type="candlestick"
                    width="100%"
                    height="100%"
                />
            ) : (
                <p className="no-data-message">No candlestick data available</p>
            )}
        </div>
    );
};

export default ChartWidget;
