import { create } from 'zustand';

export interface Project {
  id: number;
  name: string;
  organization_id: number;
  region: string;
  status: string; // 'provisioning', 'active', 'paused'
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  billing_plan: string;
}

interface PlatformState {
  organizations: Organization[];
  projects: Project[];
  selectedOrgId: number | null;
  selectedProjectId: number | null;
  isLoading: boolean;
  
  setOrganizations: (orgs: Organization[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedOrg: (id: number | null) => void;
  setSelectedProject: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  organizations: [],
  projects: [],
  selectedOrgId: null,
  selectedProjectId: null,
  isLoading: false,

  setOrganizations: (orgs) => set({ organizations: orgs }),
  setProjects: (projects) => set({ projects }),
  setSelectedOrg: (id) => set({ selectedOrgId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
