import { Request, Response } from 'express';
import { CongressionalMember } from '../models/CongressionalMember';
import { StockTrade } from '../models/StockTrade';

export class MemberController {
  /**
   * Get list of congressional members
   */
  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const {
        position,
        stateCode,
        partyAffiliation,
        isActive,
        limit = 50,
        offset = 0
      } = req.query;

      const filters: any = {};
      if (position) filters.position = position;
      if (stateCode) filters.stateCode = stateCode;
      if (partyAffiliation) filters.partyAffiliation = partyAffiliation;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const members = await CongressionalMember.findAll(
        filters,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      // Get total count
      const totalResult = await CongressionalMember.count(filters);

      res.json({
        success: true,
        data: {
          members,
          total: totalResult,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + members.length < totalResult
        }
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch congressional members'
      });
    }
  }

  /**
   * Get congressional member by ID
   */
  async getMemberById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const member = await CongressionalMember.findById(id);

      if (!member) {
        res.status(404).json({
          success: false,
          error: 'Congressional member not found'
        });
        return;
      }

      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      console.error('Error fetching member:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch congressional member'
      });
    }
  }

  /**
   * Get trades for a specific congressional member
   */
  async getMemberTrades(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        limit = 20,
        offset = 0,
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = req.query;

      // Verify member exists
      const member = await CongressionalMember.findById(id);
      if (!member) {
        res.status(404).json({
          success: false,
          error: 'Congressional member not found'
        });
        return;
      }

      // Fetch trades for this member
      const { trades, total } = await StockTrade.findWithFilters(
        { traderId: id, traderType: 'congressional' },
        parseInt(limit as string),
        parseInt(offset as string),
        sortBy as string,
        sortOrder as string
      );

      res.json({
        success: true,
        data: {
          member,
          trades,
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + trades.length < total
        }
      });
    } catch (error) {
      console.error('Error fetching member trades:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch member trades'
      });
    }
  }
}
