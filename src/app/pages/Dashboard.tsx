import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import { useData } from '../context/DataContext';
import {
  FolderKanban,
  PlayCircle,
  PauseCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
} from 'lucide-react';
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
} from 'recharts';
import {
  PLANTS,
  DEPARTMENTS,
  STATUS_COLORS,
  calculateProjectMetrics,
  calculateContractorPerformance,
  getDepartmentDelayStats,
  getPerformers,
} from '../utils/calculations';

const Dashboard: React.FC = () => {
  const { projects, contractors, attendanceRecords } = useData();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<{
    plant?: string;
    department?: string;
    status?: string;
    vendor?: string;
    month?: string;
  }>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Get unique vendors
  const vendors = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.vendor)));
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (filters.plant && project.plant !== filters.plant) return false;
      if (filters.department && project.department !== filters.department) return false;
      if (filters.status && project.status !== filters.status) return false;
      if (filters.vendor && project.vendor !== filters.vendor) return false;
      if (filters.month) {
        const projectMonth = project.plannedStartDate.substring(0, 7);
        if (projectMonth !== filters.month) return false;
      }
      return true;
    });
  }, [projects, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const inProgress = filteredProjects.filter(p => p.status === 'In Progress').length;
    const onHold = filteredProjects.filter(p => p.status === 'On Hold').length;
    const notStarted = filteredProjects.filter(p => p.status === 'Not Started').length;
    const completed = filteredProjects.filter(p => p.status === 'Completed').length;

    const delayedProjects = filteredProjects.filter(p => {
      const metrics = calculateProjectMetrics(p, attendanceRecords);
      return metrics.isDelayed;
    }).length;

    const avgDelay = filteredProjects.reduce((sum, p) => {
      const metrics = calculateProjectMetrics(p, attendanceRecords);
      return sum + metrics.delayPercentage;
    }, 0) / (filteredProjects.length || 1);

    return {
      total: filteredProjects.length,
      inProgress,
      onHold,
      notStarted,
      completed,
      delayed: delayedProjects,
      avgDelay: Math.round(avgDelay * 10) / 10,
    };
  }, [filteredProjects, attendanceRecords]);

  // Get best and worst performers
  const performers = useMemo(() => {
    return getPerformers(vendors, projects, attendanceRecords, filters.month);
  }, [vendors, projects, attendanceRecords, filters.month]);

  // Department delay stats
  const deptDelayStats = useMemo(() => {
    return getDepartmentDelayStats(filteredProjects, attendanceRecords);
  }, [filteredProjects, attendanceRecords]);

  // Chart data for department delays
  const deptDelayChartData = useMemo(() => {
    return DEPARTMENTS.map(dept => ({
      department: dept,
      avgDelay: deptDelayStats[dept]?.avgDelayPercentage || 0,
      delayed: deptDelayStats[dept]?.delayedProjects || 0,
      total: deptDelayStats[dept]?.totalProjects || 0,
    }));
  }, [deptDelayStats]);

  // Status distribution data
  const statusData = [
    { name: 'In Progress', value: kpis.inProgress, color: STATUS_COLORS['In Progress'] },
    { name: 'On Hold', value: kpis.onHold, color: STATUS_COLORS['On Hold'] },
    { name: 'Not Started', value: kpis.notStarted, color: STATUS_COLORS['Not Started'] },
    { name: 'Completed', value: kpis.completed, color: STATUS_COLORS['Completed'] },
  ];

  // Plant distribution
  const plantData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      counts[p.plant] = (counts[p.plant] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([plant, count]) => ({ plant, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredProjects]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Dashboard</h2>
          <p className="text-sm text-gray-600">Real-time project monitoring and analytics</p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Projects"
            value={kpis.total}
            icon={FolderKanban}
            color="#3b82f6"
            subtitle={`Across ${PLANTS.length} plants`}
          />
          <KPICard
            title="In Progress"
            value={kpis.inProgress}
            icon={PlayCircle}
            color={STATUS_COLORS['In Progress']}
            subtitle="Active projects"
            onClick={() => navigate('/projects?status=In Progress')}
          />
          <KPICard
            title="On Hold"
            value={kpis.onHold}
            icon={PauseCircle}
            color={STATUS_COLORS['On Hold']}
            subtitle="Needs attention"
            onClick={() => navigate('/projects?status=On Hold')}
          />
          <KPICard
            title="Completed"
            value={kpis.completed}
            icon={CheckCircle}
            color={STATUS_COLORS['Completed']}
            subtitle="Successfully finished"
            onClick={() => navigate('/projects?status=Completed')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Not Started"
            value={kpis.notStarted}
            icon={Clock}
            color={STATUS_COLORS['Not Started']}
            subtitle="Scheduled projects"
          />
          <KPICard
            title="Delayed Projects"
            value={kpis.delayed}
            icon={AlertTriangle}
            color="#ef4444"
            subtitle={`${((kpis.delayed / (kpis.total || 1)) * 100).toFixed(1)}% of total`}
          />
          <KPICard
            title="Average Delay"
            value={`${kpis.avgDelay}%`}
            icon={TrendingDown}
            color="#f59e0b"
            subtitle="Across all projects"
          />
          <KPICard
            title="Active Contractors"
            value={vendors.length}
            icon={Award}
            color="#8b5cf6"
            subtitle="Working vendors"
            onClick={() => navigate('/contractors')}
          />
        </div>

        {/* Best & Worst Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {performers.best && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Best Performer</h3>
                  <p className="text-sm text-gray-600">Top contractor this period</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-900">{performers.best.contractor}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Performance Score</p>
                    <p className="text-lg font-semibold text-green-600">{performers.best.performanceScore}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Attendance</p>
                    <p className="text-lg font-semibold text-green-600">{performers.best.avgAttendanceRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">On-Time Completion</p>
                    <p className="text-lg font-semibold text-green-600">{performers.best.onTimeCompletionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Projects</p>
                    <p className="text-lg font-semibold text-green-600">{performers.best.totalProjects}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {performers.worst && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-md border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Needs Improvement</h3>
                  <p className="text-sm text-gray-600">Contractor requiring attention</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-900">{performers.worst.contractor}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Performance Score</p>
                    <p className="text-lg font-semibold text-red-600">{performers.worst.performanceScore}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Attendance</p>
                    <p className="text-lg font-semibold text-red-600">{performers.worst.avgAttendanceRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">On-Time Completion</p>
                    <p className="text-lg font-semibold text-red-600">{performers.worst.onTimeCompletionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Projects</p>
                    <p className="text-lg font-semibold text-red-600">{performers.worst.totalProjects}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Distribution */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Project Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Plant Distribution */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Plants by Projects</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={plantData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plant" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Delay Analysis */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Department-wise Average Delay %</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={deptDelayChartData}>
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
                        <p className="text-sm">Delayed: {data.delayed}/{data.total}</p>
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

        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Projects</h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Plant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Delay %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.slice(0, 5).map((project) => {
                  const metrics = calculateProjectMetrics(project, attendanceRecords);
                  return (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.plant}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.department}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: STATUS_COLORS[project.status] }}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${metrics.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs">{metrics.progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${metrics.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
                          {metrics.delayPercentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
