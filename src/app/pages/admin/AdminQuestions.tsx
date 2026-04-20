import { useMemo, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Layers3, ListFilter, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { Link } from 'react-router';
import {
  ApiError,
  createQuestion,
  createSubject,
  deleteSubject,
  deleteQuestion,
  listAllQuestions,
  listSubjects,
  updateQuestion,
  uploadQuestionImage,
} from '../../../utils/api';
import { Question, SubjectConfig } from '../../../types';
import { getQuestionNumberInSection } from '../../../utils/testUtils';

type FilterValue = 'All' | string;

const baseFormData: Partial<Question> = {
  subjectId: '',
  question: '',
  imageUrl: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>(baseFormData);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadQuestionData = async () => {
    setIsLoading(true);

    try {
      const [subjectsResponse, questionsResponse] = await Promise.all([
        listSubjects(),
        listAllQuestions(),
      ]);

      setSubjects(subjectsResponse);
      setQuestions(questionsResponse);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load questions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestionData();
  }, []);

  const subjectNameById = useMemo(
    () =>
      subjects.reduce((acc, subject) => {
        acc[subject.id] = subject.name;
        return acc;
      }, {} as Record<string, string>),
    [subjects]
  );

  const filteredQuestions =
    filter === 'All'
      ? questions
      : questions.filter((question) => question.subjectId === filter);

  const sectionCounts = useMemo(
    () =>
      subjects.reduce(
        (acc, subject) => {
          acc[subject.id] = questions.filter((question) => question.subjectId === subject.id).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    [questions, subjects]
  );

  const coveredSectionsCount = subjects.filter((subject) => sectionCounts[subject.id] > 0).length;

  const questionStats = [
    {
      label: 'Total Questions',
      value: questions.length,
      icon: Layers3,
      tone: 'bg-slate-900 text-white',
    },
    {
      label: 'Visible in Current View',
      value: filteredQuestions.length,
      icon: ListFilter,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Sections Covered',
      value: coveredSectionsCount,
      icon: CheckCircle2,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];

  const selectedSubjectName = formData.subjectId ? subjectNameById[formData.subjectId] : '';

  const nextNumberForSelectedSection = useMemo(() => {
    if (!formData.subjectId) {
      return 1;
    }

    const selectedQuestions = questions.filter(
      (question) => question.subjectId === formData.subjectId
    );

    if (editingQuestion?.subjectId === formData.subjectId) {
      return getQuestionNumberInSection(selectedQuestions, {
        id: editingQuestion.id,
        section: editingQuestion.section,
      });
    }

    return selectedQuestions.length + 1;
  }, [editingQuestion, formData.subjectId, questions]);

  const handleOpenModal = (question?: Question) => {
    if (subjects.length === 0) {
      window.alert('Please add a course first.');
      return;
    }

    if (question) {
      setEditingQuestion(question);
      setFormData(question);
    } else {
      const firstSubjectId =
        filter !== 'All' ? filter : subjects[0]?.id ?? '';

      setEditingQuestion(null);
      setFormData({
        ...baseFormData,
        subjectId: firstSubjectId,
      });
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    setFormData(baseFormData);
  };

  const handleAddSubject = async () => {
    const name = newSubjectName.trim();

    if (!name) {
      showToast('Enter a course name.', 'error');
      return;
    }

    if (subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())) {
      showToast('Course already exists.', 'error');
      return;
    }

    try {
      const subject = await createSubject({
        name,
        timeLimitSeconds: 30 * 60,
        questionCount: 10,
      });

      setSubjects((current) => [...current, subject]);
      setNewSubjectName('');
      showToast('Course added.');
    } catch (createError) {
      showToast(
        createError instanceof Error ? createError.message : 'Unable to add course.',
        'error'
      );
    }
  };

  const handleSave = async () => {
    if (
      !formData.subjectId ||
      !formData.question?.trim() ||
      !formData.optionA?.trim() ||
      !formData.optionB?.trim() ||
      !formData.optionC?.trim() ||
      !formData.optionD?.trim() ||
      !formData.correctAnswer
    ) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsSaving(true);

    try {
      let savedQuestion: Question;

      if (editingQuestion) {
        savedQuestion = await updateQuestion(editingQuestion.id, {
          subjectId: formData.subjectId,
          question: formData.question,
          imageUrl: formData.imageUrl?.trim() ? formData.imageUrl.trim() : null,
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctAnswer: formData.correctAnswer,
        });

        setQuestions((current) =>
          current.map((question) => (question.id === savedQuestion.id ? savedQuestion : question))
        );
      } else {
        savedQuestion = await createQuestion({
          subjectId: formData.subjectId,
          question: formData.question,
          imageUrl: formData.imageUrl?.trim() || undefined,
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctAnswer: formData.correctAnswer,
        });

        setQuestions((current) => [savedQuestion, ...current]);
      }

      handleCloseModal();
      showToast(editingQuestion ? 'Question updated.' : 'Question added.');
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : 'Unable to save question.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsSaving(true);

    try {
      const upload = await uploadQuestionImage(file);
      setFormData((current) => ({
        ...current,
        imageUrl: upload.url,
      }));
      showToast('Image uploaded.');
    } catch (uploadError) {
      showToast(
        uploadError instanceof Error ? uploadError.message : 'Unable to upload image.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await deleteQuestion(id);
      setQuestions((current) => current.filter((question) => question.id !== id));
      showToast('Question deleted.');
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete question.',
        'error'
      );
    }
  };

  const handleDeleteSubject = async (subject: SubjectConfig) => {
    const linkedQuestionCount = sectionCounts[subject.id] ?? 0;
    const confirmed = window.confirm(
      `Delete "${subject.name}"? This will permanently remove the course, ${linkedQuestionCount} linked question${
        linkedQuestionCount === 1 ? '' : 's'
      }, and related unused UIN assignments from the backend data.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingSubjectId(subject.id);

    try {
      await deleteSubject(subject.id);

      if (filter === subject.id) {
        setFilter('All');
      }

      await loadQuestionData();
      showToast('Course deleted.');
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete course.',
        'error'
      );
    } finally {
      setDeletingSubjectId(null);
    }
  };

  const filterLabel =
    filter === 'All' ? 'All Sections' : `${subjectNameById[filter] ?? 'Selected'} Questions`;

  return (
    <AdminLayout>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-full px-4 py-2 text-sm shadow-lg ${
            toast.tone === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#164e63_100%)] p-8 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.8)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Question Bank
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Build a section-aware question library.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-200 md:text-base">
                Start by adding courses, then create questions within each course.
              </p>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {questionStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-300">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${stat.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/75 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="New course name"
                className="w-64 rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
              />
              <button
                onClick={() => void handleAddSubject()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                Add Course
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adding a course here also makes it available for UIN setup and timers.
            </p>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">No courses yet.</p>
              <p className="mt-1">Add a course to start creating questions.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`rounded-3xl border p-5 text-left transition ${
                    filter === subject.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:shadow-cyan-500/20'
                      : 'border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => setFilter(subject.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm">{subject.name}</p>
                      <p className="mt-3 text-3xl font-semibold">{sectionCounts[subject.id] ?? 0}</p>
                      <p
                        className={`mt-2 text-xs ${
                          filter === subject.id ? 'text-slate-300 dark:text-slate-900/70' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Questions in this course
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteSubject(subject)}
                      disabled={deletingSubjectId === subject.id}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        filter === subject.id
                          ? 'border-white/20 text-white hover:bg-white/10 dark:border-slate-950/20 dark:text-slate-950 dark:hover:bg-slate-950/10'
                          : 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {deletingSubjectId === subject.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/85 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/75">
            <button
              onClick={() => setFilter('All')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                filter === 'All'
                  ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
              }`}
            >
              All
            </button>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setFilter(subject.id)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filter === subject.id
                    ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)] md:p-6">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {filterLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredQuestions.length} of {questions.length} total question{questions.length === 1 ? '' : 's'} across {coveredSectionsCount} section{coveredSectionsCount === 1 ? '' : 's'} ({filter === 'All' ? 'no filter' : `filtered by ${subjectNameById[filter]}`}). 
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Showing {filteredQuestions.length} question{filteredQuestions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Total Questions: {questions.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Visible in Current View: {filteredQuestions.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Sections Covered: {coveredSectionsCount}
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                Loading question bank...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200">No questions yet.</p>
                <p className="mt-1">Create courses and add questions to see them listed here.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link
                    to="/admin/uin"
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Manage Courses/UINs
                  </Link>
                </div>
              </div>
            ) : (
              filteredQuestions.map((question) => {
                const sectionQuestions = questions.filter(
                  (item) => item.subjectId === question.subjectId
                );
                const questionNumber = getQuestionNumberInSection(sectionQuestions, question);

                return (
                  <article
                    key={question.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700 dark:hover:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-100">
                            {question.section}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Question {questionNumber}
                          </span>
                        </div>

                        <p className="text-base leading-7 text-slate-900 dark:text-slate-100 md:text-lg">
                          {question.question}
                        </p>

                        {question.imageUrl ? (
                          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                            <img
                              src={question.imageUrl}
                              alt="Question reference"
                              className="max-h-72 w-full rounded-[1.1rem] object-contain"
                            />
                          </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-2">
                          {(['A', 'B', 'C', 'D'] as const).map((option) => {
                            const isCorrect = question.correctAnswer === option;
                            const text = question[`option${option}`];

                            return (
                              <div
                                key={option}
                              className={`rounded-2xl border p-4 text-sm ${
                                isCorrect
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'
                              }`}
                            >
                                <span className="font-semibold">{option}.</span> {text}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:pl-4">
                        <button
                          onClick={() => handleOpenModal(question)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-100"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(question.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white shadow-[0_35px_120px_-35px_rgba(15,23,42,0.65)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_35px_120px_-35px_rgba(8,145,178,0.35)]">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  {editingQuestion ? 'Update Entry' : 'Create Entry'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  This will appear as Question {nextNumberForSelectedSection} in the{' '}
                  {selectedSubjectName || 'selected'} section on the admin panel.
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6">
              <div>
                <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Section</label>
                <select
                  value={formData.subjectId}
                  onChange={(event) =>
                    setFormData({ ...formData, subjectId: event.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Question</label>
                <textarea
                  value={formData.question}
                  onChange={(event) => setFormData({ ...formData, question: event.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                  placeholder="Enter the full question text"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Question Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleImageUpload(event)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Optional. Upload an image that should appear with this question.
                  </p>
                </div>
                {formData.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
                  >
                    Remove Image
                  </button>
                ) : null}
              </div>

              {formData.imageUrl ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <img
                    src={formData.imageUrl}
                    alt="Question preview"
                    className="max-h-80 w-full rounded-[1.1rem] object-contain"
                  />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Option A</label>
                  <input
                    type="text"
                    value={formData.optionA}
                    onChange={(event) => setFormData({ ...formData, optionA: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    placeholder="Enter option A"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Option B</label>
                  <input
                    type="text"
                    value={formData.optionB}
                    onChange={(event) => setFormData({ ...formData, optionB: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    placeholder="Enter option B"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Option C</label>
                  <input
                    type="text"
                    value={formData.optionC}
                    onChange={(event) => setFormData({ ...formData, optionC: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    placeholder="Enter option C"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Option D</label>
                  <input
                    type="text"
                    value={formData.optionD}
                    onChange={(event) => setFormData({ ...formData, optionD: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    placeholder="Enter option D"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">Correct Answer</label>
                <select
                  value={formData.correctAnswer}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      correctAnswer: event.target.value as Question['correctAnswer'],
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/95 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
              <button
                onClick={handleCloseModal}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
