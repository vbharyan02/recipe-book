import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'other']

const emptyForm = {
  title: '', description: '', instructions: '',
  prep_time_minutes: '', cook_time_minutes: '', servings: '', category: 'other'
}

export default function MainPage() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [view, setView] = useState('list') // list | detail | create | edit
  const [selected, setSelected] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [ingLoading, setIngLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [ingName, setIngName] = useState('')
  const [ingAmount, setIngAmount] = useState('')
  const [ingUnit, setIngUnit] = useState('')

  useEffect(() => { fetchRecipes() }, [])

  async function fetchRecipes() {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setRecipes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchIngredients(recipeId) {
    setIngLoading(true)
    try {
      const { data, error } = await supabase.from('ingredients').select('*').eq('recipe_id', recipeId).order('sort_order', { ascending: true })
      if (error) throw error
      setIngredients(data)
    } catch (err) {
      setIngredients([])
    } finally {
      setIngLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Title is required'); return }
    if (!form.instructions.trim()) { setFormError('Instructions are required'); return }
    setFormError(null)
    setFormLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        instructions: form.instructions.trim(),
        description: form.description.trim() || null,
        prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
        cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
        servings: form.servings ? parseInt(form.servings) : null,
        category: form.category || 'other'
      }
      const { data, error } = await supabase.from('recipes').insert(payload).select().single()
      if (error) throw error
      setRecipes(prev => [data, ...prev])
      setForm(emptyForm)
      setView('list')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Title is required'); return }
    if (!form.instructions.trim()) { setFormError('Instructions are required'); return }
    setFormError(null)
    setFormLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        instructions: form.instructions.trim(),
        description: form.description.trim() || null,
        prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
        cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
        servings: form.servings ? parseInt(form.servings) : null,
        category: form.category || 'other'
      }
      const { data, error } = await supabase.from('recipes').update(payload).eq('id', selected.id).select().single()
      if (error) throw error
      setRecipes(prev => prev.map(r => r.id === data.id ? data : r))
      setSelected(data)
      setView('detail')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this recipe?')) return
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
      setRecipes(prev => prev.filter(r => r.id !== id))
      setView('list')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAddIngredient(e) {
    e.preventDefault()
    if (!ingName.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('ingredients').insert({
        user_id: user.id,
        recipe_id: selected.id,
        name: ingName.trim(),
        amount: ingAmount.trim() || null,
        unit: ingUnit.trim() || null,
        sort_order: ingredients.length
      }).select().single()
      if (error) throw error
      setIngredients(prev => [...prev, data])
      setIngName(''); setIngAmount(''); setIngUnit('')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteIngredient(id) {
    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', id)
      if (error) throw error
      setIngredients(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  function openDetail(recipe) {
    setSelected(recipe)
    setView('detail')
    fetchIngredients(recipe.id)
  }

  function openEdit(recipe) {
    setSelected(recipe)
    setForm({
      title: recipe.title || '',
      description: recipe.description || '',
      instructions: recipe.instructions || '',
      prep_time_minutes: recipe.prep_time_minutes || '',
      cook_time_minutes: recipe.cook_time_minutes || '',
      servings: recipe.servings || '',
      category: recipe.category || 'other'
    })
    setFormError(null)
    setView('edit')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || r.category === filterCat
    return matchSearch && matchCat
  })

  const inputCls = 'border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400'
  const btnBlue = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
  const btnGray = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded'
  const btnRed = 'bg-red-500 text-white px-3 py-1 rounded text-sm'
  const themeBtn = 'text-xl px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'

  // ── FORM VIEW (create / edit) ───────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-lg mx-auto mt-8 px-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">{view === 'create' ? 'New Recipe' : 'Edit Recipe'}</h1>
          <div className="flex gap-2 items-center">
            <button onClick={toggle} className={themeBtn} aria-label="Toggle dark mode">{dark ? '☀️' : '🌙'}</button>
            <button onClick={() => setView(view === 'create' ? 'list' : 'detail')} className={btnGray}>Cancel</button>
          </div>
        </div>
        <form onSubmit={view === 'create' ? handleCreate : handleUpdate} className="space-y-3">
          <input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={inputCls} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inputCls} rows={2} />
          <textarea placeholder="Instructions *" value={form.instructions} onChange={e => setForm(f => ({...f, instructions: e.target.value}))} className={inputCls} rows={4} />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Prep (min)" value={form.prep_time_minutes} onChange={e => setForm(f => ({...f, prep_time_minutes: e.target.value}))} className={inputCls} min="0" />
            <input type="number" placeholder="Cook (min)" value={form.cook_time_minutes} onChange={e => setForm(f => ({...f, cook_time_minutes: e.target.value}))} className={inputCls} min="0" />
            <input type="number" placeholder="Servings" value={form.servings} onChange={e => setForm(f => ({...f, servings: e.target.value}))} className={inputCls} min="1" />
          </div>
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={inputCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <button type="submit" disabled={formLoading} className={btnBlue + ' w-full disabled:opacity-50'}>
            {formLoading ? 'Saving...' : 'Save Recipe'}
          </button>
        </form>
      </div>
    )
  }

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    return (
      <div className="max-w-lg mx-auto mt-8 px-4 pb-12">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setView('list')} className={btnGray}>← Back</button>
          <div className="flex gap-2 items-center">
            <button onClick={toggle} className={themeBtn} aria-label="Toggle dark mode">{dark ? '☀️' : '🌙'}</button>
            <button onClick={() => openEdit(selected)} className={btnBlue}>Edit</button>
            <button onClick={() => handleDelete(selected.id)} className={btnRed}>Delete</button>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1">{selected.title}</h1>
        {selected.category && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">{selected.category}</span>}
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
          {selected.prep_time_minutes && <span>Prep: {selected.prep_time_minutes}m</span>}
          {selected.cook_time_minutes && <span>Cook: {selected.cook_time_minutes}m</span>}
          {selected.servings && <span>Serves: {selected.servings}</span>}
        </div>
        {selected.description && <p className="text-gray-700 dark:text-gray-300 mb-4">{selected.description}</p>}

        <h2 className="font-semibold mb-2">Ingredients</h2>
        {ingLoading ? <p className="text-gray-400 dark:text-gray-500 text-sm">Loading...</p> : (
          <>
            {ingredients.length === 0
              ? <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">No ingredients yet.</p>
              : <ul className="mb-3 space-y-1">
                  {ingredients.map(ing => (
                    <li key={ing.id} className="flex justify-between items-center text-sm">
                      <span>{ing.amount && `${ing.amount} `}{ing.unit && `${ing.unit} `}{ing.name}</span>
                      <button onClick={() => handleDeleteIngredient(ing.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                    </li>
                  ))}
                </ul>
            }
            <form onSubmit={handleAddIngredient} className="flex gap-2 mb-6">
              <input placeholder="Name *" value={ingName} onChange={e => setIngName(e.target.value)} className="border dark:border-gray-600 rounded px-2 py-1 flex-1 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
              <input placeholder="Amount" value={ingAmount} onChange={e => setIngAmount(e.target.value)} className="border dark:border-gray-600 rounded px-2 py-1 w-20 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
              <input placeholder="Unit" value={ingUnit} onChange={e => setIngUnit(e.target.value)} className="border dark:border-gray-600 rounded px-2 py-1 w-20 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
              <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add</button>
            </form>
          </>
        )}

        <h2 className="font-semibold mb-2">Instructions</h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.instructions}</p>
      </div>
    )
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto mt-8 px-4 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">My Recipes</h1>
        <div className="flex gap-2 items-center">
          <button onClick={toggle} className={themeBtn} aria-label="Toggle dark mode">{dark ? '☀️' : '🌙'}</button>
          <button onClick={() => { setForm(emptyForm); setFormError(null); setView('create') }} className={btnBlue}>+ New</button>
          <button onClick={handleSignOut} className={btnGray}>Logout</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border dark:border-gray-600 rounded px-3 py-2 flex-1 bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100">
          <option value="">All</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-red-500 text-center py-8">{error}</p>}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {recipes.length === 0 ? 'No recipes yet. Create your first one!' : 'No recipes match your search.'}
        </div>
      )}

      {!isLoading && !error && (
        <ul className="space-y-3">
          {filtered.map(recipe => (
            <li key={recipe.id} className="border dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => openDetail(recipe)}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{recipe.title}</p>
                  {recipe.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{recipe.description}</p>}
                  <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {recipe.category && <span className="capitalize">{recipe.category}</span>}
                    {recipe.prep_time_minutes && <span>Prep {recipe.prep_time_minutes}m</span>}
                    {recipe.cook_time_minutes && <span>Cook {recipe.cook_time_minutes}m</span>}
                    {recipe.servings && <span>Serves {recipe.servings}</span>}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(recipe.id) }}
                  className="text-red-400 hover:text-red-600 text-sm ml-4"
                >✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
