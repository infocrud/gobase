import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStore } from '../store/platform';
import { apiFetch } from '../store/auth';
import { Database, Plus, Loader2, ArrowRight } from 'lucide-react';

const REGIONS = [
  { label: 'US East (N. Virginia)', value: 'us-east-1' },
  { label: 'US West (Oregon)', value: 'us-west-2' },
  { label: 'EU (Frankfurt)', value: 'eu-central-1' },
];

export default function PlatformPage() {
  const navigate = useNavigate();
  const { projects, setProjects, isLoading, setLoading } = usePlatformStore();
  const [orgId, setOrgId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [region, setRegion] = useState(REGIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure an organization exists, then load its projects from the control plane.
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/controlplane/v1/organizations');
      const body = await res.json();
      let orgs = body.data || [];

      // Bootstrap a default organization on first use.
      if (orgs.length === 0) {
        const createRes = await apiFetch('/controlplane/v1/organizations', {
          method: 'POST',
          body: JSON.stringify({ name: 'My Organization' }),
        });
        const created = await createRes.json();
        if (created.data) orgs = [created.data];
      }

      const org = orgs[0];
      if (!org) {
        setError('Could not load or create an organization.');
        return;
      }
      setOrgId(org.id);
      setProjects(org.projects || []);
    } catch {
      setError('Network error loading projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !orgId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/controlplane/v1/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          organization_id: orgId,
          region,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.data) {
        setError(body.error || 'Failed to create project.');
        return;
      }
      setIsModalOpen(false);
      setNewProjectName('');
      await loadData(); // reload from server so it persists/refreshes
    } catch {
      setError('Network error creating project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-[20rem] -left-[20rem] w-[40rem] h-[40rem] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-[10rem] -right-[10rem] w-[30rem] h-[30rem] bg-emerald-50/40 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 animate-fade-in-up">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Projects</h1>
            <p className="text-lg text-slate-500">Manage your GoBase instances and team access.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors hover-lift premium-shadow"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
            <p className="text-slate-500 text-lg mb-1">No projects yet</p>
            <p className="text-slate-400 text-sm">Click “New Project” to provision your first instance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="flex flex-col p-6 rounded-2xl glass-panel hover-lift cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <Database className="w-6 h-6" />
                  </div>
                  {project.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Provisioning
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-1">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-6">Region: {project.region}</p>

                <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between text-indigo-600 group">
                  <span className="text-sm font-medium">Manage Instance</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal - Create Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full premium-shadow">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create a new Project</h2>
            <p className="text-sm text-slate-500 mb-6">A new database and storage bucket will be provisioned.</p>

            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    placeholder="e.g. Acme Production"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors premium-shadow disabled:opacity-50"
                >
                  {submitting ? 'Provisioning…' : 'Provision Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
