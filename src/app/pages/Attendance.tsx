import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { Calendar, Users, Plus, Check, X } from 'lucide-react';
import { formatDate } from '../utils/calculations';

const Attendance: React.FC = () => {
  const { projects, attendanceRecords, addAttendance } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    committedWorkers: '',
    actualPresent: '',
  });

  // Get active projects (not completed)
  const activeProjects = projects.filter(p => p.status !== 'Completed');

  // Get attendance for selected date
  const todayAttendance = useMemo(() => {
    return attendanceRecords.filter(a => a.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  // Get all attendance records grouped by project
  const attendanceByProject = useMemo(() => {
    const grouped: Record<string, typeof attendanceRecords> = {};
    attendanceRecords.forEach(record => {
      if (!grouped[record.projectId]) {
        grouped[record.projectId] = [];
      }
      grouped[record.projectId].push(record);
    });
    return grouped;
  }, [attendanceRecords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    // Check if attendance already exists for this project and date
    const existing = attendanceRecords.find(
      a => a.projectId === selectedProject && a.date === selectedDate
    );

    if (existing) {
      alert('Attendance already marked for this project on this date!');
      return;
    }

    addAttendance({
      projectId: selectedProject,
      vendor: project.vendor,
      date: selectedDate,
      committedWorkers: parseInt(formData.committedWorkers),
      actualPresent: parseInt(formData.actualPresent),
    });

    setFormData({ committedWorkers: '', actualPresent: '' });
    setSelectedProject('');
    setShowAddForm(false);
  };

  const getAttendanceStats = (projectId: string) => {
    const records = attendanceByProject[projectId] || [];
    if (records.length === 0) return null;

    const avgCommitted = records.reduce((sum, r) => sum + r.committedWorkers, 0) / records.length;
    const avgPresent = records.reduce((sum, r) => sum + r.actualPresent, 0) / records.length;
    const avgPercentage = (avgPresent / avgCommitted) * 100;

    return {
      totalDays: records.length,
      avgCommitted: Math.round(avgCommitted * 10) / 10,
      avgPresent: Math.round(avgPresent * 10) / 10,
      avgPercentage: Math.round(avgPercentage * 10) / 10,
    };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-gray-600">Track daily worker attendance for all projects</p>
        </div>

        {/* Date Selector and Add Button */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Select Date:</label>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-600">
                {todayAttendance.length} attendance records on {formatDate(selectedDate)}
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Mark Attendance
            </button>
          </div>
        </div>

        {/* Add Attendance Form */}
        {showAddForm && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Attendance Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Project *
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      const project = projects.find(p => p.id === e.target.value);
                      if (project) {
                        setFormData(prev => ({ ...prev, committedWorkers: project.plannedWorkers.toString() }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a project...</option>
                    {activeProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.plant} - {project.vendor})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Committed Workers *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.committedWorkers}
                    onChange={(e) => setFormData({ ...formData, committedWorkers: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Present *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.actualPresent}
                    onChange={(e) => setFormData({ ...formData, actualPresent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Check className="w-4 h-4" />
                  Save Attendance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedProject('');
                    setFormData({ committedWorkers: '', actualPresent: '' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Today's Attendance */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Attendance for {formatDate(selectedDate)}
          </h3>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No attendance records for this date</p>
              <p className="text-sm mt-1">Click "Mark Attendance" to add records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Plant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Committed</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Present</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Attendance %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayAttendance.map((record) => {
                    const project = projects.find(p => p.id === record.projectId);
                    const percentage = (record.actualPresent / record.committedWorkers) * 100;
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {project?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{project?.plant}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.vendor}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.committedWorkers}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {record.actualPresent}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  percentage >= 90 ? 'bg-green-500' :
                                  percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${
                              percentage >= 90 ? 'text-green-600' :
                              percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {percentage >= 90 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Excellent
                            </span>
                          ) : percentage >= 70 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Good
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Poor
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project-wise Attendance Summary */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Attendance Summary by Project</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Plant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Days Tracked</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Committed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Present</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeProjects.map((project) => {
                  const stats = getAttendanceStats(project.id);
                  if (!stats) return null;

                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.plant}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.vendor}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{stats.totalDays}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{stats.avgCommitted}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{stats.avgPresent}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                stats.avgPercentage >= 90 ? 'bg-green-500' :
                                stats.avgPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, stats.avgPercentage)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold ${
                            stats.avgPercentage >= 90 ? 'text-green-600' :
                            stats.avgPercentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {stats.avgPercentage}%
                          </span>
                        </div>
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

export default Attendance;
