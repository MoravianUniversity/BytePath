import { useEffect, useRef, useState } from 'react';
import { classesService, type Class } from '../services/classes';
import './ClassSelector.css';

type Props = {
  currentClassId: number | null;
  onClassChange: (cls: Class | null) => void;
};

export default function ClassSelector({ currentClassId, onClassChange }: Props) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentClass = classes.find(c => c.id === currentClassId) ?? null;

  useEffect(() => {
    classesService.list().then(setClasses).catch(console.error);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await classesService.create(name);
      setClasses(prev => [created, ...prev]);
      onClassChange(created);
      setOpen(false);
      setAdding(false);
      setNewName('');
    } catch (e) {
      alert(`Failed to create class: ${e}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="class-selector" ref={ref}>
      <button
        className={`dashboard-button class-selector-btn ${open ? 'active' : ''}`}
        onClick={() => { setOpen(o => !o); setAdding(false); setNewName(''); }}
      >
        {currentClass ? currentClass.class_name : 'Classes'} ▾
      </button>

      {open && (
        <div className="class-dropdown">
          {classes.length === 0 && !adding && (
            <div className="class-dropdown-empty">No classes yet</div>
          )}
          {classes.map(cls => (
            <button
              key={cls.id}
              className={`class-dropdown-item ${cls.id === currentClassId ? 'selected' : ''}`}
              onClick={() => { onClassChange(cls); setOpen(false); }}
            >
              {cls.class_name}
            </button>
          ))}

          {adding ? (
            <div className="class-dropdown-add-form">
              <input
                autoFocus
                type="text"
                placeholder="Class name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
              />
              <button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? '...' : 'Create'}
              </button>
            </div>
          ) : (
            <button className="class-dropdown-item add-new" onClick={() => setAdding(true)}>
              + Add new class
            </button>
          )}
        </div>
      )}
    </div>
  );
}
