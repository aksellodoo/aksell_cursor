import { useNavigate, useLocation } from "react-router-dom";

interface ChatterNavigationParams {
  recordType: string;
  recordId: string;
  recordName?: string;
}

export const useChatterNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect current record context from route
  const detectCurrentRecord = (): ChatterNavigationParams | null => {
    const path = location.pathname;
    
    // User detail page: /users/[id]
    if (path.startsWith('/users/') && path !== '/users') {
      const userId = path.split('/')[2];
      return { recordType: 'user', recordId: userId };
    }
    
    // Department detail page: /departments/[id]
    if (path.startsWith('/departments/') && path !== '/departments') {
      const deptId = path.split('/')[2];
      return { recordType: 'department', recordId: deptId };
    }
    
    // Task detail page: /tasks/[id]
    if (path.startsWith('/tasks/') && path !== '/tasks') {
      const taskId = path.split('/')[2];
      return { recordType: 'task', recordId: taskId };
    }
    
    // Employee detail page: /employees/[id]
    if (path.startsWith('/employees/') && path !== '/employees') {
      const empId = path.split('/')[2];
      return { recordType: 'employee', recordId: empId };
    }

    return null;
  };

  const openChatter = (params: ChatterNavigationParams) => {
    navigate(`/chatter/${params.recordType}/${params.recordId}`);
  };

  const openCurrentRecordChatter = () => {
    const currentRecord = detectCurrentRecord();
    if (currentRecord) {
      openChatter(currentRecord);
    }
  };

  return {
    openChatter,
    openCurrentRecordChatter,
    detectCurrentRecord,
    hasCurrentRecord: () => detectCurrentRecord() !== null
  };
};