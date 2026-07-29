import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardMock from './pages/Dashboardmock';


const App = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-gray-200">
                <Navbar />
                <main className="max-w-6xl mx-auto px-6 py-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />}/>
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
};

export default App;