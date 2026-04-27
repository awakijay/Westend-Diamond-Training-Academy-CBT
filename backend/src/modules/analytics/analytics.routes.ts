import { Router } from 'express';
import { calculatePercentage } from '../../common/utils/exam.js';
import { readStore, type AnswerOption } from '../../lib/store.js';

const router = Router();
const answerOptionOrder = ['A', 'B', 'C', 'D'] as const;

type AnalyticsRespondent = {
  completedAt: string;
  fullName: string;
  isCorrect: boolean;
  name: string;
  resultId: string;
  selectedAnswer: AnswerOption | null;
  sessionId: string;
  surname: string;
  uin: string | null;
};

type OptionKey = AnswerOption | 'UNANSWERED';

type QuestionResponseAggregate = {
  answeredCount: number;
  correctAnswer: AnswerOption;
  correctCount: number;
  correctRespondents: AnalyticsRespondent[];
  imageUrl: string | null;
  incorrectCount: number;
  incorrectRespondents: AnalyticsRespondent[];
  optionA: string;
  optionB: string;
  optionBreakdown: Record<
    OptionKey,
    {
      count: number;
      respondents: AnalyticsRespondent[];
    }
  >;
  optionC: string;
  optionD: string;
  question: string;
  questionId: string;
  subjectId: string;
  subjectName: string;
  totalResponses: number;
  unansweredCount: number;
  unansweredRespondents: AnalyticsRespondent[];
};

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

router.get('/question-responses', async (_req, res) => {
  const response = await readStore((store) => {
    const resultBySessionId = new Map(store.results.map((result) => [result.sessionId, result]));
    const uinById = new Map(store.uins.map((uin) => [uin.id, uin]));
    const sectionById = new Map(store.sessionSections.map((section) => [section.id, section]));
    const answersBySessionQuestionId = new Map(
      store.sessionAnswers.map((answer) => [answer.sessionQuestionId, answer.answer])
    );
    const questionAnalytics = new Map<string, QuestionResponseAggregate>();

    store.sessionQuestions.forEach((question) => {
      const result = resultBySessionId.get(question.sessionId);

      if (!result) {
        return;
      }

      const section = sectionById.get(question.sessionSectionId);
      const selectedAnswer = answersBySessionQuestionId.get(question.id) ?? null;
      const uin = uinById.get(result.uinId);
      const respondent: AnalyticsRespondent = {
        completedAt: result.completedAt,
        fullName: `${result.candidateName} ${result.candidateSurname}`.trim(),
        isCorrect: selectedAnswer === question.correctAnswerSnapshot,
        name: result.candidateName,
        resultId: result.id,
        selectedAnswer,
        sessionId: result.sessionId,
        surname: result.candidateSurname,
        uin: uin?.code ?? null,
      };
      const aggregate = questionAnalytics.get(question.questionId) ?? {
        answeredCount: 0,
        correctAnswer: question.correctAnswerSnapshot,
        correctCount: 0,
        correctRespondents: [],
        imageUrl: question.imageUrlSnapshot,
        incorrectCount: 0,
        incorrectRespondents: [],
        optionA: question.optionASnapshot,
        optionB: question.optionBSnapshot,
        optionBreakdown: {
          A: { count: 0, respondents: [] },
          B: { count: 0, respondents: [] },
          C: { count: 0, respondents: [] },
          D: { count: 0, respondents: [] },
          UNANSWERED: { count: 0, respondents: [] },
        },
        optionC: question.optionCSnapshot,
        optionD: question.optionDSnapshot,
        question: question.questionTextSnapshot,
        questionId: question.questionId,
        subjectId: question.subjectId,
        subjectName: section?.subjectNameSnapshot ?? 'Unknown Course',
        totalResponses: 0,
        unansweredCount: 0,
        unansweredRespondents: [],
      };

      aggregate.totalResponses += 1;

      if (selectedAnswer === null) {
        aggregate.unansweredCount += 1;
        aggregate.unansweredRespondents.push(respondent);
        aggregate.optionBreakdown.UNANSWERED.count += 1;
        aggregate.optionBreakdown.UNANSWERED.respondents.push(respondent);
      } else {
        aggregate.answeredCount += 1;
        aggregate.optionBreakdown[selectedAnswer].count += 1;
        aggregate.optionBreakdown[selectedAnswer].respondents.push(respondent);

        if (selectedAnswer === question.correctAnswerSnapshot) {
          aggregate.correctCount += 1;
          aggregate.correctRespondents.push(respondent);
        } else {
          aggregate.incorrectCount += 1;
          aggregate.incorrectRespondents.push(respondent);
        }
      }

      questionAnalytics.set(question.questionId, aggregate);
    });

    const items = [...questionAnalytics.values()]
      .map((item) => ({
        questionId: item.questionId,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        question: item.question,
        imageUrl: item.imageUrl,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctAnswer: item.correctAnswer,
        totalResponses: item.totalResponses,
        answeredCount: item.answeredCount,
        correctCount: item.correctCount,
        incorrectCount: item.incorrectCount,
        unansweredCount: item.unansweredCount,
        correctRate: calculatePercentage(item.correctCount, item.totalResponses),
        optionBreakdown: [
          ...answerOptionOrder.map((option) => ({
            option,
            label: `${option}. ${
              item[
                `option${option}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'
              ]
            }`,
            count: item.optionBreakdown[option].count,
            isCorrectOption: item.correctAnswer === option,
            respondents: [...item.optionBreakdown[option].respondents].sort((left, right) =>
              left.fullName.localeCompare(right.fullName)
            ),
          })),
          {
            option: 'UNANSWERED' as const,
            label: 'No Answer',
            count: item.optionBreakdown.UNANSWERED.count,
            isCorrectOption: false,
            respondents: [...item.optionBreakdown.UNANSWERED.respondents].sort((left, right) =>
              left.fullName.localeCompare(right.fullName)
            ),
          },
        ],
        correctRespondents: [...item.correctRespondents].sort((left, right) =>
          left.fullName.localeCompare(right.fullName)
        ),
        incorrectRespondents: [...item.incorrectRespondents].sort((left, right) =>
          left.fullName.localeCompare(right.fullName)
        ),
        unansweredRespondents: [...item.unansweredRespondents].sort((left, right) =>
          left.fullName.localeCompare(right.fullName)
        ),
      }))
      .sort((left, right) => {
        if (right.incorrectCount !== left.incorrectCount) {
          return right.incorrectCount - left.incorrectCount;
        }

        if (right.totalResponses !== left.totalResponses) {
          return right.totalResponses - left.totalResponses;
        }

        return `${left.subjectName} ${left.question}`.localeCompare(
          `${right.subjectName} ${right.question}`
        );
      });

    return {
      items,
      summary: {
        questionsCovered: items.length,
        totalResponses: items.reduce((sum, item) => sum + item.totalResponses, 0),
        answeredResponses: items.reduce((sum, item) => sum + item.answeredCount, 0),
        correctResponses: items.reduce((sum, item) => sum + item.correctCount, 0),
        incorrectResponses: items.reduce((sum, item) => sum + item.incorrectCount, 0),
        unansweredResponses: items.reduce((sum, item) => sum + item.unansweredCount, 0),
      },
    };
  });

  res.json(response);
});

export default router;
