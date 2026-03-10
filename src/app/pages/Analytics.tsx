import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import FilterBar from '../components/FilterBar';
import { useData } from '../context/DataContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  PLANTS,
  DEPARTMENTS,
  STATUS_COLORS,
  calculateProjectMetrics,
  getDepartmentDelayStats,
  getMonthYear,
} from '../utils/calculations';

const Analytics: React.FC = () => {
  const { projects, attendanceRecords } = useData();

  const [filters, setFilters] = useState<{
    plant?: string;
    department?: string;
    month?: string;
  }>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const vendors = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.vendor)));
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (filters.plant && project.plant !== filters.plant) return false;
      if (filters.department && project.department !== filters.department) return false;
      if (filters.month) {
        const projectMonth = project.plannedStartDate.substring(0, 7);
        if (projectMonth !== filters.month) return false;
      }
      return true;
    });
  }, [projects, filters]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { total: number; completed: number; delayed: number; inProgress: number }> = {};

    projects.forEach(project => {
      const month = project.plannedStartDate.substring(0, 7);
      if (!months[month]) {
        months[month] = { total: 0, completed: 0, delayed: 0, inProgress: 0 };
      }
      months[month].total++;
      if (project.status === 'Completed') months[month].completed++;
      if (project.status === 'In Progress') months[month].inProgress++;

      const metrics = calculateProjectMetrics(project, attendanceRecords);
      if (metrics.isDelayed) months[month].delayed++;
    });

    return Object.entries(months)
      .map(([month, data]) => ({
        month: getMonthYear(month + '-01'),
        ...data,
        delayRate: data.total > 0 ? (data.delayed / data.total) * 100 : 0,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [projects, attendanceRecords]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts = { Minor: 0, Major: 0, Critical: 0 };
    filteredProjects.forEach(p => {
      counts[p.category]++;
    });
    return [
      { name: 'Minor', value: counts.Minor, color: '#3b82f6' },
      { name: 'Major', value: counts.Major, color: '#f59e0b' },
      { name: 'Critical', value: counts.Critical, color: '#ef4444' },
    ];
  }, [filteredProjects]);

  // Department performance radar
  const deptStats = getDepartmentDelayStats(filteredProjects, attendanceRecords);
  const radarData = DEPARTMENTS.map(dept => {
    const stats = deptStats[dept];
    const successRate = stats.totalProjects > 0
      ? ((stats.totalProjects - stats.delayedProjects) / stats.totalProjects) * 100
      : 0;

    return {
      department: dept,
      'Success Rate': Math.round(successRate),
      'Projects': stats.totalProjects,
    };
  });

  // Plant productivity
  const plantProductivity = useMemo(() => {
    const productivity: Record<string, { total: number; completed: number; avgDelay: number }> = {};

    filteredProjects.forEach(project => {
      if (!productivity[project.plant]) {
        productivity[project.plant] = { total: 0, completed: 0, avgDelay: 0 };
      }
      productivity[project.plant].total++;
      if (project.status === 'Completed') productivity[project.plant].completed++;

      const metrics = calculateProjectMetrics(project, attendanceRecords);
      productivity[project.plant].avgDelay += metrics.delayPercentage;
    });

    return Object.entries(productivity)
      .map(([plant, data]) => ({
        plant,
        total: data.total,
        completed: data.completed,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        avgDelay: data.total > 0 ? data.avgDelay / data.total : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredProjects, attendanceRecords]);

  // Manager performance
  const managerPerformance = useMemo(() => {
    const performance: Record<string, { total: number; completed: number; onTime: number; avgDelay: number }> = {};

    filteredProjects.forEach(project => {
      const manager = project.responsibleManager;
      if (!performance[manager]) {
        performance[manager] = { total: 0, completed: 0, onTime: 0, avgDelay: 0 };
      }
      performance[manager].total++;
      
      const metrics = calculateProjectMetrics(project, attendanceRecords);
      performance[manager].avgDelay += metrics.delayPercentage;

      if (project.status === 'Completed') {
        performance[manager].completed++;
        if (!metrics.isDelayed) {
          performance[manager].onTime++;
        }
      }
    });

    return Object.entries(performance)
      .map(([manager, data]) => ({
        manager,
        total: data.total,
        completed: data.completed,
        onTimeRate: data.completed > 0 ? (data.onTime / data.completed) * 100 : 0,
        avgDelay: data.total > 0 ? data.avgDelay / data.total : 0,
      }))
      .sort((a, b) => b.onTimeRate - a.onTimeRate);
  }, [filteredProjects, attendanceRecords]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-sm text-gray-600">Comprehensive insights and performance metrics</p>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          plants={PLANTS}
          departments={DEPARTMENTS}
          vendors={vendors}
          showMonth={true}
        />

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Project Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Projects" />
              <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
              <Line yAxisId="left" type="monotone" dataKey="inProgress" stroke="#f97316" strokeWidth={2} name="In Progress" />
              <Line yAxisId="right" type="monotone" dataKey="delayRate" stroke="#ef4444" strokeWidth={2} name="Delay Rate %" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category and Department Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Project Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Department Performance Radar */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Department Success Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="department" fontSize={12} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Success Rate %" dataKey="Success Rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plant Productivity */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Plants by Project Volume</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={plantProductivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plant" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="total" fill="#3b82f6" name="Total Projects" />
              <Bar yAxisId="left" dataKey="completed" fill="#22c55e" name="Completed" />
              <Bar yAxisId="right" dataKey="avgDelay" fill="#ef4444" name="Avg Delay %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Manager Performance */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Manager Performance Scorecard</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Manager</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Total Projects</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">On-Time Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Delay %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {managerPerformance.map((manager, index) => (
                  <tr key={manager.manager} className={index === 0 ? 'bg-green-50' : index === managerPerformance.length - 1 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-green-500 text-white' :
                        index === 1 ? 'bg-blue-500 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{manager.manager}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{manager.total}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{manager.completed}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${
                              manager.onTimeRate >= 80 ? 'bg-green-500' :
                              manager.onTimeRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, manager.onTimeRate)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-12">
                          {manager.onTimeRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${
                        manager.avgDelay < 5 ? 'text-green-600' :
                        manager.avgDelay < 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {manager.avgDelay.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {manager.onTimeRate >= 80 && manager.avgDelay < 5 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Excellent
                        </span>
                      ) : manager.onTimeRate >= 60 && manager.avgDelay < 15 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Good
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Needs Improvement
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Delay Analysis */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Department Delay Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={DEPARTMENTS.map(dept => ({
              department: dept,
              avgDelay: deptStats[dept]?.avgDelayPercentage || 0,
              delayed: deptStats[dept]?.delayedProjects || 0,
              total: deptStats[dept]?.totalProjects || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis label={{ value: 'Avg Delay %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <p className="font-semibold">{data.department}</p>
                        <p className="text-sm">Avg Delay: {data.avgDelay.toFixed(2)}%</p>
                        <p className="text-sm">Delayed Projects: {data.delayed}/{data.total}</p>
                        <p className="text-sm">Success Rate: {data.total > 0 ? (((data.total - data.delayed) / data.total) * 100).toFixed(1) : 0}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgDelay" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
