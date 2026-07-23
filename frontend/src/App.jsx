import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const App = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-gray-200">
                <Navbar />
                <main className="max-w-6xl mx-auto px-6 py-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
};

export default App;