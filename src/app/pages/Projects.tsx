import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Layout from '../components/Layout';
import FilterBar from '../components/FilterBar';
import { useData } from '../context/DataContext';
import { Edit, Trash2, Eye, Calendar, Users, TrendingUp } from 'lucide-react';
import {
  PLANTS,
  DEPARTMENTS,
  STATUS_COLORS,
  calculateProjectMetrics,
  formatDate,
} from '../utils/calculations';

const Projects: React.FC = () => {
  const { projects, attendanceRecords, deleteProject } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<{
    plant?: string;
    department?: string;
    status?: string;
    vendor?: string;
    category?: string;
  }>({
    status: searchParams.get('status') || '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Get unique vendors
  const vendors = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.vendor)));
  }, [projects]);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Filter conditions
      if (filters.plant && project.plant !== filters.plant) return false;
      if (filters.department && project.department !== filters.department) return false;
      if (filters.status && project.status !== filters.status) return false;
      if (filters.vendor && project.vendor !== filters.vendor) return false;
      if (filters.category && project.category !== filters.category) return false;

      // Search condition
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(search) ||
          project.plant.toLowerCase().includes(search) ||
          project.department.toLowerCase().includes(search) ||
          project.vendor.toLowerCase().includes(search) ||
          project.responsibleManager.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [projects, filters, searchTerm]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-sm text-gray-600">Manage all pharmaceutical plant projects</p>
          </div>
          <button
            onClick={() => navigate('/add-project')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            + Add New Project
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search projects by name, plant, department, vendor, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          plants={PLANTS}
          departments={DEPARTMENTS}
          vendors={vendors}
        />

        {/* Projects Grid */}
        <div className="grid gap-6">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No projects found matching your criteria.</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const metrics = calculateProjectMetrics(project, attendanceRecords);
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                          <span
                            className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: STATUS_COLORS[project.status] }}
                          >
                            {project.status}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {project.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>🏭 {project.plant}</span>
                          <span>🔧 {project.department}</span>
                          <span>👷 {project.vendor}</span>
                          <span>👤 {project.responsibleManager}</span>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/edit-project/${project.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(project.id, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <p className="text-xs font-medium text-gray-600">Timeline</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(project.plannedStartDate)} - {formatDate(project.plannedEndDate)}
                        </p>
                        <p className="text-xs text-gray-600">{metrics.totalPlannedDays} days</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-gray-600" />
                          <p className="text-xs font-medium text-gray-600">Workforce</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {metrics.avgAttendance} / {project.plannedWorkers}
                        </p>
                        <p className="text-xs text-gray-600">{metrics.attendancePercentage}% attendance</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                          <p className="text-xs font-medium text-gray-600">Progress</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{metrics.progressPercentage}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${metrics.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className={`rounded-lg p-3 ${metrics.isDelayed ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-xs font-medium text-gray-600 mb-1">Delay Status</p>
                        <p className={`text-sm font-semibold ${metrics.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
                          {metrics.isDelayed ? `${metrics.delayPercentage}% Delayed` : 'On Track'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {metrics.isDelayed ? `${metrics.delayDays} days` : 'No delay'}
                        </p>
                      </div>
                    </div>

                    {/* Forecast */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-600">Forecast Completion: </span>
                          <span className="font-semibold text-gray-900">{formatDate(metrics.forecastEndDate)}</span>
                        </div>
                        {project.actualEndDate && (
                          <div>
                            <span className="text-gray-600">Actual Completion: </span>
                            <span className="font-semibold text-gray-900">{formatDate(project.actualEndDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delay Reasons */}
                    {project.delayReasons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Recent Delays:</p>
                        <div className="flex flex-wrap gap-2">
                          {project.delayReasons.slice(-3).map((delay, idx) => (
                            <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                              <p className="text-xs text-yellow-800">
                                {formatDate(delay.date)}: {delay.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
