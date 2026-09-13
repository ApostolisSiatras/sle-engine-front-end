import { useEffect, useState } from 'react';

export default function LevelContent({ level }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => { setLoading(true); setFailed(false); }, [level.file]);
  const reload = () => { setLoading(true); setFailed(false); setRevision((value) => value + 1); };

  return <section className="lesson-panel" aria-labelledby="lesson-heading">
    <div className="panel-title"><div><p className="eyebrow">Active lesson</p><h1 id="lesson-heading">Level {level.number}: {level.title}</h1></div><span className="pill">Supplied HTML</span></div>
    {loading && <p className="status loading" role="status">Loading lesson content…</p>}
    {failed ? <div className="status error" role="alert">The lesson could not be loaded. <button onClick={reload}>Retry lesson</button></div> :
      <iframe key={`${level.id}-${revision}`} className="lesson-frame" title={`Level ${level.number} lesson content`}
        src={level.file} sandbox="allow-scripts" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
  </section>;
}
