import React from 'react';

const Navbar = () => {
    return (
        <nav className="border-b border-gray-200 bg-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-sm"></div>
                <h1 className="text-base font-medium text-gray-900 tracking-tight">Sentinel Anomaly Checker</h1>
            </div>
            <div className="text-xs text-gray-500 font-mono">
                system active
            </div>
        </nav>
    );
};

export default Navbar;