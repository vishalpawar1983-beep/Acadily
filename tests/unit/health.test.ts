import { HealthCheckService } from '../../src/shared/infrastructure/health/HealthCheckService.js';

describe('HealthCheckService', () => {
  let service: HealthCheckService;

  beforeEach(() => {
    service = new HealthCheckService();
  });

  describe('liveness', () => {
    it('should return ok status with uptime', () => {
      const result = service.liveness();

      expect(result.status).toBe('ok');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('readiness', () => {
    it('should return down when MongoDB is not connected', async () => {
      const result = await service.readiness();

      // MongoDB is not connected in unit tests
      expect(result.checks?.mongodb.status).toBe('fail');
      expect(result.status).toBe('down');
    });

    it('should include memory and heap checks', async () => {
      const result = await service.readiness();

      expect(result.checks?.memory).toBeDefined();
      expect(result.checks?.memory.usedPercent).toBeGreaterThan(0);
      expect(result.checks?.heap).toBeDefined();
      expect(result.checks?.heap.usedPercent).toBeGreaterThan(0);
    });
  });
});
