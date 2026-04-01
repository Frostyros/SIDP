import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Search, Filter, Loader2, GraduationCap, Clock, Plus, BookOpen, Award, FileCheck } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { TRAINING_CATEGORIES } from '../lib/trainingTypes';

// Map category keys to icons
const CATEGORY_ICONS: Record<string, any> = {
  fungsional: BookOpen,
  substantif: GraduationCap,
  sertifikasi: Award,
};

const Employees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    position: '',
    department: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, selectedDept]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: {
          search: searchTerm,
          department: selectedDept
        }
      });
      setEmployees(res.data);
      
      // Extract unique departments for filter dropdown
      if (departments.length === 0 && res.data.length > 0) {
        const uniqueDepts = Array.from(new Set(res.data.map((e: any) => e.department))) as string[];
        setDepartments(uniqueDepts);
      }
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = async (id: string) => {
    try {
      const res = await api.get(`/employees/${id}`);
      setSelectedEmployee(res.data);
    } catch (error) {
      console.error('Error fetching employee details');
    }
  };

  const openEditModal = (emp: any) => {
    setFormData({
      name: emp.name,
      employee_id: emp.employee_id,
      position: emp.position,
      department: emp.department
    });
    setEditingId(emp.id);
    setIsAddModalOpen(true);
    setSelectedEmployee(null); // Close profile modal if open
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.put(`/employees/${editingId}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsAddModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', employee_id: '', position: '', department: '' });
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error('Failed to save employee', error);
      alert('Failed to save employee. Make sure the NIP/NIK is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
        <p className="text-gray-500">Manage workforce and view training history</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
          <CardTitle>Employee Directory</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white font-medium text-gray-700"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'INPUTER') && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', employee_id: '', position: '', department: '' });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                title="Add New Employee"
              >
                <Plus className="h-4 w-4" />
                Add Pegawai
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Employee</th>
                    <th className="px-6 py-4 font-semibold">Employee ID</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold text-center">Trainings</th>
                    <th className="px-6 py-4 font-semibold text-center">Total JP</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                            {emp.photo_url ? (
                              <img src={emp.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{emp.name}</div>
                            <div className="text-xs text-gray-500">{emp.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{emp.employee_id}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-900">{emp.totalTrainings}</td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600">{emp.totalJP}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openProfile(emp.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No employees found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white text-3xl font-bold">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                  <p className="text-blue-100 font-medium">{selectedEmployee.position}</p>
                  <p className="text-sm text-blue-200 mt-1">{selectedEmployee.department} • ID: {selectedEmployee.employee_id}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 relative z-10">
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full self-end"
                >
                  ✕
                </button>
                {(user?.role === 'ADMIN' || user?.role === 'INPUTER') && (
                  <button
                    onClick={() => openEditModal(selectedEmployee)}
                    className="mt-2 text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/20 shadow-sm"
                  >
                    ✏️ Edit Profil
                  </button>
                )}
              </div>
            </div>
            
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-b border-gray-100">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Trainings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{selectedEmployee.totalTrainings}</p>
                </div>
                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Accumulated JP</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{selectedEmployee.totalJP} <span className="text-sm text-gray-400 font-normal">hours</span></p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Category Summary Cards */}
            {selectedEmployee.category_summary && (
              <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                {TRAINING_CATEGORIES.map(cat => {
                  const summary = selectedEmployee.category_summary[cat.key] || { total: 0, jp: 0 };
                  const IconComponent = CATEGORY_ICONS[cat.key] || FileCheck;
                  return (
                    <div
                      key={cat.key}
                      className={`${cat.bgLight} rounded-xl p-4 border ${cat.borderColor} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: cat.color + '20' }}
                        >
                          <IconComponent className="h-4 w-4" style={{ color: cat.color }} />
                        </div>
                        <span className={`text-xs font-bold ${cat.textColor}`}>{cat.label}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-500 font-medium">Trainings</span>
                          <span className="text-lg font-bold text-gray-900">{summary.total}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-500 font-medium">Total JP</span>
                          <span className="text-lg font-bold" style={{ color: cat.color }}>{summary.jp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="font-bold text-gray-900 mb-4 px-2">Training History</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Training Name</th>
                      <th className="px-4 py-3 font-medium">Organizer</th>
                      <th className="px-4 py-3 font-medium text-center">Dates</th>
                      <th className="px-4 py-3 font-medium text-right">JP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedEmployee.participations?.length > 0 ? (
                      selectedEmployee.participations.map((p: any) => {
                        const catConfig = TRAINING_CATEGORIES.find(c => c.value === p.training.training_type);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              <div>{p.training.training_name}</div>
                              <div className="mt-0.5">
                                <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ${catConfig?.bgBadge || 'bg-gray-100'} ${catConfig?.textColor || 'text-gray-600'}`}>
                                  {p.training.training_type}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{p.training.organizer}</td>
                            <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                              {new Date(p.training.start_date).toLocaleDateString()} - <br/>
                              {new Date(p.training.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">{p.training.total_jp}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No training history available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Pegawai' : 'Add New Pegawai'}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingId(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP / NIK (Employee ID)</label>
                <input
                  type="text"
                  required
                  value={formData.employee_id}
                  onChange={e => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="198001012005011001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position / Jabatan</label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Analyst"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="IT Division"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Update Pegawai' : 'Save Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
