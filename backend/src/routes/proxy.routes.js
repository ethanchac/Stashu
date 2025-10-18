import express from 'express';
import { proxyImage } from '../controllers/proxy.controller.js';

const router = express.Router();

// Handle OPTIONS preflight for CORS
router.options('/image', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

router.get('/image', proxyImage);

export default router;
