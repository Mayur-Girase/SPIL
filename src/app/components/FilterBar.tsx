import React from 'react';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  filters: {
    plant?: string;
    department?: string;
    status?: string;
    vendor?: string;
    month?: string;
    category?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  plants: string[];
  departments: string[];
  vendors: string[];
  statuses?: string[];
  categories?: string[];
  showMonth?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  plants,
  departments,
  vendors,
  statuses = ['In Progress', 'On Hold', 'Not Started', 'Completed'],
  categories = ['Minor', 'Major', 'Critical'],
  showMonth = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {showMonth && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={filters.month || ''}
              onChange={(e) => onFilterChange('month', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Plant</label>
          <select
            value={filters.plant || ''}
            onChange={(e) => onFilterChange('plant', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Plants</option>
            {plants.map(plant => (
              <option key={plant} value={plant}>{plant}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
          <select
            value={filters.department || ''}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vendor</label>
          <select
            value={filters.vendor || ''}
            onChange={(e) => onFilterChange('vendor', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      {(filters.plant || filters.department || filters.status || filters.vendor || filters.category || filters.month) && (
        <button
          onClick={() => {
            Object.keys(filters).forEach(key => onFilterChange(key, ''));
          }}
          className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default FilterBar;
