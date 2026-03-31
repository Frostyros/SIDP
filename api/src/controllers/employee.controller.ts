import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

// Helper: compute category summary from participations
function computeCategorySummary(participations: any[]) {
  const summary: Record<string, { total: number; jp: number }> = {
    fungsional: { total: 0, jp: 0 },
    substantif: { total: 0, jp: 0 },
    sertifikasi: { total: 0, jp: 0 },
  };

  const keyMap: Record<string, string> = {
    'Diklat Fungsional': 'fungsional',
    'Diklat Substantif': 'substantif',
    'Diklat Sertifikasi': 'sertifikasi',
  };

  participations.forEach((p: any) => {
    const key = keyMap[p.training.training_type];
    if (key) {
      summary[key].total += 1;
      summary[key].jp += p.training.total_jp;
    }
  });

  return summary;
}

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const { search, department } = req.query;
    const searchStr = search ? String(search) : undefined;
    const deptStr = department ? String(department) : undefined;
    
    const employees = await prisma.employee.findMany({
      where: {
        AND: [
          searchStr ? { name: { contains: searchStr, mode: 'insensitive' } } : {},
          deptStr ? { department: deptStr } : {},
        ]
      },
      include: {
        participations: {
          include: {
            training: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
    });

    const enrichedEmployees = employees.map((emp: any) => {
      const totalTrainings = emp.participations.length;
      const totalJP = emp.participations.reduce((acc: any, p: any) => acc + p.training.total_jp, 0);
      const category_summary = computeCategorySummary(emp.participations);
      return { ...emp, totalTrainings, totalJP, category_summary };
    });

    res.json(enrichedEmployees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee: any = await prisma.employee.findUnique({
      where: { id: String(req.params.id) },
      include: {
        participations: {
          include: {
            training: true
          }
        }
      }
    });

    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const totalTrainings = employee.participations.length;
    const totalJP = employee.participations.reduce((acc: any, p: any) => acc + p.training.total_jp, 0);
    const category_summary = computeCategorySummary(employee.participations);

    res.json({ ...employee, totalTrainings, totalJP, category_summary });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.create({
      data: req.body as any,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: String(req.params.id) },
      data: req.body as any,
    });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    await prisma.employee.delete({
      where: { id: String(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee' });
  }
};
