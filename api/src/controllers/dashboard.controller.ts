import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

// Standard category order and colors for consistent chart rendering
const STANDARD_CATEGORIES = [
  { name: 'Diklat Fungsional', color: '#3b82f6' },
  { name: 'Diklat Substantif', color: '#10b981' },
  { name: 'Diklat Sertifikasi', color: '#f97316' },
];

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear}-12-31`);

    const totalEmployees = await prisma.employee.count();
    const totalTrainings = await prisma.training.count();

    const trainingsThisYear = await prisma.training.findMany({
      where: {
        start_date: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    const totalJpThisYear = trainingsThisYear.reduce((acc: any, t: any) => acc + t.total_jp, 0);

    // Chart: Training per Category (count + JP)
    const categoryCountsRaw = await prisma.training.groupBy({
      by: ['training_type'],
      _count: { id: true },
      _sum: { total_jp: true },
    });

    // Build chart data with all 3 standard categories (even if 0)
    const chartCategory = STANDARD_CATEGORIES.map(cat => {
      const found = categoryCountsRaw.find((item: any) => item.training_type === cat.name);
      return {
        name: cat.name,
        count: found ? found._count.id : 0,
        jp: found ? (found._sum.total_jp || 0) : 0,
        color: cat.color,
      };
    });

    // Chart: JP Distribution (Top 5 Employees by participation JP)
    const topEmployees = await prisma.employee.findMany({
      include: {
        participations: {
          include: {
            training: true
          }
        }
      }
    });

    const enrichedEmp = topEmployees.map((emp: any) => {
      const jp = emp.participations.reduce((acc: any, p: any) => acc + p.training.total_jp, 0);
      return { name: emp.name, jp };
    });

    const totalJpAllSystem = enrichedEmp.reduce((acc: number, emp: any) => acc + emp.jp, 0);
    const averageJp = totalEmployees > 0 ? Math.round(totalJpAllSystem / totalEmployees) : 0;

    // We can keep chartJp for the Distribution Bar Chart, but rename the context visually in frontend
    const chartJp = enrichedEmp.sort((a: any, b: any) => b.jp - a.jp).slice(0, 10); // expand to 10 for better distribution view

    // Table: Recent Trainings
    const recentTrainings = await prisma.training.findMany({
      orderBy: { created_at: 'desc' },
      take: 5
    });

    res.json({
      totalEmployees,
      totalTrainings,
      totalJpThisYear,
      averageJp,
      chartCategory,
      chartJp,
      recentTrainings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};
