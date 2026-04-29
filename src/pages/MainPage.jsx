import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'other']

const CAT_BADGE = {
  breakfast: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  lunch: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  dinner: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  dessert: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  snack: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const CAT_BORDER = {
  breakfast: 'border-l-yellow-400',
  lunch: 'border-l-green-500',
  dinner: 'border-l-indigo-500',
  dessert: 'border-l-pink-500',
  snack: 'border-l-orange-400',
  other: 'border-l-gray-300',
}

const CAT_EMOJI = {
  breakfast: '🌅', lunch: '🥗', dinner: '🍽️',
  dessert: '🍰', snack: '🍎', other: '🍴',
}

const emptyForm = {
  title: '', description: '', instructions: '',
  prep_time_minutes: '', cook_time_minutes: '', servings: '', category: 'other'
}

const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 w-full bg-gray-50 dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition'
const btnPrimary = 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-amber-200 dark:hover:shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed'
const btnSecondary = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
const btnDanger = 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-2 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors'

export default function MainPage() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [view, setView] = useState('list')
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
    } catch {
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

  // ── SHARED NAV ───────────────────────────────────────────────────────────────
  function Nav({ right }) {
    return (
      <header className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-amber-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setView('list')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-amber-600 transition-colors">
              <span className="text-base">🍳</span>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Kitchen Hub</span>
          </button>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </header>
    )
  }

  // ── FORM VIEW ────────────────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-white dark:bg-gray-950 dark:bg-none">
        <Nav right={
          <>
            <button onClick={toggle} className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">{dark ? '☀️' : '🌙'}</button>
            <button onClick={() => setView(view === 'create' ? 'list' : 'detail')} className={btnSecondary}>Cancel</button>
          </>
        } />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {view === 'create' ? '✨ New Recipe' : '✏️ Edit Recipe'}
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-amber-100 dark:border-gray-800 p-6">
            <form onSubmit={view === 'create' ? handleCreate : handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input placeholder="e.g. Grandma's Pasta" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea placeholder="A short description..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inputCls} rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Instructions *</label>
                <textarea placeholder="Step 1: ..." value={form.instructions} onChange={e => setForm(f => ({...f, instructions: e.target.value}))} className={inputCls} rows={5} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Prep (min)</label>
                  <input type="number" placeholder="0" value={form.prep_time_minutes} onChange={e => setForm(f => ({...f, prep_time_minutes: e.target.value}))} className={inputCls} min="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Cook (min)</label>
                  <input type="number" placeholder="0" value={form.cook_time_minutes} onChange={e => setForm(f => ({...f, cook_time_minutes: e.target.value}))} className={inputCls} min="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Servings</label>
                  <input type="number" placeholder="1" value={form.servings} onChange={e => setForm(f => ({...f, servings: e.target.value}))} className={inputCls} min="1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{formError}</p>
                </div>
              )}
              <button type="submit" disabled={formLoading} className={btnPrimary + ' w-full py-3 text-base'}>
                {formLoading ? 'Saving...' : '💾 Save Recipe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const badge = CAT_BADGE[selected.category] || CAT_BADGE.other
    const emoji = CAT_EMOJI[selected.category] || '🍴'
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-white dark:bg-gray-950 dark:bg-none">
        <Nav right={
          <>
            <button onClick={toggle} className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">{dark ? '☀️' : '🌙'}</button>
            <button onClick={() => openEdit(selected)} className={btnSecondary}>✏️ Edit</button>
            <button onClick={() => handleDelete(selected.id)} className={btnDanger}>Delete</button>
          </>
        } />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => setView('list')} className={btnSecondary + ' mb-6 text-sm'}>← Back to recipes</button>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-amber-100 dark:border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 px-6 py-6 border-b border-amber-100 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-2xl">{emoji}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selected.title}</h1>
                  {selected.category && (
                    <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full capitalize ${badge}`}>
                      {selected.category}
                    </span>
                  )}
                </div>
              </div>
              {(selected.prep_time_minutes || selected.cook_time_minutes || selected.servings) && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {selected.prep_time_minutes && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1.5 rounded-full font-medium">
                      ⏱️ {selected.prep_time_minutes}m prep
                    </span>
                  )}
                  {selected.cook_time_minutes && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1.5 rounded-full font-medium">
                      🔥 {selected.cook_time_minutes}m cook
                    </span>
                  )}
                  {selected.servings && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-gray-700/70 px-3 py-1.5 rounded-full font-medium">
                      🍽️ Serves {selected.servings}
                    </span>
                  )}
                </div>
              )}
            </div>

            {selected.description && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{selected.description}</p>
              </div>
            )}

            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Ingredients</h2>
              {ingLoading ? (
                <p className="text-gray-400 text-sm">Loading...</p>
              ) : (
                <>
                  {ingredients.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">No ingredients added yet.</p>
                  ) : (
                    <ul className="space-y-2 mb-4">
                      {ingredients.map(ing => (
                        <li key={ing.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                          <span className="text-gray-700 dark:text-gray-300">
                            {ing.amount && <span className="font-semibold">{ing.amount} </span>}
                            {ing.unit && <span className="text-gray-500 dark:text-gray-400">{ing.unit} </span>}
                            {ing.name}
                          </span>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-2 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={handleAddIngredient} className="flex gap-2">
                    <input placeholder="Ingredient *" value={ingName} onChange={e => setIngName(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1 text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
                    <input placeholder="Amount" value={ingAmount} onChange={e => setIngAmount(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 w-20 text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
                    <input placeholder="Unit" value={ingUnit} onChange={e => setIngUnit(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 w-20 text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">Add</button>
                  </form>
                </>
              )}
            </div>

            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Instructions</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{selected.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-white dark:bg-gray-950 dark:bg-none">
      <header className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-amber-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-base">🍳</span>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Kitchen Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">{dark ? '☀️' : '🌙'}</button>
            <button onClick={() => { setForm(emptyForm); setFormError(null); setView('create') }} className={btnPrimary + ' text-sm'}>
              + New Recipe
            </button>
            <button onClick={handleSignOut} className={btnSecondary + ' text-sm'}>Logout</button>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white">Your Recipe Collection</h2>
          <p className="text-amber-100 text-sm mt-1">Discover, create, and share your favourite dishes</p>
          <div className="flex gap-3 mt-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-sm font-medium">
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
            <input
              placeholder="Search recipes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 w-full bg-white dark:bg-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition shadow-sm"
            />
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition shadow-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {isLoading && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-amber-100 dark:border-gray-800 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-4 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{recipes.length === 0 ? '👨‍🍳' : '🔍'}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
              {recipes.length === 0 ? 'No recipes yet' : 'No recipes match your search'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {recipes.length === 0 ? 'Click "+ New Recipe" to add your first one!' : 'Try adjusting your filters.'}
            </p>
            {recipes.length === 0 && (
              <button
                onClick={() => { setForm(emptyForm); setFormError(null); setView('create') }}
                className={btnPrimary + ' mt-4 text-sm'}
              >
                + Add your first recipe
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(recipe => {
              const accent = CAT_BORDER[recipe.category] || CAT_BORDER.other
              const badge = CAT_BADGE[recipe.category] || CAT_BADGE.other
              const emoji = CAT_EMOJI[recipe.category] || '🍴'
              return (
                <div
                  key={recipe.id}
                  onClick={() => openDetail(recipe)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-amber-100/60 dark:border-gray-800 border-l-4 ${accent} p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-amber-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-gray-700 transition-colors">
                        <span className="text-lg">{emoji}</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{recipe.title}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(recipe.id) }}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >✕</button>
                  </div>
                  {recipe.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 ml-11">{recipe.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap ml-11">
                    {recipe.category && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${badge}`}>{recipe.category}</span>
                    )}
                    {recipe.prep_time_minutes && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">⏱️ {recipe.prep_time_minutes}m</span>
                    )}
                    {recipe.cook_time_minutes && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">🔥 {recipe.cook_time_minutes}m</span>
                    )}
                    {recipe.servings && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">🍽️ {recipe.servings}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
