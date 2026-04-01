import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Download } from 'lucide-react';
import api from '../lib/axios';

const Reports = () => {
  const handleExport = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'training_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Generate and export training analytics</p>
      </div>

      <Card className="bg-white border-gray-200 max-w-2xl">
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Download a complete excel spreadsheet containing all training participations, 
            employee details, dates, and accumulated Jam Pelajaran (JP).
          </p>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
