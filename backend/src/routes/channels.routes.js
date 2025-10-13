import express from 'express';
import {
  createChannel,
  getChannels,
  getChannelById,
  updateChannel,
  deleteChannel
} from '../controllers/channels.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

router.post('/channels', createChannel);
router.get('/channels', getChannels);
router.get('/channels/:channelId', getChannelById);
router.patch('/channels/:channelId', updateChannel);
router.delete('/channels/:channelId', deleteChannel);

export default router;
