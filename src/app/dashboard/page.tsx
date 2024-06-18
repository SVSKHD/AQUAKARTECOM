// src/app/(dashboard)/page.tsx
import React from 'react';
import DashboardLayout from './dashboardLayout';

const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      {/* Your dashboard content goes here */}
    </DashboardLayout>
  );
};

export default DashboardPage;
