import express from 'express';
import { predictDiseaseInsightsHandler } from '../controllers/diseaseInsightController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/predict', authenticate, predictDiseaseInsightsHandler);

export default router;
