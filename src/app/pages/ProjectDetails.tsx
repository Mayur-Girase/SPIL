import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import {
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  Package,
  Edit,
  Plus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';
import {
  STATUS_COLORS,
  calculateProjectMetrics,
  formatDate,
  daysBetween,
} from '../utils/calculations';

const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, attendanceRecords, updateProject, addDelayReason } = useData();

  const [showDelayForm, setShowDelayForm] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialDeliveryDate, setMaterialDeliveryDate] = useState('');
  const [actualMaterialDate, setActualMaterialDate] = useState('');

  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  const metrics = calculateProjectMetrics(project, attendanceRecords);
  const projectAttendance = attendanceRecords.filter(a => a.projectId === project.id);

  // Generate timeline data for chart
  const timelineData = useMemo(() => {
    const data = [];
    const startDate = new Date(project.plannedStartDate);
    const endDate = new Date(project.plannedEndDate);
    const today = new Date();
    const totalDays = daysBetween(project.plannedStartDate, project.plannedEndDate);

    // Generate daily data points
    for (let d = new Date(startDate); d <= (project.actualEndDate ? new Date(project.actualEndDate) : today); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayNumber = daysBetween(project.plannedStartDate, dateStr);

      // Planned progress (linear)
      const plannedProgress = totalDays > 0 ? Math.min(100, (dayNumber / totalDays) * 100) : 0;

      // Actual progress based on attendance
      const attendanceUpToDate = attendanceRecords.filter(
        a => a.projectId === project.id && a.date <= dateStr
      );

      let actualProgress = 0;
      if (attendanceUpToDate.length > 0) {
        const avgAttendance = attendanceUpToDate.reduce((sum, a) => sum + a.actualPresent, 0) / attendanceUpToDate.length;
        const efficiency = project.plannedWorkers > 0 ? avgAttendance / project.plannedWorkers : 1;
        actualProgress = Math.min(100, plannedProgress * efficiency);
      }

      // Check if there was a delay reason on this day
      const delayOnDay = project.delayReasons.find(dr => dr.date === dateStr);

      data.push({
        date: dateStr,
        dateLabel: new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        planned: Math.round(plannedProgress * 10) / 10,
        actual: Math.round(actualProgress * 10) / 10,
        hasDelay: !!delayOnDay,
        delayReason: delayOnDay?.reason,
      });
    }

    return data;
  }, [project, attendanceRecords]);

  const handleAddDelayReason = () => {
    if (delayReason.trim()) {
      addDelayReason(project.id, delayReason);
      setDelayReason('');
      setShowDelayForm(false);
    }
  };

  const handleUpdateMaterial = () => {
    updateProject(project.id, {
      materialDeliveryDate: materialDeliveryDate || project.materialDeliveryDate,
      actualMaterialDeliveryDate: actualMaterialDate || project.actualMaterialDeliveryDate,
    });
    setShowMaterialForm(false);
    setMaterialDeliveryDate('');
    setActualMaterialDate('');
  };

  const handleStatusChange = (newStatus: typeof project.status) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'Completed' && !project.actualEndDate) {
      updates.actualEndDate = new Date().toISOString().split('T')[0];
    }
    updateProject(project.id, updates);
  };

  // Custom dot for delay points
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.hasDelay) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={3} fill="#fff" />
        </g>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </button>
          <button
            onClick={() => navigate(`/edit-project/${project.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Project
          </button>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h2>
              <div className="flex flex-wrap gap-3">
                <span
                  className="px-3 py-1 text-sm font-semibold rounded-full text-white"
                  style={{ backgroundColor: STATUS_COLORS[project.status] }}
                >
                  {project.status}
                </span>
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {project.category}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Update Status</p>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as typeof project.status)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Plant</p>
              <p className="text-sm font-semibold text-gray-900">🏭 {project.plant}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Department</p>
              <p className="text-sm font-semibold text-gray-900">🔧 {project.department}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Contractor</p>
              <p className="text-sm font-semibold text-gray-900">👷 {project.vendor}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Responsible Manager</p>
              <p className="text-sm font-semibold text-gray-900">👤 {project.responsibleManager}</p>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Timeline</h3>
            </div>
            <p className="text-xs text-gray-600 mb-1">Planned</p>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {formatDate(project.plannedStartDate)} - {formatDate(project.plannedEndDate)}
            </p>
            <p className="text-xs text-gray-600 mb-1">Forecast End</p>
            <p className="text-sm font-semibold text-blue-600">{formatDate(metrics.forecastEndDate)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Workforce</h3>
            </div>
            <p className="text-xs text-gray-600 mb-1">Average Attendance</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.avgAttendance}</p>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.attendancePercentage}% of {project.plannedWorkers} planned
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Progress</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{metrics.progressPercentage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-green-500"
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>
          </div>

          <div className={`rounded-lg shadow-md border p-6 ${metrics.isDelayed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metrics.isDelayed ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${metrics.isDelayed ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Delay Status</h3>
            </div>
            <p className={`text-2xl font-bold ${metrics.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.delayPercentage}%
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.isDelayed ? `${metrics.delayDays} days behind` : 'On schedule'}
            </p>
          </div>
        </div>

        {/* Material Delivery */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Material Delivery</h3>
            </div>
            <button
              onClick={() => setShowMaterialForm(!showMaterialForm)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {project.materialDeliveryDate ? 'Update' : 'Add'} Material Info
            </button>
          </div>

          {showMaterialForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Delivery Date
                  </label>
                  <input
                    type="date"
                    value={materialDeliveryDate || project.materialDeliveryDate || ''}
                    onChange={(e) => setMaterialDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Delivery Date
                  </label>
                  <input
                    type="date"
                    value={actualMaterialDate || project.actualMaterialDeliveryDate || ''}
                    onChange={(e) => setActualMaterialDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleUpdateMaterial}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowMaterialForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {project.materialDeliveryDate && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Planned Delivery</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(project.materialDeliveryDate)}
                </p>
              </div>
              {project.actualMaterialDeliveryDate && (
                <>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Actual Delivery</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(project.actualMaterialDeliveryDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Material Delay</p>
                    <p className={`text-sm font-semibold ${metrics.materialDelayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {metrics.materialDelayDays > 0 ? `${metrics.materialDelayDays} days (${metrics.materialDelayPercentage}%)` : 'On Time'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Progress Timeline Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Project Progress Timeline</h3>
          <p className="text-sm text-gray-600 mb-4">
            Blue line shows planned progress. Orange line shows actual progress based on workforce attendance.
            Red dots indicate days with reported delays.
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
                interval={Math.floor(timelineData.length / 15)}
              />
              <YAxis label={{ value: 'Progress %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm">{formatDate(data.date)}</p>
                        <p className="text-sm text-blue-600">Planned: {data.planned}%</p>
                        <p className="text-sm text-orange-600">Actual: {data.actual}%</p>
                        {data.hasDelay && (
                          <p className="text-sm text-red-600 mt-1">⚠️ {data.delayReason}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="3 3" label="Target" />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Planned Progress"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#f97316"
                strokeWidth={2}
                name="Actual Progress"
                dot={<CustomDot />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Delay Reasons */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Delay Reasons</h3>
            <button
              onClick={() => setShowDelayForm(!showDelayForm)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <Plus className="w-4 h-4" />
              Add Delay Reason
            </button>
          </div>

          {showDelayForm && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the reason for delay
              </label>
              <textarea
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                rows={3}
                placeholder="E.g., Material shortage, weather conditions, equipment failure..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddDelayReason}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Add Reason
                </button>
                <button
                  onClick={() => {
                    setShowDelayForm(false);
                    setDelayReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {project.delayReasons.length === 0 ? (
              <p className="text-sm text-gray-600">No delay reasons reported yet.</p>
            ) : (
              project.delayReasons.map((delay, idx) => (
                <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">{formatDate(delay.date)}</p>
                      <p className="text-sm text-gray-900">{delay.reason}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Attendance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Committed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projectAttendance.slice(-10).reverse().map((att) => {
                  const percentage = (att.actualPresent / att.committedWorkers) * 100;
                  return (
                    <tr key={att.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(att.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{att.committedWorkers}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{att.actualPresent}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${percentage >= 90 ? 'text-green-600' : percentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {percentage.toFixed(1)}%
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

export default ProjectDetails;
