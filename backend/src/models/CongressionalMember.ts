import { db } from '../config/database';
import { PoolClient } from 'pg';

export interface CongressionalMemberData {
  id?: string;
  name: string;
  position: 'senator' | 'representative';
  stateCode: string;
  district?: number;
  partyAffiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  officeStartDate?: Date;
  officeEndDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCongressionalMemberData {
  name: string;
  position: 'senator' | 'representative';
  stateCode: string;
  district?: number;
  partyAffiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  officeStartDate?: Date;
  officeEndDate?: Date;
}

export interface CongressionalMemberFilters {
  position?: 'senator' | 'representative';
  stateCode?: string;
  partyAffiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  isActive?: boolean;
}

export class CongressionalMember {
  id?: string;
  name: string;
  position: 'senator' | 'representative';
  stateCode: string;
  district?: number;
  partyAffiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  officeStartDate?: Date;
  officeEndDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: CongressionalMemberData) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.stateCode = data.stateCode;
    this.district = data.district;
    this.partyAffiliation = data.partyAffiliation;
    this.officeStartDate = data.officeStartDate;
    this.officeEndDate = data.officeEndDate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Create a new congressional member
   */
  static async create(memberData: CreateCongressionalMemberData): Promise<CongressionalMember> {
    // Validate required fields
    if (!memberData.name || !memberData.position || !memberData.stateCode) {
      throw new Error('Name, position, and state code are required');
    }

    // Validate state code format (2 characters)
    if (memberData.stateCode.length !== 2) {
      throw new Error('State code must be exactly 2 characters');
    }

    // Validate position-specific rules
    if (memberData.position === 'senator' && memberData.district !== undefined) {
      throw new Error('Senators cannot have a district number');
    }

    if (memberData.position === 'representative' && !memberData.district) {
      throw new Error('Representatives must have a district number');
    }

    if (memberData.district && (memberData.district < 1 || memberData.district > 99)) {
      throw new Error('District number must be between 1 and 99');
    }

    const client = await db.connect();
    try {
      // Check for existing active member with same position/state/district
      await CongressionalMember.validateUniqueness(client, memberData);

      // Insert new congressional member
      const result = await client.query(
        `INSERT INTO congressional_members 
         (name, position, state_code, district, party_affiliation, office_start_date, office_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          memberData.name,
          memberData.position,
          memberData.stateCode.toUpperCase(),
          memberData.district || null,
          memberData.partyAffiliation || null,
          memberData.officeStartDate || null,
          memberData.officeEndDate || null
        ]
      );

      const memberRow = result.rows[0];
      return new CongressionalMember({
        id: memberRow.id,
        name: memberRow.name,
        position: memberRow.position,
        stateCode: memberRow.state_code,
        district: memberRow.district,
        partyAffiliation: memberRow.party_affiliation,
        officeStartDate: memberRow.office_start_date,
        officeEndDate: memberRow.office_end_date,
        createdAt: memberRow.created_at,
        updatedAt: memberRow.updated_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Validate uniqueness constraints
   */
  private static async validateUniqueness(
    client: PoolClient,
    memberData: CreateCongressionalMemberData,
    excludeId?: string
  ): Promise<void> {
    let query = `
      SELECT id FROM congressional_members 
      WHERE position = $1 AND state_code = $2
    `;
    const params: any[] = [memberData.position, memberData.stateCode.toUpperCase()];

    if (memberData.position === 'representative') {
      query += ' AND district = $3';
      params.push(memberData.district);
    }

    // Only check active members (no end date or future end date)
    query += ' AND (office_end_date IS NULL OR office_end_date > NOW())';

    if (excludeId) {
      query += ` AND id != $${params.length + 1}`;
      params.push(excludeId);
    }

    const result = await client.query(query, params);

    if (result.rows.length > 0) {
      const positionDesc = memberData.position === 'senator' 
        ? `senator for ${memberData.stateCode}` 
        : `representative for ${memberData.stateCode}-${memberData.district}`;
      throw new Error(`An active ${positionDesc} already exists`);
    }
  }

  /**
   * Find congressional member by ID
   */
  static async findById(id: string): Promise<CongressionalMember | null> {
    if (!id) {
      return null;
    }

    const result = await db.findById('congressional_members', id);
    if (!result) {
      return null;
    }

    return new CongressionalMember({
      id: result.id,
      name: result.name,
      position: result.position,
      stateCode: result.state_code,
      district: result.district,
      partyAffiliation: result.party_affiliation,
      officeStartDate: result.office_start_date,
      officeEndDate: result.office_end_date,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    });
  }

  /**
   * Find all congressional members with optional filters
   */
  static async findAll(
    filters: CongressionalMemberFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<CongressionalMember[]> {
    const client = await db.connect();
    try {
      let query = 'SELECT * FROM congressional_members WHERE 1=1';
      const params: any[] = [];
      let paramCounter = 1;

      // Apply filters
      if (filters.position) {
        query += ` AND position = $${paramCounter++}`;
        params.push(filters.position);
      }

      if (filters.stateCode) {
        query += ` AND state_code = $${paramCounter++}`;
        params.push(filters.stateCode.toUpperCase());
      }

      if (filters.partyAffiliation) {
        query += ` AND party_affiliation = $${paramCounter++}`;
        params.push(filters.partyAffiliation);
      }

      if (filters.isActive === true) {
        query += ' AND (office_end_date IS NULL OR office_end_date > NOW())';
      } else if (filters.isActive === false) {
        query += ' AND office_end_date IS NOT NULL AND office_end_date <= NOW()';
      }

      query += ` ORDER BY name ASC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return result.rows.map(row => new CongressionalMember({
        id: row.id,
        name: row.name,
        position: row.position,
        stateCode: row.state_code,
        district: row.district,
        partyAffiliation: row.party_affiliation,
        officeStartDate: row.office_start_date,
        officeEndDate: row.office_end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Count congressional members with filters
   */
  static async count(filters: CongressionalMemberFilters = {}): Promise<number> {
    const client = await db.connect();
    try {
      let query = 'SELECT COUNT(*) FROM congressional_members WHERE 1=1';
      const params: any[] = [];
      let paramCounter = 1;

      // Apply same filters as findAll
      if (filters.position) {
        query += ` AND position = $${paramCounter++}`;
        params.push(filters.position);
      }

      if (filters.stateCode) {
        query += ` AND state_code = $${paramCounter++}`;
        params.push(filters.stateCode.toUpperCase());
      }

      if (filters.partyAffiliation) {
        query += ` AND party_affiliation = $${paramCounter++}`;
        params.push(filters.partyAffiliation);
      }

      if (filters.isActive === true) {
        query += ' AND (office_end_date IS NULL OR office_end_date > NOW())';
      } else if (filters.isActive === false) {
        query += ' AND office_end_date IS NOT NULL AND office_end_date <= NOW()';
      }

      const result = await client.query(query, params);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Search congressional members by name
   */
  static async searchByName(nameQuery: string, limit: number = 20): Promise<CongressionalMember[]> {
    if (!nameQuery.trim()) {
      return [];
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM congressional_members 
         WHERE name ILIKE $1 
         ORDER BY 
           CASE WHEN name ILIKE $2 THEN 1 ELSE 2 END,
           name ASC 
         LIMIT $3`,
        [`%${nameQuery.trim()}%`, `${nameQuery.trim()}%`, limit]
      );

      return result.rows.map(row => new CongressionalMember({
        id: row.id,
        name: row.name,
        position: row.position,
        stateCode: row.state_code,
        district: row.district,
        partyAffiliation: row.party_affiliation,
        officeStartDate: row.office_start_date,
        officeEndDate: row.office_end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get members by state
   */
  static async findByState(stateCode: string): Promise<CongressionalMember[]> {
    return CongressionalMember.findAll({ stateCode, isActive: true });
  }

  /**
   * Get all senators
   */
  static async findSenators(stateCode?: string): Promise<CongressionalMember[]> {
    const filters: CongressionalMemberFilters = { position: 'senator', isActive: true };
    if (stateCode) {
      filters.stateCode = stateCode;
    }
    return CongressionalMember.findAll(filters);
  }

  /**
   * Get representatives by state
   */
  static async findRepresentatives(stateCode?: string): Promise<CongressionalMember[]> {
    const filters: CongressionalMemberFilters = { position: 'representative', isActive: true };
    if (stateCode) {
      filters.stateCode = stateCode;
    }
    return CongressionalMember.findAll(filters);
  }

  /**
   * Update congressional member information
   */
  async update(updates: Partial<CreateCongressionalMemberData>): Promise<void> {
    if (!this.id) {
      throw new Error('Congressional member ID is required to update');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Validate updates if position/state/district are being changed
    if (updates.position || updates.stateCode || updates.district !== undefined) {
      const mergedData = {
        position: updates.position || this.position,
        stateCode: updates.stateCode || this.stateCode,
        district: updates.district !== undefined ? updates.district : this.district,
        name: updates.name || this.name
      };

      // Apply validation rules
      if (mergedData.position === 'senator' && mergedData.district !== undefined) {
        throw new Error('Senators cannot have a district number');
      }

      if (mergedData.position === 'representative' && !mergedData.district) {
        throw new Error('Representatives must have a district number');
      }
    }

    if (updates.name) {
      fields.push(`name = $${paramCounter++}`);
      values.push(updates.name);
    }

    if (updates.position) {
      fields.push(`position = $${paramCounter++}`);
      values.push(updates.position);
    }

    if (updates.stateCode) {
      fields.push(`state_code = $${paramCounter++}`);
      values.push(updates.stateCode.toUpperCase());
    }

    if (updates.district !== undefined) {
      fields.push(`district = $${paramCounter++}`);
      values.push(updates.district);
    }

    if (updates.partyAffiliation !== undefined) {
      fields.push(`party_affiliation = $${paramCounter++}`);
      values.push(updates.partyAffiliation);
    }

    if (updates.officeStartDate !== undefined) {
      fields.push(`office_start_date = $${paramCounter++}`);
      values.push(updates.officeStartDate);
    }

    if (updates.officeEndDate !== undefined) {
      fields.push(`office_end_date = $${paramCounter++}`);
      values.push(updates.officeEndDate);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push(`updated_at = NOW()`);
    values.push(this.id);

    const client = await db.connect();
    try {
      // Validate uniqueness if relevant fields are being updated
      if (updates.position || updates.stateCode || updates.district !== undefined) {
        const validationData = {
          position: updates.position || this.position,
          stateCode: updates.stateCode || this.stateCode,
          district: updates.district !== undefined ? updates.district : this.district,
          name: updates.name || this.name
        };
        await CongressionalMember.validateUniqueness(client, validationData, this.id);
      }

      await client.query(
        `UPDATE congressional_members SET ${fields.join(', ')} WHERE id = $${paramCounter}`,
        values
      );

      // Update instance properties
      if (updates.name) this.name = updates.name;
      if (updates.position) this.position = updates.position;
      if (updates.stateCode) this.stateCode = updates.stateCode.toUpperCase();
      if (updates.district !== undefined) this.district = updates.district;
      if (updates.partyAffiliation !== undefined) this.partyAffiliation = updates.partyAffiliation;
      if (updates.officeStartDate !== undefined) this.officeStartDate = updates.officeStartDate;
      if (updates.officeEndDate !== undefined) this.officeEndDate = updates.officeEndDate;
      this.updatedAt = new Date();
    } finally {
      client.release();
    }
  }

  /**
   * End member's term (set office end date)
   */
  async endTerm(endDate: Date = new Date()): Promise<void> {
    await this.update({ officeEndDate: endDate });
  }

  /**
   * Check if member is currently active
   */
  isActive(): boolean {
    if (!this.officeEndDate) {
      return true;
    }
    return this.officeEndDate > new Date();
  }

  /**
   * Get member's full title
   */
  getTitle(): string {
    const positionTitle = this.position === 'senator' ? 'Senator' : 'Representative';
    const location = this.position === 'senator' 
      ? this.stateCode 
      : `${this.stateCode}-${this.district}`;
    return `${positionTitle} ${this.name} (${location})`;
  }

  /**
   * Get member's trading history count
   */
  async getTradingHistoryCount(): Promise<number> {
    if (!this.id) {
      return 0;
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM stock_trades WHERE trader_type = $1 AND trader_id = $2',
        ['congressional', this.id]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Get members with recent trading activity
   */
  static async findWithRecentTrades(days: number = 30, limit: number = 20): Promise<CongressionalMember[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT DISTINCT cm.* FROM congressional_members cm
         INNER JOIN stock_trades st ON cm.id = st.trader_id 
         WHERE st.trader_type = 'congressional' 
         AND st.transaction_date >= NOW() - INTERVAL '${days} days'
         ORDER BY cm.name ASC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map(row => new CongressionalMember({
        id: row.id,
        name: row.name,
        position: row.position,
        stateCode: row.state_code,
        district: row.district,
        partyAffiliation: row.party_affiliation,
        officeStartDate: row.office_start_date,
        officeEndDate: row.office_end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics by party
   */
  static async getPartyStatistics(): Promise<Array<{ party: string; count: number }>> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           COALESCE(party_affiliation, 'unknown') as party,
           COUNT(*) as count
         FROM congressional_members 
         WHERE office_end_date IS NULL OR office_end_date > NOW()
         GROUP BY party_affiliation
         ORDER BY count DESC`
      );

      return result.rows.map(row => ({
        party: row.party,
        count: parseInt(row.count)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics by state
   */
  static async getStateStatistics(): Promise<Array<{ state: string; count: number }>> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT 
           state_code as state,
           COUNT(*) as count
         FROM congressional_members 
         WHERE office_end_date IS NULL OR office_end_date > NOW()
         GROUP BY state_code
         ORDER BY count DESC`
      );

      return result.rows.map(row => ({
        state: row.state,
        count: parseInt(row.count)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find by name
   */
  static async findByName(name: string): Promise<CongressionalMember | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM congressional_members WHERE name = $1',
        [name]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const memberRow = result.rows[0];
      return new CongressionalMember({
        id: memberRow.id,
        name: memberRow.name,
        position: memberRow.position,
        stateCode: memberRow.state_code,
        district: memberRow.district,
        partyAffiliation: memberRow.party_affiliation,
        officeStartDate: memberRow.office_start_date,
        officeEndDate: memberRow.office_end_date,
        createdAt: memberRow.created_at,
        updatedAt: memberRow.updated_at
      });
    } finally {
      client.release();
    }
  }

  /**
   * Search members
   */
  static async search(query: string, limit: number = 10): Promise<CongressionalMember[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM congressional_members 
         WHERE name ILIKE $1 OR state_code ILIKE $1
         ORDER BY name ASC LIMIT $2`,
        [`%${query}%`, limit]
      );

      return result.rows.map(row => new CongressionalMember({
        id: row.id,
        name: row.name,
        position: row.position,
        stateCode: row.state_code,
        district: row.district,
        partyAffiliation: row.party_affiliation,
        officeStartDate: row.office_start_date,
        officeEndDate: row.office_end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get suggestions
   */
  static async getSuggestions(query: string, limit: number = 5): Promise<any[]> {
    const results = await this.search(query, limit);
    return results.map(member => ({
      id: member.id,
      name: member.name,
      type: 'politician'
    }));
  }

  /**
   * Get popular members
   */
  static async getPopular(limit: number = 10): Promise<any[]> {
    const results = await this.findWithRecentTrades(30, limit);
    return results.map(member => ({
      id: member.id,
      name: member.name,
      type: 'politician'
    }));
  }

  /**
   * Convert to JSON
   */
  toJSON(): CongressionalMemberData {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      stateCode: this.stateCode,
      district: this.district,
      partyAffiliation: this.partyAffiliation,
      officeStartDate: this.officeStartDate,
      officeEndDate: this.officeEndDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}