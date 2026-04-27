import { Router } from 'express';
import { resultIdParamSchema, resultsQuerySchema } from './results.schema.js';
import { validate } from '../../common/validation/validate.js';
import { createHttpError } from '../../common/errors/http-error.js';
import { readStore } from '../../lib/store.js';
import { toResultResponse } from '../../common/utils/serializers.js';

const router = Router();

router.get('/', validate({ query: resultsQuerySchema }), async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : undefined;
  const sortBy = req.query.sortBy ?? 'date';
  const sortOrder = req.query.sortOrder ?? 'desc';
  const academicYear =
    typeof req.query.academicYear === 'string' ? req.query.academicYear : undefined;

  const response = await readStore((store) => {
    const filteredResults = store.results
      .filter((result) => (academicYear ? result.academicYear === academicYear : true))
      .filter((result) => {
        if (!search) {
          return true;
        }

        const uin = store.uins.find((item) => item.id === result.uinId);
        const haystack = [
          result.candidateName,
          result.candidateSurname,
          `${result.candidateName} ${result.candidateSurname}`,
          uin?.code ?? '',
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort((left, right) => {
        let comparison = 0;

        if (sortBy === 'score') {
          comparison = left.percentage - right.percentage;
        } else if (sortBy === 'name') {
          comparison = `${left.candidateSurname} ${left.candidateName}`.localeCompare(
            `${right.candidateSurname} ${right.candidateName}`
          );
        } else {
          comparison = left.completedAt.localeCompare(right.completedAt);
        }

        return sortOrder === 'asc' ? comparison : comparison * -1;
      });

    const total = filteredResults.length;
    const startIndex = (page - 1) * limit;

    return {
      items: filteredResults
        .slice(startIndex, startIndex + limit)
        .map((result) => toResultResponse(store, result)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  });

  res.json(response);
});

router.get('/:id', validate({ params: resultIdParamSchema }), async (req, res) => {
  const result = await readStore((store) => {
    const existingResult = store.results.find((item) => item.id === req.params.id);

    if (!existingResult) {
      throw createHttpError(404, 'Result not found');
    }

    return toResultResponse(store, existingResult, {
      includeAnswerReview: true,
    });
  });

  res.json(result);
});

export default router;
