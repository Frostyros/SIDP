import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../services/prisma.service';

export const exportReport = async (req: Request, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Training Report');

    sheet.columns = [
      { header: 'Employee Name', key: 'employee_name', width: 25 },
      { header: 'Training Name', key: 'training_name', width: 35 },
      { header: 'Training Type', key: 'training_type', width: 25 },
      { header: 'Start Date', key: 'start_date', width: 15 },
      { header: 'End Date', key: 'end_date', width: 15 },
      { header: 'JP', key: 'jp', width: 10 }
    ];

    sheet.getRow(1).font = { bold: true };

    const participations = await prisma.trainingParticipant.findMany({
      include: {
        employee: true,
        training: true
      },
      orderBy: { created_at: 'desc' }
    });

    participations.forEach((p: any) => {
      sheet.addRow({
        employee_name: p.employee.name,
        training_name: p.training.training_name,
        training_type: p.training.training_type,
        start_date: new Date(p.training.start_date).toLocaleDateString(),
        end_date: new Date(p.training.end_date).toLocaleDateString(),
        jp: p.training.total_jp
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=training_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};
