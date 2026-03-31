import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

// Standardized training categories — the ONLY valid values
const VALID_TRAINING_TYPES = [
  'Diklat Fungsional',
  'Diklat Substantif',
  'Diklat Sertifikasi',
];

export const getAllTrainings = async (req: Request, res: Response) => {
  try {
    const { search, type } = req.query;
    const searchStr = search ? String(search) : undefined;
    const typeStr = type ? String(type) : undefined;

    const trainings = await prisma.training.findMany({
      where: {
        AND: [
          searchStr ? { training_name: { contains: searchStr, mode: 'insensitive' } } : {},
          typeStr ? { training_type: typeStr } : {},
        ]
      },
      include: {
        participants: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { start_date: 'desc' },
    });

    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trainings' });
  }
};

export const getTrainingById = async (req: Request, res: Response) => {
  try {
    const training = await prisma.training.findUnique({
      where: { id: String(req.params.id) },
      include: {
        participants: {
          include: {
            employee: true
          }
        }
      }
    });

    if (!training) return res.status(404).json({ message: 'Training not found' });
    res.json(training);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training' });
  }
};

export const createTraining = async (req: Request, res: Response) => {
  try {
    const { participants, ...trainingData } = req.body;

    // Validate training_type
    if (!trainingData.training_type || !VALID_TRAINING_TYPES.includes(trainingData.training_type)) {
      return res.status(400).json({
        message: `Invalid training_type. Must be one of: ${VALID_TRAINING_TYPES.join(', ')}`,
        valid_types: VALID_TRAINING_TYPES
      });
    }

    const startDate = new Date(trainingData.start_date);
    const endDate = new Date(trainingData.end_date);

    // Check for an existing training with the same name and dates
    const existingTraining = await prisma.training.findFirst({
      where: {
        training_name: { equals: trainingData.training_name, mode: 'insensitive' },
        start_date: startDate,
        end_date: endDate,
      }
    });

    let trainingId = '';

    if (existingTraining) {
      // Training already exists, just use its ID
      trainingId = existingTraining.id;
      
      // Update any basic info just in case (optional, but good for keeping data fresh)
      await prisma.training.update({
        where: { id: trainingId },
        data: {
          total_jp: trainingData.total_jp,
          organizer: trainingData.organizer,
          location: trainingData.location,
          description: trainingData.description
        }
      });
    } else {
      // Create new training
      const newTraining = await prisma.training.create({
        data: {
          ...trainingData,
          start_date: startDate,
          end_date: endDate,
        }
      });
      trainingId = newTraining.id;
    }

    // Insert participants if they exist, ignoring duplicates
    if (participants && participants.length > 0) {
      for (const employee_id of participants) {
        try {
          // Use upsert or just catch the constraint error to ignore existing
          await prisma.trainingParticipant.create({
            data: {
              training_id: trainingId,
              employee_id: String(employee_id)
            }
          });
        } catch (err) {
          // Ignore unique constraint violations (already joined)
        }
      }
    }

    // Fetch the final training object with participants to return
    const finalTraining = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        participants: true
      }
    });

    res.status(201).json(finalTraining);
  } catch (error) {
    console.error('Error create training:', error);
    res.status(500).json({ message: 'Error creating training' });
  }
};

export const updateTraining = async (req: Request, res: Response) => {
  try {
    const { participants, ...trainingData } = req.body;

    // Validate training_type if provided
    if (trainingData.training_type && !VALID_TRAINING_TYPES.includes(trainingData.training_type)) {
      return res.status(400).json({
        message: `Invalid training_type. Must be one of: ${VALID_TRAINING_TYPES.join(', ')}`,
        valid_types: VALID_TRAINING_TYPES
      });
    }
    
    // Convert dates if present
    if (trainingData.start_date) trainingData.start_date = new Date(trainingData.start_date);
    if (trainingData.end_date) trainingData.end_date = new Date(trainingData.end_date);

    // Update basic training data
    const training = await prisma.training.update({
      where: { id: String(req.params.id) },
      data: trainingData as any,
    });

    // If participants are provided, we replace the existing ones
    if (participants && Array.isArray(participants)) {
      // First delete existing participants for this training
      await prisma.trainingParticipant.deleteMany({
        where: { training_id: String(req.params.id) }
      });
      
      // Then create new ones
      await prisma.trainingParticipant.createMany({
        data: participants.map((employee_id: any) => ({
          training_id: String(req.params.id),
          employee_id: String(employee_id)
        }))
      });
    }

    const updatedTraining = await prisma.training.findUnique({
      where: { id: String(req.params.id) },
      include: { participants: true }
    });

    res.json(updatedTraining);
  } catch (error) {
    console.error('Error update training:', error);
    res.status(500).json({ message: 'Error updating training' });
  }
};

export const deleteTraining = async (req: Request, res: Response) => {
  try {
    await prisma.training.delete({
      where: { id: String(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting training' });
  }
};
