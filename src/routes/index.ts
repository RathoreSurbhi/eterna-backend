import { Router, Request, Response } from 'express';
import { aggregationService } from '../services/aggregation.service';
import { TokenFilter, TokenSort } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/tokens
 * Get paginated, filtered, and sorted tokens
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const cursor = req.query.cursor as string | undefined;

    // Parse filter
    const filter: TokenFilter | undefined = req.query.filter
      ? JSON.parse(req.query.filter as string)
      : undefined;

    // Parse sort
    const sort: TokenSort | undefined = req.query.sort
      ? JSON.parse(req.query.sort as string)
      : undefined;

    const result = await aggregationService.getTokens(limit, cursor, filter, sort);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Error in GET /tokens', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/tokens/:address
 * Get a specific token by address
 */
router.get('/tokens/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Token address is required',
      });
    }

    const token = await aggregationService.getTokenByAddress(address);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
      });
    }

    res.json({
      success: true,
      data: token,
    });
  } catch (error) {
    logger.error('Error in GET /tokens/:address', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/tokens/refresh
 * Force refresh the token cache
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await aggregationService.refreshCache();

    res.json({
      success: true,
      message: 'Cache refreshed successfully',
    });
  } catch (error) {
    logger.error('Error in POST /refresh', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
