import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalTransactions: 0, flaggedTransactions: 0, totalVolume: 0 });
    const [fraudLogs, setFraudLogs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLive, setIsLive] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); // Dark Mode State

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);

    const navigate = useNavigate();

    // Dark Mode Effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const fetchDashboardData = async (silent = false, fetchPage = 1) => {
        if (!silent) setLoading(true);
        
        try {
            const [statsRes, logsRes, txRes] = await Promise.all([
                axios.get('http://localhost:5000/api/analytics', { withCredentials: true }),
                axios.get('http://localhost:5000/api/fraud', { withCredentials: true }),
                axios.get(`http://localhost:5000/api/transactions?page=${fetchPage}&limit=50`, { withCredentials: true })
            ]);

            setStats(statsRes.data);
            setFraudLogs(logsRes.data);
            
            if (fetchPage === 1) {
                setTransactions(txRes.data.transactions || []);
            } else {
                setTransactions(prev => [...prev, ...(txRes.data.transactions || [])]);
            }
            
            setHasMore(txRes.data.currentPage < txRes.data.totalPages);
            if (!silent) setLoading(false);
        } catch (error) {
            console.error("failed to fetch dashboard data:", error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
            if (!silent) setLoading(false);
        }
    };

    const chartData = [...(transactions || [])]
        .slice(0, 20)
        .reverse()
        .map(tx => ({
            time: new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            amount: tx.amount,
            status: tx.status,
            isAnomaly: tx.status === 'flagged' 
        }));

    useEffect(() => {
        fetchDashboardData(false, 1);

        const socket = io('http://localhost:5000', {
            withCredentials: true
        });

        socket.on('connect', () => {
            console.log('WebSocket Connected to Sentinel API');
        });

        socket.on('dashboard_update', () => {
            if (isLive) {
                fetchDashboardData(true, 1);
                setPage(1); 
            }
        });
        return () => {
            socket.disconnect();
        };
    }, [isLive]);

    const loadMoreTransactions = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchDashboardData(false, nextPage);
    };

    const handleFlagTransaction = async (id, overrideReason = null) => {
        const reason = overrideReason || window.prompt("Enter reason for flagging this transaction:");
        if (!reason) return;

        try {
            await axios.post(`http://localhost:5000/api/fraud/${id}`, {
                reason: reason,
                severity: overrideReason ? 'high' : 'medium'
            }, { withCredentials: true });

            fetchDashboardData(true, 1);
        } catch (error) {
            console.error("failed to flag transaction:", error);
            if (error.response?.status === 401) navigate('/login');
        }
    };

    const handleResolveIncident = async (logId) => {
        try {
            await axios.delete(`http://localhost:5000/api/fraud/${logId}/resolve`, { withCredentials: true });
            fetchDashboardData(true, 1);
        } catch (error) {
            console.error("failed to resolve incident:", error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
            else if (error.response?.status === 403) {
                // Catch the RBAC block and alert the user
                window.alert("Access Denied: Only Admin accounts can resolve security incidents.");
            }
        }
    };

    const injectPayload = async (isAnomaly) => {
        const payload = {
            senderAccount: Math.floor(100000 + Math.random() * 900000).toString(),
            receiverAccount: Math.floor(100000 + Math.random() * 900000).toString(),
            amount: isAnomaly ? Math.floor(50000 + Math.random() * 50000) : Math.floor(10 + Math.random() * 900),
            currency: 'USD'
        };

        try {
            const response = await axios.post('http://localhost:5000/api/transactions/generate', payload, {
                withCredentials: true
            });

            const newTx = response.data;

            if (isAnomaly && newTx._id) {
                await handleFlagTransaction(newTx._id, "System Alert: Suspicious high volume transfer");
            } else {
                fetchDashboardData(true, 1);
            }
        } catch (error) {
            console.error("network or validation failed:", error);
            if (error.response?.status === 401) navigate('/login');
        }
    };

    if (loading && transactions.length === 0) {
        return <div className="text-gray-500 dark:text-gray-400 mt-20 text-center text-sm font-mono">loading transaction batch...</div>;
    }

    const anomalyRate = stats?.totalTransactions > 0 
        ? ((stats.flaggedTransactions / stats.totalTransactions) * 100).toFixed(2) 
        : 0;

    const filteredTransactions = (transactions || []).filter(tx => {
        const matchesSearch = tx.senderAccount.includes(searchTerm) || tx.receiverAccount.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const exportToCSV = () => {
        if (filteredTransactions.length === 0) {
            window.alert("No data to export.");
            return;
        }

        const headers = ['Timestamp', 'Sender', 'Receiver', 'Amount', 'Currency', 'Status'];
        const csvRows = [headers.join(',')];

        filteredTransactions.forEach(tx => {
            const row = [
                `"${new Date(tx.createdAt).toLocaleString()}"`, // Wrap in quotes to prevent comma splitting
                `"${tx.senderAccount}"`,
                `"${tx.receiverAccount}"`,
                `"${tx.amount}"`,
                `"${tx.currency}"`,
                `"${tx.status}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `sentinel_export_${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 relative min-h-screen dark:bg-gray-900 transition-colors duration-200 pb-10">
            {/* Header Controls */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm transition-colors duration-200">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Sentinel SOC</span>
                    
                    <button 
                        onClick={() => setIsLive(!isLive)}
                        className={`flex items-center gap-2 text-xs px-3 py-1.5 border transition-colors ${
                            isLive 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
                        {isLive ? 'Live Monitoring Active' : 'Enable Live Feed'}
                    </button>

                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        {isDarkMode ? ' Light Mode' : ' Dark Mode'}
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => injectPayload(false)}
                        className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 border border-gray-300 dark:border-gray-600 transition-colors"
                    >
                        Inject Standard Payload
                    </button>
                    <button 
                        onClick={() => injectPayload(true)}
                        className="text-xs bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 px-3 py-1.5 border border-red-200 dark:border-red-800 transition-colors"
                    >
                        Inject Anomaly Pattern
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 px-4">
                <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Scanned Transactions</span>
                    <span className="text-2xl text-gray-900 dark:text-white">{stats?.totalTransactions || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Processed Volume</span>
                    <span className="text-2xl text-gray-900 dark:text-white">${(stats?.totalVolume || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Anomalies Detected</span>
                    <span className="text-2xl text-red-600 dark:text-red-500 font-medium">{stats?.flaggedTransactions || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Anomaly Rate</span>
                    <span className="text-2xl text-gray-900 dark:text-white">{anomalyRate}%</span>
                </div>
            </div>

            {/* Live Volume Chart */}
            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mx-4 transition-colors duration-200">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Live Transaction Volume</h2>
                    <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Standard
                        <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span> Flagged
                    </span>
                </div>
                <div className="h-64 w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                            <XAxis 
                                dataKey="time" 
                                tick={{fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280'}} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                tick={{fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280'}} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#111827', border: 'none', borderRadius: '4px', fontSize: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#10b981" 
                                strokeWidth={2} 
                                dot={(props) => {
                                    const { cx, cy, payload } = props;
                                    return (
                                        <circle 
                                            key={`dot-${payload.time}-${payload.amount}`} 
                                            cx={cx} 
                                            cy={cy} 
                                            r={4} 
                                            fill={payload.isAnomaly ? "#ef4444" : "#10b981"} 
                                            stroke="none" 
                                        />
                                    );
                                }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Anomaly Log */}
            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mx-4 transition-colors duration-200">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Anomaly Log</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                                <th className="px-4 py-2 font-normal text-xs">Time Detected</th>
                                <th className="px-4 py-2 font-normal text-xs">Risk Level</th>
                                <th className="px-4 py-2 font-normal text-xs">Anomaly Details</th>
                                <th className="px-4 py-2 font-normal text-xs">Transaction Value</th>
                                <th className="px-4 py-2 font-normal text-xs text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {(Array.isArray(fraudLogs) ? fraudLogs : []).map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`font-medium text-xs ${
                                            log.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 
                                            log.severity === 'high' ? 'text-orange-700 dark:text-orange-400' : 
                                            'text-yellow-700 dark:text-yellow-400'
                                        }`}>
                                            {(log.severity || '').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 text-sm">{log.reason}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                        {log.transactionId?.amount || '0'} {log.transactionId?.currency || ''}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => handleResolveIncident(log._id)}
                                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-1 rounded-sm transition-colors"
                                        >
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!Array.isArray(fraudLogs) || fraudLogs.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                        no anomalies detected in current batch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Raw Transaction Feed */}
            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mx-4 transition-colors duration-200">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Raw Transaction Feed</h2>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={exportToCSV}
                            className="text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1.5 border border-blue-200 dark:border-blue-800 transition-colors mr-2"
                        >
                            Export CSV
                        </button>
                        <input 
                            type="text"
                            placeholder="search account ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 w-48"
                        />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 focus:outline-none focus:border-gray-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="flagged">Flagged</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                <th className="px-4 py-2 font-normal text-xs">Timestamp</th>
                                <th className="px-4 py-2 font-normal text-xs">Sender</th>
                                <th className="px-4 py-2 font-normal text-xs">Receiver</th>
                                <th className="px-4 py-2 font-normal text-xs">Amount</th>
                                <th className="px-4 py-2 font-normal text-xs">Status</th>
                                <th className="px-4 py-2 font-normal text-xs text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-300 font-mono text-xs">
                                        {searchTerm && tx.senderAccount.includes(searchTerm) ? (
                                            <span className="bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-200">{tx.senderAccount}</span>
                                        ) : tx.senderAccount}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-300 font-mono text-xs">
                                        {searchTerm && tx.receiverAccount.includes(searchTerm) ? (
                                            <span className="bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-200">{tx.receiverAccount}</span>
                                        ) : tx.receiverAccount}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                        {tx.amount} {tx.currency}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs ${
                                            tx.status === 'flagged' ? 'text-red-600 dark:text-red-400' : 
                                            tx.status === 'resolved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => setSelectedTx(tx)}
                                            className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded-sm transition-colors"
                                        >
                                            Inspect
                                        </button>
                                        {tx.status === 'pending' && (
                                            <button 
                                                onClick={() => handleFlagTransaction(tx._id)}
                                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-2 py-1 rounded-sm transition-colors"
                                            >
                                                Flag
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                        no transactions match current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {hasMore && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
                        <button 
                            onClick={loadMoreTransactions}
                            className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                            Load Older Transactions
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-lg">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Raw Payload Inspector</h3>
                            <button 
                                onClick={() => setSelectedTx(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                close
                            </button>
                        </div>
                        <div className="p-4 bg-gray-900 overflow-x-auto">
                            <pre className="text-xs text-emerald-400 font-mono">
                                {JSON.stringify(selectedTx, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;