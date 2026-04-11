import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStore } from '../store/platform';
import { Database, Plus, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function PlatformPage() {
  const navigate = useNavigate();
  const { projects, setProjects, isLoading, setLoading } = usePlatformStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Mock fetching projects
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProjects([
        { id: 1, name: 'Production DB', organization_id: 1, region: 'us-east-1', status: 'active', created_at: new Date().toISOString() },
        { id: 2, name: 'Staging Environment', organization_id: 1, region: 'eu-west-1', status: 'provisioning', created_at: new Date().toISOString() }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    
    // In real app, hit POST /controlplane/v1/projects
    const nextId = projects.length + 1;
    setProjects([
      ...projects,
      { id: nextId, name: newProjectName, organization_id: 1, region: 'us-east-1', status: 'provisioning', created_at: new Date().toISOString() }
    ]);
    setIsModalOpen(false);
    setNewProjectName('');
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => project.status === 'active' && navigate(`/project/${project.id}`)}
                className={`flex flex-col p-6 rounded-2xl glass-panel hover-lift cursor-pointer ${project.status !== 'active' ? 'opacity-80' : ''}`}
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
                  <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white">
                    <option>US East (N. Virginia)</option>
                    <option>US West (Oregon)</option>
                    <option>EU (Frankfurt)</option>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors premium-shadow"
                >
                  Provision Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
