import { useState, useEffect } from 'react';
import {
    BarChart3,
    Activity,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Loader
} from 'lucide-react';
import { monitoringAPI } from '../api/client';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';

export default function Monitoring() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [days, setDays] = useState(7);

    useEffect(() => {
        fetchDashboard();
    }, [days]);

    const fetchDashboard = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await monitoringAPI.getDashboard(days);
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-red-50 border-red-200">
                <p className="text-red-700">{error}</p>
                <button onClick={fetchDashboard} className="btn btn-primary mt-4">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-600">
                        Monitor system performance and agent metrics
                    </p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="input w-auto"
                >
                    <option value={1}>Last 24 hours</option>
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary?.total_calls || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Across all agents</p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary?.success_rate?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Overall performance</p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Avg Latency</h3>
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary?.avg_latency_ms?.toFixed(0) || 0}ms
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Response time</p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Error Count</h3>
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {data?.summary?.error_count || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Failed requests</p>
                </div>
            </div>

            {/* Agent Performance Table */}
            {data?.agents && data.agents.length > 0 && (
                <div className="card mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Agent Performance
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Agent
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Total Calls
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Success Rate
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Avg Latency
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Errors
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.agents.map((agent, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {agent.agent_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {agent.total_calls}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${agent.success_rate >= 90
                                                        ? 'bg-green-100 text-green-800'
                                                        : agent.success_rate >= 70
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {agent.success_rate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {agent.avg_latency_ms}ms
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {agent.error_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts */}
            {data?.agents && data.agents.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Agent Calls Chart */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Agent Activity
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.agents}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="agent_name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total_calls" fill="#0ea5e9" name="Total Calls" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Success Rate Chart */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Success Rates
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.agents}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="agent_name" angle={-45} textAnchor="end" height={80} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* No Data State */}
            {(!data?.agents || data.agents.length === 0) && (
                <div className="card text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Data Available
                    </h3>
                    <p className="text-gray-600">
                        Start using the system to see analytics and performance metrics here.
                    </p>
                </div>
            )}
        </div>
    );
}
