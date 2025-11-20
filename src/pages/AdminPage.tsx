import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subjectService } from '../services/subject-service';
import { BookOpen, Users, Settings, ServerCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type AdminTab = 'overview' | 'users' | 'subjects' | 'settings';

type AdminUser = {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
};

const USERS_KEY = 'sophia_users';

function loadLocalUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminUser[];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: AdminUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const seeded = loadLocalUsers();
    // ensure gigsdev007 is present and admin
    const exists = seeded.find(u => u.email === 'gigsdev007@gmail.com');
    if (!exists) {
      const seededUser: AdminUser = { id: 'gigsdev007@gmail.com', email: 'gigsdev007@gmail.com', name: 'GigsDev', isAdmin: true };
      const next = [seededUser, ...seeded];
      saveLocalUsers(next);
      return next;
    }
    // ensure admin flag
    const updated = seeded.map(u => u.email === 'gigsdev007@gmail.com' ? { ...u, isAdmin: true } : u);
    saveLocalUsers(updated);
    return updated;
  });

  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const s = await subjectService.getAllSubjects();
        setSubjects(s as any[]);
      } catch (err) {
        // ignore supabase errors; show empty state
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const stats = useMemo(() => ({
    users: users.length,
    subjects: subjects.length,
  }), [users.length, subjects.length]);

  const addUser = (email: string, name?: string) => {
    const u: AdminUser = { id: email, email, name: name || email.split('@')[0], isAdmin: false };
    const next = [u, ...users];
    setUsers(next);
    saveLocalUsers(next);
  };

  // CSV export/import helpers
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportUsersCSV = () => {
    const header = ['email', 'name', 'isAdmin'];
    const rows = users.map(u => [u.email, u.name || '', u.isAdmin ? 'true' : 'false'].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    downloadCSV('users.csv', csv);
  };

  const exportSubjectsCSV = () => {
    const header = ['id','name','slug','exam_type','subject_category','is_mandatory','color_theme','icon','description'];
    const rows = subjects.map((s: any) => [s.id, s.name, s.slug, s.exam_type, s.subject_category, s.is_mandatory, s.color_theme, s.icon, s.description].map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    downloadCSV('subjects.csv', csv);
  };

  const importUsersFromFile = async (file: File | null) => {
    if (!file) return;
    const txt = await file.text();
    const lines = txt.split(/\r?\n/).filter(Boolean);
    const [header, ...rest] = lines;
    const cols = header.split(',').map(h => h.trim().replace(/^"|"$/g,''));
    const parsed: AdminUser[] = rest.map(line => {
      // basic CSV split (naive)
      const values = line.split(',').map(v => v.replace(/^"|"$/g,''));
      const obj: any = {};
      cols.forEach((c,i) => obj[c] = values[i] ?? '');
      return { id: obj.email, email: obj.email, name: obj.name || undefined, isAdmin: obj.isAdmin === 'true' } as AdminUser;
    });
    const next = [...parsed, ...users];
    setUsers(next);
    saveLocalUsers(next);
  };

  const importSubjectsFromFile = async (file: File | null) => {
    if (!file) return;
    const txt = await file.text();
    const lines = txt.split(/\r?\n/).filter(Boolean);
    const [header, ...rest] = lines;
    const cols = header.split(',').map(h => h.trim().replace(/^"|"$/g,''));
    const parsed = rest.map(line => {
      const values = line.split(',').map(v => v.replace(/^"|"$/g,''));
      const obj: any = {};
      cols.forEach((c,i) => obj[c] = values[i] ?? '');
      return obj;
    });
    // Attempt to insert subjects via supabase if server proxy exists
    // For now, just show parsed subjects in UI (not persisted server-side)
    setSubjects(parsed);
  };

  const toggleAdmin = (email: string) => {
    const next = users.map(u => u.email === email ? { ...u, isAdmin: !u.isAdmin } : u);
    setUsers(next);
    saveLocalUsers(next);
  };

  const removeUser = (email: string) => {
    const next = users.filter(u => u.email !== email);
    setUsers(next);
    saveLocalUsers(next);
  };

  if (loading || !user) {
    return <div className="container mx-auto px-4 py-12">Loading admin...</div>;
  }

  // Import preview / run states
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported?: number; error?: string } | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1 sticky top-24">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Admin</h3>
              <p className="text-sm text-gray-500">Welcome, {user.name || user.email}</p>
            </div>

            <nav className="flex flex-col gap-2">
              <Button variant={tab==='overview' ? 'primary' : 'ghost'} onClick={() => setTab('overview')} className="flex items-center gap-3 justify-start">
                <ServerCog className="w-5 h-5 text-blue-600"/> <span>Overview</span>
              </Button>
              <Button variant={tab==='users' ? 'primary' : 'ghost'} onClick={() => setTab('users')} className="flex items-center gap-3 justify-start">
                <Users className="w-5 h-5 text-green-600"/> <span>Users</span>
              </Button>
              <Button variant={tab==='subjects' ? 'primary' : 'ghost'} onClick={() => setTab('subjects')} className="flex items-center gap-3 justify-start">
                <BookOpen className="w-5 h-5 text-purple-600"/> <span>Subjects</span>
              </Button>
              <Button variant={tab==='settings' ? 'primary' : 'ghost'} onClick={() => setTab('settings')} className="flex items-center gap-3 justify-start">
                <Settings className="w-5 h-5 text-yellow-600"/> <span>Settings</span>
              </Button>
            </nav>
          </aside>

          {/* Main */}
          <main className="md:col-span-4">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">Manage your app features and users</p>
                </div>
                <div className="text-sm text-gray-600">Super Admin: gigsdev007@gmail.com</div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-white">
                  <div className="text-xs text-gray-500">Users</div>
                  <div className="text-2xl font-bold">{stats.users}</div>
                </Card>
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-white">
                  <div className="text-xs text-gray-500">Subjects</div>
                  <div className="text-2xl font-bold">{stats.subjects}</div>
                </Card>
                <Card className="p-4 bg-gradient-to-r from-green-50 to-white">
                  <div className="text-xs text-gray-500">Actions</div>
                  <div className="text-2xl font-bold">Quick Tools</div>
                </Card>
              </div>
            </motion.div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-3">Overview</h2>
                <p className="text-sm text-gray-600">Quick insights about application content and user activity.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <h3 className="font-medium mb-2">Recent activity</h3>
                    <div className="text-sm text-gray-500">No recent activity available (placeholder)</div>
                  </div>

                  <div className="p-4 border rounded">
                    <h3 className="font-medium mb-2">Import Questions (Preview & Run)</h3>
                    <div className="text-sm text-gray-600 mb-3">Preview normalized rows locally and run server-side import.</div>

                          <div className="flex items-center gap-2 mb-3">
                            <Button variant="secondary" onClick={async () => {
                                setPreviewLoading(true);
                                try {
                                  const res = await fetch('/api/preview-import');
                                  if (!res.ok) throw new Error('Failed to preview');
                                  const data = await res.json();
                                  setPreviewRows(data.sample || []);
                                } catch (err: any) {
                                  setPreviewRows([]);
                                  alert('Preview failed: ' + (err.message || err));
                                } finally {
                                  setPreviewLoading(false);
                                }
                              }} className="px-3 py-2">
                              {previewLoading ? 'Previewing...' : 'Preview Import'}
                            </Button>

                            <Button variant="primary" onClick={async () => {
                                if (!adminPasswordInput) {
                                  const pw = prompt('Enter admin password to run import');
                                  if (!pw) return;
                                  setAdminPasswordInput(pw);
                                }
                                setImportLoading(true);
                                setImportResult(null);
                                try {
                                  const login = await fetch('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: adminPasswordInput }) });
                                  if (!login.ok) throw new Error('Admin login failed');
                                  const { token } = await login.json();
                                  const imp = await fetch('/api/import-quizzes', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                  if (!imp.ok) {
                                    const txt = await imp.text();
                                    throw new Error(txt || 'Import failed');
                                  }
                                  const result = await imp.json();
                                  setImportResult({ imported: result.imported });
                                  alert('Import completed: ' + (result.imported ?? 0));
                                } catch (err: any) {
                                  setImportResult({ error: err.message || String(err) });
                                  alert('Import error: ' + (err.message || err));
                                } finally {
                                  setImportLoading(false);
                                }
                              }} className="px-3 py-2">
                              {importLoading ? 'Importing...' : 'Run Import'}
                            </Button>
                          </div>

                    <div className="mb-3">
                      <label className="text-xs text-gray-500">Admin password (stored only in this session)</label>
                      <input type="password" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} className="w-full mt-1 p-2 border rounded" placeholder="Enter admin password" />
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Preview sample</div>
                      {previewRows === null ? (
                        <div className="text-xs text-gray-500">No preview yet</div>
                      ) : previewRows.length === 0 ? (
                        <div className="text-xs text-gray-500">No rows found</div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-auto p-2 bg-gray-50 rounded">
                          {previewRows.map((r: any) => (
                            <Card key={r.id} className="p-3">
                              <div className="font-medium text-sm">{r.question_text.slice(0, 120)}{r.question_text.length>120?'...':''}</div>
                              <div className="text-xs text-gray-500 mt-1">Options: {r.option_a ? 'A,' : ''}{r.option_b ? 'B,' : ''}{r.option_c ? 'C,' : ''}{r.option_d ? 'D' : ''} • Correct: {r.correct_answer}</div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Users</h2>
                  <div className="flex items-center gap-3">
                    <AddUserForm onAdd={addUser} />
                    <div className="flex items-center gap-2">
                      <button onClick={exportUsersCSV} className="px-3 py-2 bg-green-600 text-white rounded text-sm">Export CSV</button>
                      <label className="px-3 py-2 bg-gray-100 rounded text-sm cursor-pointer">
                        Import CSV
                        <input type="file" accept=".csv,text/csv" onChange={e => importUsersFromFile(e.target.files?.[0] ?? null)} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-500">Manage local users (or use server-sync)</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          // Attempt to call a server-side admin proxy (not included by default)
                          const res = await fetch('/api/admin/users/sync', { method: 'POST' });
                          if (!res.ok) throw new Error('Server sync failed');
                          const data = await res.json();
                          if (Array.isArray(data)) {
                            const next = data.map((d: any) => ({ id: d.id, email: d.email, name: d.full_name || d.email, isAdmin: !!d.is_admin }));
                            setUsers(next);
                            saveLocalUsers(next);
                          }
                        } catch (err) {
                          // show fallback notice
                          alert('Server sync unavailable. This feature requires a server-side admin proxy (see project README).');
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded text-sm"
                    >
                      Sync from Supabase
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="py-2">Email</th>
                        <th className="py-2">Name</th>
                        <th className="py-2">Role</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.email} className="border-t">
                          <td className="py-3">{u.email}</td>
                          <td className="py-3">{u.name}</td>
                          <td className="py-3">{u.isAdmin ? 'Admin' : 'User'}</td>
                          <td className="py-3">
                            <button onClick={() => toggleAdmin(u.email)} className="mr-2 px-3 py-1 rounded bg-blue-600 text-white text-sm">Toggle Admin</button>
                            <button onClick={() => removeUser(u.email)} className="px-3 py-1 rounded bg-red-50 text-red-600 text-sm">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'subjects' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Subjects</h2>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={exportSubjectsCSV} className="px-3 py-2 bg-green-600 text-white rounded text-sm">Export CSV</button>
                  <label className="px-3 py-2 bg-gray-100 rounded text-sm cursor-pointer">
                    Import CSV
                    <input type="file" accept=".csv,text/csv" onChange={e => importSubjectsFromFile(e.target.files?.[0] ?? null)} className="hidden" />
                  </label>
                </div>
                {loadingSubjects ? (
                  <div>Loading subjects...</div>
                ) : subjects.length === 0 ? (
                  <div className="text-gray-500">No subjects available (or supabase not configured).</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map(s => (
                      <div key={s.id} className="p-4 border rounded flex items-center gap-4">
                        <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: s.color_theme || '#4f46e5' }}>
                          <span className="text-white">{s.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.exam_type} • {s.subject_category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-3">Settings</h2>
                <p className="text-sm text-gray-600">Manage app-level settings. (Placeholders)</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded">Feature flags (placeholder)</div>
                  <div className="p-4 border rounded">System settings (placeholder)</div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onAdd }: { onAdd: (email: string, name?: string) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onAdd(email, name);
    setEmail(''); setName('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="p-2 border rounded text-sm" />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)" className="p-2 border rounded text-sm" />
      <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Add</button>
    </form>
  );
}
