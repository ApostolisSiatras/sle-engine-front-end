export default function LevelList({ levels, activeLevelId, unlockedLevelIds, onSelect }) {
  return <nav className="level-list" aria-label="Available levels">
    <p className="eyebrow">Available lessons</p>
    {levels.map((level) => {
      const unlocked = unlockedLevelIds.includes(level.id);
      return <button key={level.id} type="button" disabled={!unlocked}
      className={`${level.id === activeLevelId ? 'level-button active' : 'level-button'}${unlocked ? '' : ' locked'}`}
      aria-current={level.id === activeLevelId ? 'page' : undefined}
      aria-label={unlocked ? `Level ${level.number}: ${level.title}` : `Level ${level.number} locked. Pass the previous level to unlock it.`}
      onClick={() => onSelect(level.id)}>
      <span>{unlocked ? `Level ${level.number} · ${level.difficulty}` : `🔒 Level ${level.number} · Locked`}</span><small>{unlocked ? level.description : 'Pass the previous level to unlock.'}</small>
    </button>;
    })}
  </nav>;
}
