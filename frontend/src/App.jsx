import React from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';

const App = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-gray-200">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-8">
                <Dashboard />
            </main>
        </div>
    );
};

export default App;