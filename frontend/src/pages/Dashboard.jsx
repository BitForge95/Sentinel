import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalTransactions: 0, flaggedTransactions: 0, totalVolume: 0 });
    const [fraudLogs, setFraudLogs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLive, setIsLive] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    
    // track which transaction is currently selected for the inspector
    const [selectedTx, setSelectedTx] = useState(null);

    const fetchDashboardData = async (silent = false, fetchPage = 1) => {
        if (!silent) setLoading(true);
        
        try {
            const [statsRes, logsRes, txRes] = await Promise.all([
                fetch('http://localhost:5000/api/analytics'),
                fetch('http://localhost:5000/api/fraud'),
                fetch(`http://localhost:5000/api/transactions?page=${fetchPage}&limit=50`)
            ]);
            
            const statsData = await statsRes.json();
            const logsData = await logsRes.json();
            const txData = await txRes.json();

            setStats(statsData);
            setFraudLogs(logsData);
            
            if (fetchPage === 1) {
                setTransactions(txData.transactions);
            } else {
                setTransactions(prev => [...prev, ...txData.transactions]);
            }
            
            setHasMore(txData.currentPage < txData.totalPages);
            if (!silent) setLoading(false);
        } catch (error) {
            console.error("failed to fetch dashboard data:", error);
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(false, 1);

        let pollInterval;
        if (isLive) {
            pollInterval = setInterval(() => {
                fetchDashboardData(true, 1);
                setPage(1); 
            }, 3000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
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
            const response = await fetch(`http://localhost:5000/api/fraud/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: reason,
                    severity: overrideReason ? 'high' : 'medium'
                })
            });

            if (response.ok) fetchDashboardData(true, 1);
        } catch (error) {
            console.error("failed to flag transaction:", error);
        }
    };

    const handleResolveIncident = async (logId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/fraud/${logId}/resolve`, {
                method: 'DELETE'
            });

            if (response.ok) fetchDashboardData(true, 1);
        } catch (error) {
            console.error("failed to resolve incident:", error);
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
            const response = await fetch('http://localhost:5000/api/transactions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const newTx = await response.json();

            if (!response.ok) {
                console.error("backend validation failed:", newTx);
                return; 
            }

            if (isAnomaly && newTx._id) {
                await handleFlagTransaction(newTx._id, "System Alert: Suspicious high volume transfer");
            } else {
                fetchDashboardData(true, 1);
            }
        } catch (error) {
            console.error("network connection failed:", error);
        }
    };

    if (loading && transactions.length === 0) {
        return <div className="text-gray-500 mt-20 text-center text-sm font-mono">loading transaction batch...</div>;
    }

    const anomalyRate = stats.totalTransactions > 0 
        ? ((stats.flaggedTransactions / stats.totalTransactions) * 100).toFixed(2) 
        : 0;

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.senderAccount.includes(searchTerm) || tx.receiverAccount.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 relative">
            <div className="flex justify-between items-center bg-white border border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Network Simulation Controls</span>
                    
                    <button 
                        onClick={() => setIsLive(!isLive)}
                        className={`flex items-center gap-2 text-xs px-3 py-1.5 border transition-colors ${
                            isLive 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        {isLive ? 'Live Monitoring Active' : 'Enable Live Feed'}
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => injectPayload(false)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 border border-gray-300 transition-colors"
                    >
                        Inject Standard Payload
                    </button>
                    <button 
                        onClick={() => injectPayload(true)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 border border-red-200 transition-colors"
                    >
                        Inject Anomaly Pattern
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Scanned Transactions</span>
                    <span className="text-2xl text-gray-900">{stats.totalTransactions}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Processed Volume</span>
                    <span className="text-2xl text-gray-900">${stats.totalVolume.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Anomalies Detected</span>
                    <span className="text-2xl text-red-600 font-medium">{stats.flaggedTransactions}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Anomaly Rate</span>
                    <span className="text-2xl text-gray-900">{anomalyRate}%</span>
                </div>
            </div>

            <div className="border border-gray-200 bg-white shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-sm font-medium text-gray-700">Anomaly Log</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-500 bg-white">
                                <th className="px-4 py-2 font-normal text-xs">Time Detected</th>
                                <th className="px-4 py-2 font-normal text-xs">Risk Level</th>
                                <th className="px-4 py-2 font-normal text-xs">Anomaly Details</th>
                                <th className="px-4 py-2 font-normal text-xs">Transaction Value</th>
                                <th className="px-4 py-2 font-normal text-xs text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fraudLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`font-medium text-xs ${
                                            log.severity === 'critical' ? 'text-red-700' : 
                                            log.severity === 'high' ? 'text-orange-700' : 
                                            'text-yellow-700'
                                        }`}>
                                            {log.severity.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 text-sm">{log.reason}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                        {log.transactionId?.amount || '0'} {log.transactionId?.currency || ''}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => handleResolveIncident(log._id)}
                                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-sm transition-colors"
                                        >
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {fraudLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-sm">
                                        no anomalies detected in current batch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="border border-gray-200 bg-white shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-700">Raw Transaction Feed</h2>
                    
                    <div className="flex gap-3">
                        <input 
                            type="text"
                            placeholder="search account ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-xs border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-gray-500 w-48"
                        />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-gray-500 bg-white"
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
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-gray-200 text-gray-500">
                                <th className="px-4 py-2 font-normal text-xs">Timestamp</th>
                                <th className="px-4 py-2 font-normal text-xs">Sender</th>
                                <th className="px-4 py-2 font-normal text-xs">Receiver</th>
                                <th className="px-4 py-2 font-normal text-xs">Amount</th>
                                <th className="px-4 py-2 font-normal text-xs">Status</th>
                                <th className="px-4 py-2 font-normal text-xs text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 font-mono text-xs">
                                        {searchTerm && tx.senderAccount.includes(searchTerm) ? (
                                            <span className="bg-yellow-100">{tx.senderAccount}</span>
                                        ) : tx.senderAccount}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 font-mono text-xs">
                                        {searchTerm && tx.receiverAccount.includes(searchTerm) ? (
                                            <span className="bg-yellow-100">{tx.receiverAccount}</span>
                                        ) : tx.receiverAccount}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                        {tx.amount} {tx.currency}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs ${
                                            tx.status === 'flagged' ? 'text-red-600' : 
                                            tx.status === 'resolved' ? 'text-emerald-600' : 'text-gray-500'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => setSelectedTx(tx)}
                                            className="text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-200 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-sm transition-colors"
                                        >
                                            Inspect
                                        </button>
                                        {tx.status === 'pending' && (
                                            <button 
                                                onClick={() => handleFlagTransaction(tx._id)}
                                                className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-sm transition-colors"
                                            >
                                                Flag
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 text-sm">
                                        no transactions match current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {hasMore && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
                        <button 
                            onClick={loadMoreTransactions}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Load Older Transactions
                        </button>
                    </div>
                )}
            </div>

            {/* raw data inspector modal overlay */}
            {selectedTx && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
                    <div className="bg-white border border-gray-200 shadow-lg w-full max-w-lg">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-900">Raw Payload Inspector</h3>
                            <button 
                                onClick={() => setSelectedTx(null)}
                                className="text-gray-400 hover:text-gray-600"
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