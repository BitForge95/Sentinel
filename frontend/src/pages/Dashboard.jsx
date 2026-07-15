import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalTransactions: 0, flaggedTransactions: 0, totalVolume: 0 });
    const [fraudLogs, setFraudLogs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, logsRes, txRes] = await Promise.all([
                fetch('http://localhost:5000/api/analytics'),
                fetch('http://localhost:5000/api/fraud'),
                fetch('http://localhost:5000/api/transactions')
            ]);
            
            const statsData = await statsRes.json();
            const logsData = await logsRes.json();
            const txData = await txRes.json();

            setStats(statsData);
            setFraudLogs(logsData);
            setTransactions(txData);
            setLoading(false);
        } catch (error) {
            console.error("failed to fetch dashboard data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

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

            if (response.ok) fetchDashboardData();
        } catch (error) {
            console.error("failed to flag transaction:", error);
        }
    };

    // new function to hit our backend resolve endpoint
    const handleResolveIncident = async (logId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/fraud/${logId}/resolve`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // refresh the tables to show the updated state
                fetchDashboardData();
            }
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
                fetchDashboardData();
            }
        } catch (error) {
            console.error("network connection failed:", error);
        }
    };

    if (loading) {
        return <div className="text-gray-500 mt-20 text-center text-sm font-mono">loading transaction batch...</div>;
    }

    const anomalyRate = stats.totalTransactions > 0 
        ? ((stats.flaggedTransactions / stats.totalTransactions) * 100).toFixed(2) 
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white border border-gray-200 px-4 py-3 shadow-sm">
                <span className="text-sm font-medium text-gray-700">Network Simulation Controls</span>
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
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="text-sm font-medium text-gray-700">Raw Transaction Feed</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-white">
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
                            {transactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 font-mono text-xs">{tx.senderAccount}</td>
                                    <td className="px-4 py-3 text-gray-800 font-mono text-xs">{tx.receiverAccount}</td>
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
                                    <td className="px-4 py-3 text-right">
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
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 text-sm">
                                        no transactions available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;