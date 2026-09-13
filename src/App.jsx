import { useMemo, useState } from 'react';
import { levels } from './data/levels.js';
import { evaluateAnswer, generateQuestion, loadLevelText } from './services/llmClient.js';
import LevelList from './components/LevelList.jsx';
import LevelContent from './components/LevelContent.jsx';
import PracticePanel from './components/PracticePanel.jsx';

const emptyAttempt = (number) => ({ number, questions: [], results: [], completed: false });
const MINIMUM_QUESTIONS_TO_PASS = 3;
const PASSING_SCORE = 0.7;

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState(levels[0].id);
  const [attemptsByLevel, setAttemptsByLevel] = useState({});
  const [pending, setPending] = useState(null);
  const [errorByLevel, setErrorByLevel] = useState({});
  const [passedLevelId, setPassedLevelId] = useState(null);
  const activeLevel = useMemo(() => levels.find((level) => level.id === activeLevelId), [activeLevelId]);
  const attempts = attemptsByLevel[activeLevelId] || [];
  const attempt = attempts.at(-1);
  const isLoading = pending?.levelId === activeLevelId;

  const historyFor = (levelId) => (attemptsByLevel[levelId] || []);
  const hasPassed = (levelId) => historyFor(levelId).some((item) => item.passed);
  const unlockedLevelIds = levels.filter((level, index) => index === 0 || hasPassed(levels[index - 1].id)).map((level) => level.id);
  const isActiveLevelUnlocked = unlockedLevelIds.includes(activeLevelId);
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
    if (!isActiveLevelUnlocked) return;
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
  const complete = () => {
    if (!attempt || attempt.results.length < MINIMUM_QUESTIONS_TO_PASS) return;
    const correct = attempt.results.filter((result) => result.isCorrect).length;
    const passed = correct / attempt.results.length >= PASSING_SCORE;
    setAttemptsByLevel((current) => ({ ...current, [activeLevel.id]: (current[activeLevel.id] || []).map((item) => item.number === attempt.number ? { ...item, completed: true, passed } : item) }));
    if (passed) setPassedLevelId(activeLevel.id);
  };
  const selectLevel = (levelId) => {
    if (unlockedLevelIds.includes(levelId)) { setActiveLevelId(levelId); setPassedLevelId(null); }
  };
  const retryRequest = () => pending?.kind === 'feedback' ? answer(pending.learnerAnswer) : createQuestion(activeLevel, attempt, historyFor(activeLevel.id).slice(0, -1));
  const visibleAttempt = attempt?.completed ? undefined : attempt;

  const nextLevel = levels[levels.findIndex((level) => level.id === activeLevelId) + 1];
  const canPass = Boolean(attempt && attempt.results.length >= MINIMUM_QUESTIONS_TO_PASS);
  const currentScore = attempt?.results.length ? attempt.results.filter((result) => result.isCorrect).length / attempt.results.length : 0;

  return <main className="app-shell"><header className="app-header"><span>🕉️</span><div><p className="eyebrow">Samskrita Swayam Shikshaka</p><h1>Adaptive learning companion</h1></div></header>{passedLevelId === activeLevelId && <section className="level-passed" role="status"><span aria-hidden="true">✦</span><div><strong>Level {activeLevel.number} passed!</strong><p>{nextLevel ? `Level ${nextLevel.number} is now unlocked.` : 'You have completed every available level.'}</p></div>{nextLevel && <button type="button" onClick={() => selectLevel(nextLevel.id)}>Continue</button>}</section>}<div className="app-layout"><LevelList levels={levels} activeLevelId={activeLevelId} unlockedLevelIds={unlockedLevelIds} onSelect={selectLevel} /><LevelContent level={activeLevel} /><PracticePanel level={activeLevel} attempt={visibleAttempt} hasPreviousAttempts={attempts.length > 0} isLoading={isLoading} error={errorByLevel[activeLevelId]} canPass={canPass} currentScore={currentScore} minimumQuestions={MINIMUM_QUESTIONS_TO_PASS} passingScore={PASSING_SCORE} onStart={start} onAnswer={answer} onNext={next} onComplete={complete} onRetryRequest={retryRequest} /></div></main>;
}
