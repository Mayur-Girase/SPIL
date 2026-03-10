import { Project, AttendanceRecord } from '../context/DataContext';

export const PLANTS = [
  'MP01', 'MP02', 'MP03', 'MP04', 'MP05', 'MP06', 'MP07', 'MP9A', 'MP08', 'MP09',
  'MP10', 'MP11', 'MP12', 'MP14', 'MP14A', 'MP15', 'Hydrogenator-1', 'Hydrogenator-2',
  'ETP', 'Pilot Plant', 'QA', 'QC', 'Warehouse', 'Workshop', 'Utility-1', 'Utility-2',
  'Canteen', 'Main Gate', 'Rear Gate', 'Plantation Area', 'Boiler'
];

export const DEPARTMENTS = ['Mechanical', 'Electrical', 'Civil', 'Instrumentation', 'Utility', 'HVAC'];

export const MANAGERS = [
  'Piyush Vyas', 'Abhinav Vikash', 'Prashant Sharma', 'Ravinder Singh',
  'Amar Kushwaha', 'Vaibhav Deshpande', 'Rahul Sharma', 'Rakesh Verma'
];

export const STATUS_COLORS = {
  'In Progress': '#f97316', // Orange
  'On Hold': '#ef4444',     // Red
  'Not Started': '#ec4899', // Pink
  'Completed': '#22c55e',   // Green
};

// Calculate days between two dates
export const daysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate project metrics
export const calculateProjectMetrics = (
  project: Project,
  attendanceRecords: AttendanceRecord[]
) => {
  const today = new Date().toISOString().split('T')[0];
  const plannedStartDate = new Date(project.plannedStartDate);
  const plannedEndDate = new Date(project.plannedEndDate);
  const currentDate = new Date(today);

  // Total planned days
  const totalPlannedDays = daysBetween(project.plannedStartDate, project.plannedEndDate);

  // Days elapsed
  const daysElapsed = Math.max(0, daysBetween(project.plannedStartDate, today));

  // Get attendance for this project
  const projectAttendance = attendanceRecords.filter(a => a.projectId === project.id);

  // Calculate average attendance
  const avgAttendance = projectAttendance.length > 0
    ? projectAttendance.reduce((sum, a) => sum + a.actualPresent, 0) / projectAttendance.length
    : project.plannedWorkers;

  // Calculate attendance percentage
  const attendancePercentage = project.plannedWorkers > 0
    ? (avgAttendance / project.plannedWorkers) * 100
    : 100;

  // Calculate work efficiency based on attendance
  const workEfficiency = attendancePercentage / 100;

  // For completed projects
  if (project.status === 'Completed' && project.actualEndDate) {
    const actualDays = daysBetween(project.plannedStartDate, project.actualEndDate);
    const delayDays = actualDays - totalPlannedDays;
    const delayPercentage = totalPlannedDays > 0 ? (delayDays / totalPlannedDays) * 100 : 0;
    
    return {
      totalPlannedDays,
      daysElapsed: actualDays,
      delayDays: Math.max(0, delayDays),
      delayPercentage: Math.max(0, delayPercentage),
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      forecastEndDate: project.actualEndDate,
      isDelayed: delayDays > 0,
      progressPercentage: 100,
    };
  }

  // For not started projects
  if (project.status === 'Not Started') {
    return {
      totalPlannedDays,
      daysElapsed: 0,
      delayDays: 0,
      delayPercentage: 0,
      avgAttendance: 0,
      attendancePercentage: 0,
      forecastEndDate: project.plannedEndDate,
      isDelayed: false,
      progressPercentage: 0,
    };
  }

  // For in-progress and on-hold projects
  // Calculate expected progress
  const expectedProgressPercentage = totalPlannedDays > 0
    ? Math.min(100, (daysElapsed / totalPlannedDays) * 100)
    : 0;

  // Actual progress considering work efficiency
  const actualProgressPercentage = Math.min(100, expectedProgressPercentage * workEfficiency);

  // Calculate remaining work
  const remainingWork = 100 - actualProgressPercentage;

  // Estimate remaining days needed (considering current efficiency)
  const remainingDaysNeeded = workEfficiency > 0
    ? remainingWork / (100 / totalPlannedDays) / workEfficiency
    : totalPlannedDays * 2; // If no work is being done, double the time

  // Forecast end date
  const forecastEndDateObj = new Date(currentDate);
  forecastEndDateObj.setDate(forecastEndDateObj.getDate() + Math.ceil(remainingDaysNeeded));
  const forecastEndDate = forecastEndDateObj.toISOString().split('T')[0];

  // Calculate delay
  const forecastDelayDays = daysBetween(project.plannedEndDate, forecastEndDate);
  const delayDays = Math.max(0, forecastDelayDays);
  const delayPercentage = totalPlannedDays > 0 ? (delayDays / totalPlannedDays) * 100 : 0;

  // Material delay
  let materialDelayDays = 0;
  let materialDelayPercentage = 0;
  if (project.materialDeliveryDate && project.actualMaterialDeliveryDate) {
    materialDelayDays = Math.max(0, daysBetween(project.materialDeliveryDate, project.actualMaterialDeliveryDate));
    materialDelayPercentage = materialDelayDays > 0 ? (materialDelayDays / totalPlannedDays) * 100 : 0;
  } else if (project.materialDeliveryDate && !project.actualMaterialDeliveryDate) {
    const materialExpectedDate = new Date(project.materialDeliveryDate);
    if (currentDate > materialExpectedDate) {
      materialDelayDays = daysBetween(project.materialDeliveryDate, today);
      materialDelayPercentage = (materialDelayDays / totalPlannedDays) * 100;
    }
  }

  return {
    totalPlannedDays,
    daysElapsed,
    delayDays,
    delayPercentage: Math.round(delayPercentage * 10) / 10,
    avgAttendance: Math.round(avgAttendance * 10) / 10,
    attendancePercentage: Math.round(attendancePercentage * 10) / 10,
    forecastEndDate,
    isDelayed: delayDays > 0,
    progressPercentage: Math.round(actualProgressPercentage * 10) / 10,
    materialDelayDays,
    materialDelayPercentage: Math.round(materialDelayPercentage * 10) / 10,
  };
};

// Calculate contractor performance
export const calculateContractorPerformance = (
  contractorName: string,
  projects: Project[],
  attendanceRecords: AttendanceRecord[]
) => {
  const contractorProjects = projects.filter(p => p.vendor === contractorName);
  const contractorAttendance = attendanceRecords.filter(a => a.vendor === contractorName);

  if (contractorAttendance.length === 0) {
    return {
      avgAttendanceRate: 0,
      onTimeCompletionRate: 0,
      totalProjects: contractorProjects.length,
      completedProjects: contractorProjects.filter(p => p.status === 'Completed').length,
      performanceScore: 0,
    };
  }

  // Average attendance rate
  const avgAttendanceRate = contractorAttendance.reduce((sum, a) => {
    return sum + (a.actualPresent / a.committedWorkers) * 100;
  }, 0) / contractorAttendance.length;

  // On-time completion rate
  const completedProjects = contractorProjects.filter(p => p.status === 'Completed');
  const onTimeCompletions = completedProjects.filter(p => {
    if (p.actualEndDate) {
      return new Date(p.actualEndDate) <= new Date(p.plannedEndDate);
    }
    return false;
  }).length;

  const onTimeCompletionRate = completedProjects.length > 0
    ? (onTimeCompletions / completedProjects.length) * 100
    : 0;

  // Overall performance score (weighted average)
  const performanceScore = (avgAttendanceRate * 0.6) + (onTimeCompletionRate * 0.4);

  return {
    avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
    onTimeCompletionRate: Math.round(onTimeCompletionRate * 10) / 10,
    totalProjects: contractorProjects.length,
    completedProjects: completedProjects.length,
    performanceScore: Math.round(performanceScore * 10) / 10,
  };
};

// Get best and worst performers for a given month
export const getPerformers = (
  contractors: string[],
  projects: Project[],
  attendanceRecords: AttendanceRecord[],
  month?: string
) => {
  // Filter by month if provided
  let filteredAttendance = attendanceRecords;
  if (month) {
    filteredAttendance = attendanceRecords.filter(a => a.date.startsWith(month));
  }

  const performances = contractors.map(contractor => {
    const perf = calculateContractorPerformance(contractor, projects, filteredAttendance);
    return { contractor, ...perf };
  });

  const sorted = performances.sort((a, b) => b.performanceScore - a.performanceScore);

  return {
    best: sorted[0] || null,
    worst: sorted[sorted.length - 1] || null,
  };
};

// Calculate department-wise delay statistics
export const getDepartmentDelayStats = (
  projects: Project[],
  attendanceRecords: AttendanceRecord[]
) => {
  const stats: Record<string, { totalProjects: number; delayedProjects: number; avgDelayPercentage: number }> = {};

  DEPARTMENTS.forEach(dept => {
    const deptProjects = projects.filter(p => p.department === dept);
    const delayedProjects = deptProjects.filter(p => {
      const metrics = calculateProjectMetrics(p, attendanceRecords);
      return metrics.isDelayed;
    });

    const totalDelayPercentage = deptProjects.reduce((sum, p) => {
      const metrics = calculateProjectMetrics(p, attendanceRecords);
      return sum + metrics.delayPercentage;
    }, 0);

    stats[dept] = {
      totalProjects: deptProjects.length,
      delayedProjects: delayedProjects.length,
      avgDelayPercentage: deptProjects.length > 0 ? totalDelayPercentage / deptProjects.length : 0,
    };
  });

  return stats;
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Get month name from date string
export const getMonthYear = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
