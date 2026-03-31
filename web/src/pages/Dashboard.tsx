import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, GraduationCap, Clock, TrendingUp, BarChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/axios';
import { format } from 'date-fns';
import { TRAINING_CATEGORIES } from '../lib/trainingTypes';

// Use category colors from standardized config
const CATEGORY_COLORS: Record<string, string> = {};
TRAINING_CATEGORIES.forEach(cat => {
  CATEGORY_COLORS[cat.value] = cat.color;
});

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard data...</div>;
  }

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-600">Trainings: <span className="font-bold">{data.count}</span></p>
          <p className="text-gray-600">Total JP: <span className="font-bold">{data.jp}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of SIDP training statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalEmployees || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium whitespace-nowrap">Active workforce</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Trainings</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalTrainings || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium whitespace-nowrap">Recorded across system</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total JP This Year</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalJpThisYear || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium whitespace-nowrap">Jam Pelajaran accumulated</span>
            </div>
          </CardContent>
        </Card>

        {/* New KPI: Average JP per Employee */}
        <Card className="bg-white rounded-xl shadow-sm border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Employee JP</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.averageJp || 0} <span className="text-lg text-gray-400 font-semibold">JP</span></h3>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-indigo-600 font-medium whitespace-nowrap">Average training per capita</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Distribution by Category – Pie Chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 col-span-1">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Training Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-96 flex flex-col items-center justify-center">
            {stats?.chartCategory?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={stats.chartCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                    >
                      {stats.chartCategory.map((entry: any) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name] || '#94a3b8'}
                          stroke={CATEGORY_COLORS[entry.name] || '#94a3b8'}
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 flex-wrap justify-center mt-2">
                  {stats.chartCategory.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#94a3b8' }}></div>
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-gray-400">({entry.count})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-400">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* JP Distribution per Employee – Bar Chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 col-span-1">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">JP Distribution (Top Emp.)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-96">
            {stats?.chartJp?.length > 0 ? (() => {
              // Minimalist name formatting (e.g. "Drs. MEITABERNA P. L. W. GERUNGAN" -> "Meitaberna G.")
              const formatShortName = (fullName: string) => {
                const clean = fullName.replace(/^(Drs\.|Dr\.|Ir\.|Hj\.|H\.)\s*/i, '').replace(/,.*/, '').trim();
                const parts = clean.split(/\s+/);
                if (parts.length > 1) {
                  const first = parts[0].length > 2 ? parts[0] : parts[0] + ' ' + parts[1];
                  const last = parts[parts.length - 1];
                  // If first and last are the same or there are only 2 words, return them natively formatted
                  if (first === last || parts.length === 2) {
                    return `${first} ${last}`.substring(0, 18) + (first.length + last.length >= 17 ? '...' : '');
                  }
                  return `${first} ${last.charAt(0)}.`;
                }
                return clean.substring(0, 15);
              };

              const formattedData = stats.chartJp.map((item: any) => ({
                ...item,
                shortName: formatShortName(item.name)
              }));

              return (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={formattedData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="shortName" type="category" width={110} tick={{fontSize: 11, fill: '#6b7280'}} interval={0} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(val: any, name: any, props: any) => [val, props.payload.name]} />
                    <Bar dataKey="jp" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
                      {formattedData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              );
            })() : (
              <div className="flex h-full items-center justify-center text-gray-400">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Summary Cards */}
      {stats?.chartCategory?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.chartCategory.map((cat: any) => {
            const config = TRAINING_CATEGORIES.find(c => c.value === cat.name);
            return (
              <Card key={cat.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: config?.color || '#94a3b8' }}></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: (config?.color || '#94a3b8') + '15' }}
                    >
                      {config?.icon || '📄'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Trainings</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{cat.count}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: (config?.color || '#94a3b8') + '10' }}>
                      <p className="text-xs text-gray-500 font-medium">Total JP</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: config?.color || '#94a3b8' }}>{cat.jp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Trainings</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Training Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium">JP</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTrainings?.length > 0 ? (
                stats.recentTrainings.map((training: any) => {
                  const config = TRAINING_CATEGORIES.find(c => c.value === training.training_type);
                  return (
                    <tr key={training.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{training.training_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config?.bgBadge || 'bg-gray-100'} ${config?.textColor || 'text-gray-800'}`}>
                          {training.training_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(new Date(training.start_date), 'MMM dd')} - {format(new Date(training.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{training.total_jp} JP</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No recent trainings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
