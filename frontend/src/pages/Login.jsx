import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            }, {
                withCredentials: true
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed.');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white p-8 border border-gray-200 shadow-sm w-full max-w-md">
                <div className="mb-6 text-center">
                    <h2 className="text-xl font-medium text-gray-900">Sentinel SOC Login</h2>
                    <p className="text-sm text-gray-500 mt-1">Authenticate to access the dashboard</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white text-sm font-medium py-2 hover:bg-gray-800 transition-colors mt-2"
                    >
                        Secure Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;