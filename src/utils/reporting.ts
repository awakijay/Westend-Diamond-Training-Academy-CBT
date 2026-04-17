import { TestResult } from '../types';

export const getAcademicYear = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

export const getResultPercentage = (result: TestResult): number => {
  if (typeof result.percentage === 'number') {
    return result.percentage;
  }

  if (!result.totalQuestions) {
    return 0;
  }

  return (result.totalScore / result.totalQuestions) * 100;
};

export const getResultStatus = (result: TestResult): 'Pass' | 'Fail' => {
  return result.status ?? (getResultPercentage(result) >= 50 ? 'Pass' : 'Fail');
};

const escapeCsvValue = (value: string): string => {
  const normalized = value.replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
};

export const downloadCsv = (filename: string, headers: string[], rows: string[][]): void => {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const getSectionBreakdownLabel = (result: TestResult): string => {
  return result.sectionResults
    .map((section) => `${section.section}: ${section.score}/${section.total}`)
    .join(' | ');
};
