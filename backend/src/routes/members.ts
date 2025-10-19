import { Router } from 'express';
import { MemberController } from '../controllers/MemberController';

const router = Router();
const memberController = new MemberController();

/**
 * @route GET /api/v1/members
 * @description Get list of congressional members
 * @access Public
 */
router.get('/', memberController.getMembers.bind(memberController));

/**
 * @route GET /api/v1/members/:id
 * @description Get congressional member by ID
 * @access Public
 */
router.get('/:id', memberController.getMemberById.bind(memberController));

/**
 * @route GET /api/v1/members/:id/trades
 * @description Get trades for a specific congressional member
 * @access Public
 */
router.get('/:id/trades', memberController.getMemberTrades.bind(memberController));

export default router;
