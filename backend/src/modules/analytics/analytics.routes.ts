import { Router } from 'express';
import { calculatePercentage } from '../../common/utils/exam.js';
import { readStore } from '../../lib/store.js';

const router = Router();

router.get('/academic-years', async (_req, res) => {
  const items = await readStore((store) => {
    const analyticsMap = new Map<
      string,
      {
        averageScore: number;
        failed: number;
        passed: number;
        totalTests: number;
        totalPercentage: number;
      }
    >();

    store.results.forEach((result) => {
      const existing = analyticsMap.get(result.academicYear) ?? {
        averageScore: 0,
        failed: 0,
        passed: 0,
        totalTests: 0,
        totalPercentage: 0,
      };

      existing.totalTests += 1;
      existing.totalPercentage += result.percentage;

      if (result.status === 'PASS') {
        existing.passed += 1;
      } else {
        existing.failed += 1;
      }

      analyticsMap.set(result.academicYear, existing);
    });

    return [...analyticsMap.entries()]
      .map(([academicYear, entry]) => ({
        academicYear,
        totalTests: entry.totalTests,
        passed: entry.passed,
        failed: entry.failed,
        passRate: calculatePercentage(entry.passed, entry.totalTests),
        averageScore: Number((entry.totalPercentage / entry.totalTests).toFixed(2)),
      }))
      .sort((left, right) => right.academicYear.localeCompare(left.academicYear));
  });

  res.json(items);
});

export default router;
