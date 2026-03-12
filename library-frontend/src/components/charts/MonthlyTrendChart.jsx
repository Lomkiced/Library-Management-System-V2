import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axiosClient from '../../axios-client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function MonthlyTrendChart() {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axiosClient.get('/analytics/trends')
            .then(({ data }) => {
                setChartData({
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Books Borrowed',
                            data: data.data,
                            borderColor: 'rgb(59, 130, 246)', // Blue-500
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: 'rgb(255, 255, 255)',
                            pointBorderColor: 'rgb(59, 130, 246)',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                        },
                    ],
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch trends", err);
                setLoading(false);
            });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 13 },
                displayColors: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(243, 244, 246, 1)', // gray-100
                    borderDash: [5, 5],
                },
                ticks: {
                    stepSize: 1
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading Trends...</div>;

    return (
        <div className="h-64">
            <Line options={options} data={chartData} />
        </div>
    );
}
