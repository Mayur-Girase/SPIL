import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { ArrowLeft, Save } from 'lucide-react';
import { PLANTS, DEPARTMENTS, MANAGERS } from '../utils/calculations';

const EditProject: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, contractors } = useData();

  const project = projects.find(p => p.id === id);

  const [formData, setFormData] = useState({
    name: '',
    plant: '',
    department: '',
    category: 'Minor' as 'Minor' | 'Major' | 'Critical',
    status: 'Not Started' as 'In Progress' | 'On Hold' | 'Not Started' | 'Completed',
    responsibleManager: '',
    vendor: '',
    plannedStartDate: '',
    plannedEndDate: '',
    plannedWorkers: '',
    actualEndDate: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        plant: project.plant,
        department: project.department,
        category: project.category,
        status: project.status,
        responsibleManager: project.responsibleManager,
        vendor: project.vendor,
        plannedStartDate: project.plannedStartDate,
        plannedEndDate: project.plannedEndDate,
        plannedWorkers: project.plannedWorkers.toString(),
        actualEndDate: project.actualEndDate || '',
      });
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // Validate dates
    if (new Date(formData.plannedStartDate) >= new Date(formData.plannedEndDate)) {
      alert('End date must be after start date');
      return;
    }

    updateProject(id, {
      ...formData,
      plannedWorkers: parseInt(formData.plannedWorkers),
      actualEndDate: formData.actualEndDate || undefined,
    });

    navigate(`/project/${id}`);
  };

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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/project/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Project Details
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Enter project name"
              />
            </div>

            {/* Grid for Plant, Department, Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plant *
                </label>
                <select
                  name="plant"
                  value={formData.plant}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select plant...</option>
                  {PLANTS.map(plant => (
                    <option key={plant} value={plant}>{plant}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Manager and Vendor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsible Manager *
                </label>
                <select
                  name="responsibleManager"
                  value={formData.responsibleManager}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select manager...</option>
                  {MANAGERS.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Contractor *
                </label>
                <select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select vendor...</option>
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.name}>{contractor.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates and Workers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Start Date *
                </label>
                <input
                  type="date"
                  name="plannedStartDate"
                  value={formData.plannedStartDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned End Date *
                </label>
                <input
                  type="date"
                  name="plannedEndDate"
                  value={formData.plannedEndDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Workers *
                </label>
                <input
                  type="number"
                  name="plannedWorkers"
                  value={formData.plannedWorkers}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Number of workers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual End Date {formData.status === 'Completed' && '*'}
                </label>
                <input
                  type="date"
                  name="actualEndDate"
                  value={formData.actualEndDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={formData.status === 'Completed'}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => navigate(`/project/${id}`)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProject;
