import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Save, Loader2, Calendar, MapPin, AlignLeft, Shield, Clock } from 'lucide-react';
import api from '../lib/axios';
import { TRAINING_CATEGORIES } from '../lib/trainingTypes';

const AddTraining = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    training_name: '',
    training_type: TRAINING_CATEGORIES[0].value,
    organizer: '',
    location: '',
    description: '',
    start_date: '',
    end_date: '',
    total_jp: 0,
    participants: [] as string[]
  });

  useEffect(() => {
    // Fetch all employees to populate multi-select
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees');
        setEmployees(res.data);
      } catch (error) {
        console.error('Failed to load employees for selection', error);
      }
    };

    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/trainings/${id}`);
        const t = res.data;
        setFormData({
          training_name: t.training_name || '',
          training_type: t.training_type || TRAINING_CATEGORIES[0].value,
          organizer: t.organizer || '',
          location: t.location || '',
          description: t.description || '',
          start_date: t.start_date ? new Date(t.start_date).toISOString().split('T')[0] : '',
          end_date: t.end_date ? new Date(t.end_date).toISOString().split('T')[0] : '',
          total_jp: t.total_jp || 0,
          participants: t.participants?.map((p: any) => p.employee_id) || []
        });
      } catch (error) {
        console.error('Failed to load training data', error);
        alert('Failed to load training details.');
        navigate('/trainings');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
    if (isEditing) {
      fetchTrainingData();
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_jp' ? parseInt(value) || 0 : value
    }));
  };

  const handleParticipantToggle = (employeeId: string) => {
    setFormData(prev => {
      const isSelected = prev.participants.includes(employeeId);
      if (isSelected) {
        return { ...prev, participants: prev.participants.filter(id => id !== employeeId) };
      } else {
        return { ...prev, participants: [...prev.participants, employeeId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditing) {
        await api.put(`/trainings/${id}`, formData);
      } else {
        await api.post('/trainings', formData);
      }
      navigate('/trainings');
    } catch (error) {
      console.error('Failed to create training', error);
      alert('Failed to save training data.');
    } finally {
      setLoading(false);
    }
  };

  // Get the selected category config for visual feedback
  const selectedCategory = TRAINING_CATEGORIES.find(c => c.value === formData.training_type) || TRAINING_CATEGORIES[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Hapus / Edit Training' : 'Add New Training'}</h1>
          <p className="text-gray-500">{isEditing ? 'Update training details and manage participants' : 'Record a new training activity and assign participants'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Training Name *</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-gray-400"><AlignLeft className="h-4 w-4" /></div>
                  <input
                    required
                    name="training_name"
                    value={formData.training_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    placeholder="e.g. Diklat Manajemen Kepegawaian"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori Diklat *</label>
                  <div className="relative">
                    <select
                      required
                      name="training_type"
                      value={formData.training_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {TRAINING_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${selectedCategory.bgBadge} ${selectedCategory.textColor}`}
                      >
                        {selectedCategory.icon} {selectedCategory.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Jam Pelajaran (JP) *</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400"><Clock className="h-4 w-4" /></div>
                    <input
                      required
                      type="number"
                      min="1"
                      name="total_jp"
                      value={formData.total_jp}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="e.g. 40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Organizer / Institution *</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400"><Shield className="h-4 w-4" /></div>
                    <input
                      required
                      name="organizer"
                      value={formData.organizer}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. BKN Training Center"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Platform *</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400"><MapPin className="h-4 w-4" /></div>
                    <input
                      required
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Zoom or Jakarta"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400"><Calendar className="h-4 w-4" /></div>
                    <input
                      required
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-gray-400"><Calendar className="h-4 w-4" /></div>
                    <input
                      required
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      min={formData.start_date}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Optional training details..."
                ></textarea>
              </div>

            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm sticky top-6">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Participants</CardTitle>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {formData.participants.length} Selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[450px] overflow-y-auto p-2">
                {employees.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500 font-medium">Loading participants...</div>
                ) : (
                  <div className="space-y-1">
                    {employees.map(emp => (
                      <label 
                        key={emp.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${formData.participants.includes(emp.id) ? 'bg-blue-50 border-blue-200' : 'border-transparent hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          checked={formData.participants.includes(emp.id)}
                          onChange={() => handleParticipantToggle(emp.id)}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {emp.photo_url ? (
                              <img src={emp.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                            <p className="text-xs text-gray-500 truncate">{emp.department}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="submit"
                disabled={loading || formData.participants.length === 0}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? 'Saving...' : (isEditing ? 'Update Training Event' : 'Save Training Event')}
              </button>
              {formData.participants.length === 0 && (
                <p className="text-xs text-red-500 text-center mt-2 font-medium">Please select at least one participant.</p>
              )}
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default AddTraining;
