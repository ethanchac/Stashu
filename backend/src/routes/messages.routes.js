import express from 'express';
import {
  createMessage,
  getMessages,
  deleteMessage,
  togglePinMessage
} from '../controllers/messages.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyFirebaseToken);

router.post('/channels/:channelId/messages', createMessage);
router.get('/channels/:channelId/messages', getMessages);
router.delete('/channels/:channelId/messages/:messageId', deleteMessage);
router.patch('/channels/:channelId/messages/:messageId/pin', togglePinMessage);

export default router;
