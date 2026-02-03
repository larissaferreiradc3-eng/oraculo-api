import express from 'express';
import { receiveEvent } from '../controllers/oracle.controller.js';

const router = express.Router();

// rota para receber eventos do coletor
router.post('/oracle/evento', receiveEvent);

export default router;
