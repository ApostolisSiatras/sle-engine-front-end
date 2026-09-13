import { useMemo, useState } from 'react';
import { levels } from './data/levels.js';
import { evaluateAnswer, generateQuestion, loadLevelText } from './services/llmClient.js';
import LevelList from './components/LevelList.jsx';
import LevelContent from './components/LevelContent.jsx';
import PracticePanel from './components/PracticePanel.jsx';

const emptyAttempt = (number) => ({ number, questions: [], results: [], completed: false });

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState(levels[0].id);
  const [attemptsByLevel, setAttemptsByLevel] = useState({});
  const [pending, setPending] = useState(null);
  const [errorByLevel, setErrorByLevel] = useState({});
  const activeLevel = useMemo(() => levels.find((level) => level.id === activeLevelId), [activeLevelId]);
  const attempts = attemptsByLevel[activeLevelId] || [];
  const attempt = attempts.at(-1);
  const isLoading = pending?.levelId === activeLevelId;

  const historyFor = (levelId) => (attemptsByLevel[levelId] || []);
  const createQuestion = async (level, targetAttempt, snapshotAttempts) => {
    const levelId = level.id;
    setErrorByLevel((current) => ({ ...current, [levelId]: null })); setPending({ levelId, kind: 'question' });
    try {
      const levelText = await loadLevelText(level.file);
      const prior = snapshotAttempts.flatMap((item) => item.questions).map(({ questionText, targetedConcept }) => ({ questionText, targetedConcept }));
      const mistakes = snapshotAttempts.flatMap((item) => item.results).filter((result) => !result.isCorrect).map((result) => [result.targetedConcept, result.mistakeCategory].filter(Boolean).join(': ')).filter(Boolean);
      const currentCorrectStreak = [...targetAttempt.results].reverse().findIndex((result) => !result.isCorrect);
      const generated = await generateQuestion({ level, levelText, attemptNumber: targetAttempt.number, priorQuestions: prior, mistakes, correctStreak: currentCorrectStreak === -1 ? targetAttempt.results.length : currentCorrectStreak });
      setAttemptsByLevel((current) => ({ ...current, [levelId]: (current[levelId] || []).map((item) => item.number === targetAttempt.number ? { ...item, questions: [...item.questions, { ...generated, id: crypto.randomUUID() }] } : item) }));
    } catch (error) { setErrorByLevel((current) => ({ ...current, [levelId]: error.message })); } finally { setPending(null); }
  };
  const start = async () => {
    const all = historyFor(activeLevel.id); const number = all.length + 1; const newAttempt = emptyAttempt(number);
    setAttemptsByLevel((current) => ({ ...current, [activeLevel.id]: [...(current[activeLevel.id] || []), newAttempt] }));
    await createQuestion(activeLevel, newAttempt, all);
  };
  const answer = async (learnerAnswer) => {
    const activeQuestion = attempt.questions.at(-1); const levelId = activeLevel.id;
    setErrorByLevel((current) => ({ ...current, [levelId]: null })); setPending({ levelId, kind: 'feedback', learnerAnswer });
    try {
      const earlier = historyFor(levelId).slice(0, -1); const mistakes = earlier.flatMap((item) => item.results).filter((result) => !result.isCorrect).map((result) => [result.targetedConcept, result.mistakeCategory].filter(Boolean).join(': ')).filter(Boolean);
      const result = await evaluateAnswer({ level: activeLevel, question: activeQuestion, learnerAnswer, attemptNumber: attempt.number, mistakes });
      setAttemptsByLevel((current) => ({ ...current, [levelId]: (current[levelId] || []).map((item) => item.number === attempt.number ? { ...item, questions: item.questions.map((question) => question.id === activeQuestion.id ? { ...question, learnerAnswer, feedback: result } : question), results: [...item.results, { ...result, targetedConcept: activeQuestion.targetedConcept }] } : item) }));
    } catch (error) { setErrorByLevel((current) => ({ ...current, [levelId]: error.message })); } finally { setPending(null); }
  };
  const next = () => createQuestion(activeLevel, attempt, historyFor(activeLevel.id).slice(0, -1));
  const complete = () => setAttemptsByLevel((current) => ({ ...current, [activeLevel.id]: (current[activeLevel.id] || []).map((item) => item.number === attempt.number ? { ...item, completed: true } : item) }));
  const retryRequest = () => pending?.kind === 'feedback' ? answer(pending.learnerAnswer) : createQuestion(activeLevel, attempt, historyFor(activeLevel.id).slice(0, -1));
  const visibleAttempt = attempt?.completed ? undefined : attempt;

  return <main className="app-shell"><header className="app-header"><span>🕉️</span><div><p className="eyebrow">Samskrita Swayam Shikshaka</p><h1>Adaptive learning companion</h1></div></header><div className="app-layout"><LevelList levels={levels} activeLevelId={activeLevelId} onSelect={setActiveLevelId} /><LevelContent level={activeLevel} /><PracticePanel level={activeLevel} attempt={visibleAttempt} hasPreviousAttempts={attempts.length > 0} isLoading={isLoading} error={errorByLevel[activeLevelId]} onStart={start} onAnswer={answer} onNext={next} onComplete={complete} onRetryRequest={retryRequest} /></div></main>;
}
