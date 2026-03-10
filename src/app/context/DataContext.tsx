import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  plant: string;
  department: string;
  category: 'Minor' | 'Major' | 'Critical';
  status: 'In Progress' | 'On Hold' | 'Not Started' | 'Completed';
  responsibleManager: string;
  vendor: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  plannedWorkers: number;
  materialDeliveryDate?: string;
  actualMaterialDeliveryDate?: string;
  delayReasons: { date: string; reason: string }[];
  createdAt: string;
}

export interface Contractor {
  id: string;
  name: string;
  totalWorkers: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  projectId: string;
  vendor: string;
  date: string;
  committedWorkers: number;
  actualPresent: number;
  createdAt: string;
}

interface DataContextType {
  projects: Project[];
  contractors: Contractor[];
  attendanceRecords: AttendanceRecord[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'delayReasons'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addContractor: (contractor: Omit<Contractor, 'id' | 'createdAt'>) => void;
  updateContractor: (id: string, contractor: Partial<Contractor>) => void;
  addAttendance: (attendance: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  updateAttendance: (id: string, attendance: Partial<AttendanceRecord>) => void;
  addDelayReason: (projectId: string, reason: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'pharma_projects',
  CONTRACTORS: 'pharma_contractors',
  ATTENDANCE: 'pharma_attendance',
};

// Sample initial data
const getInitialProjects = (): Project[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (stored) return JSON.parse(stored);
  
  return [
    {
      id: '1',
      name: 'HVAC System Upgrade',
      plant: 'MP01',
      department: 'HVAC',
      category: 'Major',
      status: 'In Progress',
      responsibleManager: 'Piyush Vyas',
      vendor: 'Engg Associates',
      plannedStartDate: '2026-02-01',
      plannedEndDate: '2026-03-15',
      plannedWorkers: 10,
      delayReasons: [],
      createdAt: '2026-02-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Electrical Panel Installation',
      plant: 'MP02',
      department: 'Electrical',
      category: 'Critical',
      status: 'In Progress',
      responsibleManager: 'Abhinav Vikash',
      vendor: 'Power Systems Ltd',
      plannedStartDate: '2026-02-10',
      plannedEndDate: '2026-03-20',
      plannedWorkers: 8,
      materialDeliveryDate: '2026-02-15',
      delayReasons: [],
      createdAt: '2026-02-10T00:00:00Z',
    },
    {
      id: '3',
      name: 'Boiler Maintenance',
      plant: 'Boiler',
      department: 'Mechanical',
      category: 'Major',
      status: 'On Hold',
      responsibleManager: 'Prashant Sharma',
      vendor: 'Mech Solutions',
      plannedStartDate: '2026-01-15',
      plannedEndDate: '2026-02-28',
      plannedWorkers: 12,
      delayReasons: [{ date: '2026-02-20', reason: 'Material shortage' }],
      createdAt: '2026-01-15T00:00:00Z',
    },
    {
      id: '4',
      name: 'Utility Pipe Replacement',
      plant: 'Utility-1',
      department: 'Utility',
      category: 'Minor',
      status: 'Completed',
      responsibleManager: 'Ravinder Singh',
      vendor: 'Pipe Masters',
      plannedStartDate: '2026-01-20',
      plannedEndDate: '2026-02-20',
      actualEndDate: '2026-02-18',
      plannedWorkers: 6,
      delayReasons: [],
      createdAt: '2026-01-20T00:00:00Z',
    },
    {
      id: '5',
      name: 'Instrumentation Calibration',
      plant: 'MP03',
      department: 'Instrumentation',
      category: 'Minor',
      status: 'Not Started',
      responsibleManager: 'Amar Kushwaha',
      vendor: 'Precision Tech',
      plannedStartDate: '2026-03-15',
      plannedEndDate: '2026-04-10',
      plannedWorkers: 4,
      delayReasons: [],
      createdAt: '2026-03-01T00:00:00Z',
    },
  ];
};

const getInitialContractors = (): Contractor[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CONTRACTORS);
  if (stored) return JSON.parse(stored);
  
  return [
    { id: '1', name: 'Engg Associates', totalWorkers: 50, createdAt: '2025-01-01T00:00:00Z' },
    { id: '2', name: 'Power Systems Ltd', totalWorkers: 40, createdAt: '2025-01-01T00:00:00Z' },
    { id: '3', name: 'Mech Solutions', totalWorkers: 60, createdAt: '2025-01-01T00:00:00Z' },
    { id: '4', name: 'Pipe Masters', totalWorkers: 30, createdAt: '2025-01-01T00:00:00Z' },
    { id: '5', name: 'Precision Tech', totalWorkers: 25, createdAt: '2025-01-01T00:00:00Z' },
  ];
};

const getInitialAttendance = (): AttendanceRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  if (stored) return JSON.parse(stored);
  
  // Generate some sample attendance data for the past 10 days
  const records: AttendanceRecord[] = [];
  const today = new Date('2026-03-10');
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Project 1 attendance
    records.push({
      id: `att-1-${i}`,
      projectId: '1',
      vendor: 'Engg Associates',
      date: dateStr,
      committedWorkers: 10,
      actualPresent: Math.floor(Math.random() * 3) + 8, // 8-10 workers
      createdAt: dateStr,
    });
    
    // Project 2 attendance
    records.push({
      id: `att-2-${i}`,
      projectId: '2',
      vendor: 'Power Systems Ltd',
      date: dateStr,
      committedWorkers: 8,
      actualPresent: Math.floor(Math.random() * 3) + 6, // 6-8 workers
      createdAt: dateStr,
    });
    
    // Project 3 attendance (poor attendance)
    if (i < 5) { // Only first 5 days before it went on hold
      records.push({
        id: `att-3-${i}`,
        projectId: '3',
        vendor: 'Mech Solutions',
        date: dateStr,
        committedWorkers: 12,
        actualPresent: Math.floor(Math.random() * 4) + 4, // 4-7 workers
        createdAt: dateStr,
      });
    }
  }
  
  return records;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);
  const [contractors, setContractors] = useState<Contractor[]>(getInitialContractors);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(getInitialAttendance);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTRACTORS, JSON.stringify(contractors));
  }, [contractors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'delayReasons'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      delayReasons: [],
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const addContractor = (contractor: Omit<Contractor, 'id' | 'createdAt'>) => {
    const newContractor: Contractor = {
      ...contractor,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setContractors([...contractors, newContractor]);
  };

  const updateContractor = (id: string, updates: Partial<Contractor>) => {
    setContractors(contractors.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addAttendance = (attendance: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const newAttendance: AttendanceRecord = {
      ...attendance,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setAttendanceRecords([...attendanceRecords, newAttendance]);
  };

  const updateAttendance = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords(attendanceRecords.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const addDelayReason = (projectId: string, reason: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          delayReasons: [...p.delayReasons, { date: new Date().toISOString().split('T')[0], reason }],
        };
      }
      return p;
    }));
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        contractors,
        attendanceRecords,
        addProject,
        updateProject,
        deleteProject,
        addContractor,
        updateContractor,
        addAttendance,
        updateAttendance,
        addDelayReason,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
