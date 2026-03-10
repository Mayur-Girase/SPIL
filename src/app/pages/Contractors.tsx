import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { Plus, Users, Award, TrendingUp } from 'lucide-react';
import { calculateContractorPerformance } from '../utils/calculations';

const Contractors: React.FC = () => {
  const { contractors, addContractor, projects, attendanceRecords } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalWorkers: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if contractor already exists
    if (contractors.find(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      alert('A contractor with this name already exists!');
      return;
    }

    addContractor({
      name: formData.name,
      totalWorkers: parseInt(formData.totalWorkers),
    });

    setFormData({ name: '', totalWorkers: '' });
    setShowAddForm(false);
  };

  // Calculate performance for all contractors
  const contractorPerformances = useMemo(() => {
    return contractors.map(contractor => {
      const performance = calculateContractorPerformance(contractor.name, projects, attendanceRecords);
      return {
        ...contractor,
        ...performance,
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
  }, [contractors, projects, attendanceRecords]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contractors Management</h2>
            <p className="text-sm text-gray-600">Manage vendors and track their performance</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Contractor
          </button>
        </div>

        {/* Add Contractor Form */}
        {showAddForm && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Contractor</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contractor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Enter contractor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Workers *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalWorkers}
                    onChange={(e) => setFormData({ ...formData, totalWorkers: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Number of workers"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Contractor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', totalWorkers: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contractors List */}
        <div className="grid gap-6">
          {contractorPerformances.map((contractor, index) => {
            const rankColor = index === 0 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300' :
                             index === contractorPerformances.length - 1 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
                             'bg-white border-gray-200';

            return (
              <div
                key={contractor.id}
                className={`rounded-lg shadow-md border p-6 ${rankColor}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === contractorPerformances.length - 1 ? 'bg-red-400 text-red-900' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{contractor.name}</h3>
                      <p className="text-sm text-gray-600">{contractor.totalWorkers} total workers</p>
                      {index === 0 && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-900">
                          <Award className="w-3 h-3" />
                          Top Performer
                        </span>
                      )}
                      {index === contractorPerformances.length - 1 && contractor.performanceScore < 70 && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-900">
                          Needs Improvement
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Performance Score */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Performance Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${
                        contractor.performanceScore >= 90 ? 'text-green-600' :
                        contractor.performanceScore >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {contractor.performanceScore}
                      </span>
                      <span className="text-lg text-gray-600">/ 100</span>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          contractor.performanceScore >= 90 ? 'bg-green-500' :
                          contractor.performanceScore >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${contractor.performanceScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-medium text-gray-600">Avg Attendance</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{contractor.avgAttendanceRate}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${contractor.avgAttendanceRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-medium text-gray-600">On-Time Completion</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{contractor.onTimeCompletionRate}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${contractor.onTimeCompletionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{contractor.totalProjects}</p>
                    <p className="text-xs text-gray-600 mt-1">Assigned</p>
                  </div>

                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{contractor.completedProjects}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {contractor.totalProjects > 0 ? ((contractor.completedProjects / contractor.totalProjects) * 100).toFixed(0) : 0}% completion
                    </p>
                  </div>
                </div>

                {/* Projects List */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Active Projects:</p>
                  <div className="flex flex-wrap gap-2">
                    {projects.filter(p => p.vendor === contractor.name && p.status !== 'Completed').map(project => (
                      <span
                        key={project.id}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                      >
                        {project.name} ({project.plant})
                      </span>
                    ))}
                    {projects.filter(p => p.vendor === contractor.name && p.status !== 'Completed').length === 0 && (
                      <span className="text-xs text-gray-600">No active projects</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {contractors.length === 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No contractors added yet</p>
            <p className="text-sm text-gray-500">Click "Add Contractor" to get started</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Contractors;
