import React, { createContext, ReactNode, useContext, useState } from 'react';
import type { OfferStatus } from '../api/types';

export type JobsFilterType = OfferStatus;

interface JobsFilterContextType {
  filter: JobsFilterType;
  setFilter: (filter: JobsFilterType) => void;
}

const JobsFilterContext = createContext<JobsFilterContextType | undefined>(undefined);

export function JobsFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<JobsFilterType>('pending');

  return (
    <JobsFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </JobsFilterContext.Provider>
  );
}

export function useJobsFilter() {
  const context = useContext(JobsFilterContext);
  if (!context) {
    throw new Error('useJobsFilter must be used within a JobsFilterProvider');
  }
  return context;
}

