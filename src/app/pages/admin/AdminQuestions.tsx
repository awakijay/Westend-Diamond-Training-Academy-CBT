import { useMemo, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Layers3, ListFilter, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { Link } from 'react-router';
import {
  getQuestions,
  setQuestions,
  getSubjectConfigs,
  setSubjectConfigs,
  getSectionTimeLimits,
  setSectionTimeLimits,
  getSectionQuestionCounts,
  setSectionQuestionCounts,
} from '../../../utils/storage';
import { Question, Section, SubjectConfig } from '../../../types';
import { getQuestionNumberInSection, getSections } from '../../../utils/testUtils';

const baseFormData: Partial<Question> = {
  section: '',
  question: '',
  imageUrl: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
};

export default function AdminQuestions() {
  const [questions, setQuestionsState] = useState(getQuestions());
  const [filter, setFilter] = useState<string | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>(baseFormData);
  const [allSections, setAllSections] = useState<string[]>(getSections());
  const [newSubjectName, setNewSubjectName] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const refresh = () => {
      setQuestionsState(getQuestions());
      setAllSections(getSections());
    };

    window.addEventListener('cbt-storage-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cbt-storage-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const sectionFilters: (string | 'All')[] = ['All', ...allSections];

  const filteredQuestions = filter === 'All'
    ? questions
    : questions.filter((question) => question.section === filter);

  const sectionCounts = useMemo(
    () =>
      allSections.reduce(
        (acc, section) => {
          acc[section] = questions.filter((question) => question.section === section).length;
          return acc;
        },
        {} as Record<Section, number>
      ),
    [questions, allSections]
  );

  const coveredSectionsCount = allSections.filter((section) => sectionCounts[section] > 0).length;

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

  const nextNumberForSelectedSection = useMemo(() => {
    const selectedSection = formData.section ?? 'Mathematics';

    if (editingQuestion?.section === selectedSection) {
      return getQuestionNumberInSection(questions, editingQuestion);
    }

    return questions.filter((question) => question.section === selectedSection).length + 1;
  }, [editingQuestion, formData.section, questions]);

  const handleOpenModal = (question?: Question) => {
    if (allSections.length === 0) {
      alert('Please add a course first.');
      return;
    }

    if (question) {
      setEditingQuestion(question);
      setFormData(question);
    } else {
      setEditingQuestion(null);
      setFormData({
        ...baseFormData,
        section: filter !== 'All' ? filter : allSections[0] ?? 'Mathematics',
      });
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    setFormData(baseFormData);
  };

  const handleAddSubject = () => {
    const name = newSubjectName.trim();
    if (!name) {
      showToast('Enter a course name.', 'error');
      return;
    }

    const currentConfigs = getSubjectConfigs();
    if (currentConfigs.some((subject) => subject.name.toLowerCase() === name.toLowerCase())) {
      showToast('Course already exists.', 'error');
      return;
    }

    const newSubject: SubjectConfig = {
      id: `${Date.now()}`,
      name,
      minutes: 30,
      questions: 10,
    };

    const updatedConfigs = [...currentConfigs, newSubject];
    setSubjectConfigs(updatedConfigs);

    // Ensure timers and question counts include the new subject with defaults
    const limits = { ...getSectionTimeLimits(), [name]: newSubject.minutes * 60 };
    const counts = { ...getSectionQuestionCounts(), [name]: newSubject.questions };
    setSectionTimeLimits(limits);
    setSectionQuestionCounts(counts);

    setAllSections(getSections());
    setNewSubjectName('');
    showToast('Course added.');
  };

  const handleSave = () => {
    if (
      !formData.question?.trim() ||
      !formData.optionA?.trim() ||
      !formData.optionB?.trim() ||
      !formData.optionC?.trim() ||
      !formData.optionD?.trim()
    ) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    let updatedQuestions: Question[];

    if (editingQuestion) {
      updatedQuestions = questions.map((question) =>
        question.id === editingQuestion.id
          ? ({ ...formData, id: question.id } as Question)
          : question
      );
    } else {
      updatedQuestions = [
        ...questions,
        {
          id: `custom-${Date.now()}`,
          section: formData.section!,
          question: formData.question!,
          imageUrl: formData.imageUrl?.trim() || undefined,
          optionA: formData.optionA!,
          optionB: formData.optionB!,
          optionC: formData.optionC!,
          optionD: formData.optionD!,
          correctAnswer: formData.correctAnswer!,
        },
      ];
    }

    setQuestions(updatedQuestions);
    setQuestionsState(updatedQuestions);
    handleCloseModal();
    showToast(editingQuestion ? 'Question updated.' : 'Question added.');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        imageUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter((question) => question.id !== id);
      setQuestions(updatedQuestions);
      setQuestionsState(updatedQuestions);
    }
  };

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

        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="New course name"
                className="w-64 rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-slate-900"
              />
              <button
                onClick={handleAddSubject}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Course
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Adding a course here also makes it available for UIN setup and timers.
            </p>
          </div>

          {allSections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">No courses yet.</p>
              <p className="mt-1">Add a course to start creating questions.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="New course name"
                  className="w-56 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
                />
                <button
                  onClick={handleAddSubject}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Add Course
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {allSections.map((section) => (
                <button
                  key={section}
                  onClick={() => setFilter(section)}
                  className={`rounded-3xl border p-5 text-left transition ${
                    filter === section
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                      : 'border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm">{section}</p>
                  <p className="mt-3 text-3xl font-semibold">{sectionCounts[section]}</p>
                  <p className={`mt-2 text-xs ${filter === section ? 'text-slate-300' : 'text-slate-500'}`}>
                    Questions in this course
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/85 p-3 shadow-sm">
            {sectionFilters.map((section) => (
              <button
                key={section}
                onClick={() => setFilter(section)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filter === section
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] md:p-6">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {filter === 'All' ? 'All Sections' : `${filter} Questions`}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredQuestions.length} of {questions.length} total question{questions.length === 1 ? '' : 's'} across {coveredSectionsCount} section{coveredSectionsCount === 1 ? '' : 's'} ({filter === 'All' ? 'no filter' : `filtered by ${filter}`}).
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Showing {filteredQuestions.length} question{filteredQuestions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Total Questions: {questions.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Visible in Current View: {filteredQuestions.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Sections Covered: {coveredSectionsCount}
            </span>
          </div>

          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-500">
                <p className="font-semibold text-slate-800">No questions yet.</p>
                <p className="mt-1">Create courses and add questions to see them listed here.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {/* <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Add Question
                  </button> */}
                  <Link
                    to="/admin/uin"
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Manage Courses/UINs
                  </Link>
                </div>
              </div>
            ) : (
              filteredQuestions.map((question) => {
                const questionNumber = getQuestionNumberInSection(questions, question);

                return (
                  <article
                    key={question.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                            {question.section}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Question {questionNumber}
                          </span>
                        </div>

                        <p className="text-base leading-7 text-slate-900 md:text-lg">
                          {question.question}
                        </p>

                        {question.imageUrl ? (
                          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
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
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                    : 'border-slate-200 bg-slate-50 text-slate-700'
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
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white shadow-[0_35px_120px_-35px_rgba(15,23,42,0.65)]">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-6 backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {editingQuestion ? 'Update Entry' : 'Create Entry'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  This will appear as Question {nextNumberForSelectedSection} in the{' '}
                  {formData.section} section on the admin panel.
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6">
              <div>
                <label className="mb-2 block text-sm text-slate-700">Section</label>
                <select
                  value={formData.section}
                  onChange={(event) =>
                    setFormData({ ...formData, section: event.target.value as Section })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  {allSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-700">Question</label>
                <textarea
                  value={formData.question}
                  onChange={(event) => setFormData({ ...formData, question: event.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                  placeholder="Enter the full question text"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Question Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Optional. Upload an image that should appear with this question.
                  </p>
                </div>
                {formData.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Remove Image
                  </button>
                ) : null}
              </div>

              {formData.imageUrl ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={formData.imageUrl}
                    alt="Question preview"
                    className="max-h-80 w-full rounded-[1.1rem] object-contain"
                  />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Option A</label>
                  <input
                    type="text"
                    value={formData.optionA}
                    onChange={(event) => setFormData({ ...formData, optionA: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Enter option A"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Option B</label>
                  <input
                    type="text"
                    value={formData.optionB}
                    onChange={(event) => setFormData({ ...formData, optionB: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Enter option B"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Option C</label>
                  <input
                    type="text"
                    value={formData.optionC}
                    onChange={(event) => setFormData({ ...formData, optionC: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Enter option C"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Option D</label>
                  <input
                    type="text"
                    value={formData.optionD}
                    onChange={(event) => setFormData({ ...formData, optionD: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Enter option D"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-700">Correct Answer</label>
                <select
                  value={formData.correctAnswer}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      correctAnswer: event.target.value as 'A' | 'B' | 'C' | 'D',
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/95 p-6 backdrop-blur-xl">
              <button
                onClick={handleCloseModal}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-600 transition hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Save className="h-4 w-4" />
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
