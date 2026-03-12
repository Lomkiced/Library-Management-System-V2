import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axiosClient from '../../axios-client';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPieChart() {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axiosClient.get('/analytics/categories')
            .then(({ data }) => {
                setChartData({
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Total Titles',
                            data: data.data,
                            backgroundColor: [
                                'rgba(99, 102, 241, 0.8)', // Indigo
                                'rgba(16, 185, 129, 0.8)', // Emerald
                                'rgba(245, 158, 11, 0.8)', // Amber
                                'rgba(244, 63, 94, 0.8)',  // Rose
                                'rgba(59, 130, 246, 0.8)', // Blue
                            ],
                            borderColor: [
                                'rgba(99, 102, 241, 1)',
                                'rgba(16, 185, 129, 1)',
                                'rgba(245, 158, 11, 1)',
                                'rgba(244, 63, 94, 1)',
                                'rgba(59, 130, 246, 1)',
                            ],
                            borderWidth: 1,
                        },
                    ],
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch categories", err);
                setLoading(false);
            });
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, // Important for fitting
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    boxWidth: 15,
                    usePointStyle: true,
                }
            },
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center text-gray-400">Loading Categories...</div>;

    return (
        <div className="h-56">
            {chartData.labels.length > 0 ? (
                <Doughnut options={options} data={chartData} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    No borrowing data yet
                </div>
            )}
        </div>
    );
}
