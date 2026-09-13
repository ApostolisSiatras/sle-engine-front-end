export default function LevelList({ levels, activeLevelId, onSelect }) {
  return <nav className="level-list" aria-label="Available levels">
    <p className="eyebrow">Available lessons</p>
    {levels.map((level) => <button key={level.id} type="button"
      className={level.id === activeLevelId ? 'level-button active' : 'level-button'}
      aria-current={level.id === activeLevelId ? 'page' : undefined}
      onClick={() => onSelect(level.id)}>
      <span>Level {level.number} · {level.difficulty}</span><small>{level.description}</small>
    </button>)}
  </nav>;
}
