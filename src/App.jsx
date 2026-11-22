import { useEffect, useRef, useState } from 'react'
import * as api from './mealsApi'

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'result' | 'list'
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [history, setHistory] = useState([]) // names already shown; last one is current
  const [rollError, setRollError] = useState('')

  useEffect(() => {
    api.getMeals().then(setMeals).catch((e) => setLoadError(e.message)).finally(() => setLoading(false))
  }, [])

  function roll() {
    const names = new Set(history)
    const available = meals.filter((m) => !names.has(m.name))
    if (available.length === 0) {
      setRollError(
        meals.length === 0
          ? 'Your meal list is empty. Add some meals on the List tab first.'
          : "You've seen every meal on your list. Go back to start again."
      )
    } else {
      const pick = available[Math.floor(Math.random() * available.length)]
      setRollError('')
      setHistory([...history, pick.name])
    }
    setScreen('result')
  }

  function goTo(next) {
    setHistory([])
    setRollError('')
    setScreen(next)
  }

  const current = history[history.length - 1]
  const tab = screen === 'list' ? 'list' : 'home'

  return (
    <div className="app">
      <main className="main">
        {screen === 'home' && (
          <div className="center">
            <button className="roll" onClick={roll} disabled={loading}>ROLL!</button>
            <p className="hint">{loading ? 'Loading meals…' : `${meals.length} meals in your list`}</p>
            {loadError && <p className="error">Couldn't load meals: {loadError}</p>}
          </div>
        )}

        {screen === 'result' && (
          <div className="center">
            {rollError ? (
              <p className="error big">{rollError}</p>
            ) : (
              <>
                <p className="hint">Tonight you're having</p>
                <h1 className="meal">{current}</h1>
              </>
            )}
            <div className="row">
              <button className="btn ghost" onClick={() => goTo('home')}>Back</button>
              <button className="btn" onClick={roll}>Reroll</button>
            </div>
          </div>
        )}

        {screen === 'list' && <ListPage meals={meals} setMeals={setMeals} />}
      </main>

      <nav className="nav">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => goTo('home')}>Roll</button>
        <button className={tab === 'list' ? 'active' : ''} onClick={() => goTo('list')}>List</button>
      </nav>
    </div>
  )
}

function ListPage({ meals, setMeals }) {
  const [editing, setEditing] = useState(null) // null | {id?: number, name: string}
  const [menuFor, setMenuFor] = useState(null) // meal being acted on
  const [error, setError] = useState('')

  async function save(name) {
    const clean = name.trim()
    if (!clean) return setError('Enter a meal name.')
    if (meals.some((m) => m.name.toLowerCase() === clean.toLowerCase() && m.id !== editing.id)) {
      return setError('That meal is already in your list.')
    }
    try {
      if (editing.id) {
        const updated = await api.updateMeal(editing.id, clean)
        setMeals((ms) => ms.map((m) => (m.id === updated.id ? updated : m)).sort(byName))
      } else {
        const added = await api.addMeal(clean)
        setMeals((ms) => [...ms, added].sort(byName))
      }
      setEditing(null)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  async function remove(meal) {
    setMenuFor(null)
    if (!window.confirm(`Delete "${meal.name}"?`)) return
    try {
      await api.deleteMeal(meal.id)
      setMeals((ms) => ms.filter((m) => m.id !== meal.id))
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <>
      <ul className="list">
        {meals.length === 0 && <li className="empty">No meals yet. Tap + to add your first.</li>}
        {meals.map((m) => (
          <MealCard key={m.id} meal={m} onMenu={() => setMenuFor(m)} />
        ))}
      </ul>

      <button className="fab" aria-label="Add meal" onClick={() => { setError(''); setEditing({ name: '' }) }}>+</button>

      {menuFor && (
        <Sheet onClose={() => setMenuFor(null)}>
          <h2>{menuFor.name}</h2>
          <button className="btn" onClick={() => { setError(''); setEditing(menuFor); setMenuFor(null) }}>Edit</button>
          <button className="btn danger" onClick={() => remove(menuFor)}>Delete</button>
        </Sheet>
      )}

      {editing && (
        <MealForm
          key={editing.id ?? 'new'}
          initial={editing.name}
          isEdit={!!editing.id}
          error={error}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

const byName = (a, b) => a.name.localeCompare(b.name)

function MealCard({ meal, onMenu }) {
  const timer = useRef(null)
  const cancel = () => clearTimeout(timer.current)
  return (
    <li
      className="card"
      onTouchStart={() => { timer.current = setTimeout(onMenu, 500) }}
      onTouchMove={cancel}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span>{meal.name}</span>
      <button className="dots" aria-label={`Options for ${meal.name}`} onClick={onMenu}>⋮</button>
    </li>
  )
}

function Sheet({ children, onClose }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

function MealForm({ initial, isEdit, error, onSave, onClose }) {
  const [value, setValue] = useState(initial)
  return (
    <Sheet onClose={onClose}>
      <h2>{isEdit ? 'Edit meal' : 'Add meal'}</h2>
      <input
        autoFocus
        value={value}
        maxLength={80}
        placeholder="e.g. Chicken stir fry"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave(value)}
      />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={() => onSave(value)}>Save</button>
      </div>
    </Sheet>
  )
}
