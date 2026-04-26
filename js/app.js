// ── State ──────────────────────────────────────────────────
const API       = 'api';
let currentRecipe = null;
let searchTimer   = null;

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
});

// ── View Management ────────────────────────────────────────
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + name).classList.remove('hidden');

    if (name === 'browse') loadRecipes();

    // === MODIFIED 20260426 ===
    // RESET 'currentRecipe' to CLEAR SO THAT
    // 'isEdit' WON'T EQUAL TRUE
    //if (name === 'form')    setupForm(null);
    if (name === 'form') { currentRecipe = null; setupForm(null); }

}

// ── Browse / Search ────────────────────────────────────────
function handleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadRecipes, 300);
}

async function loadRecipes() {
    const search   = document.getElementById('search-input').value.trim();
    const category = document.getElementById('category-filter').value;

    let url = `${API}/recipes.php?`;
    if (search)   url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}`;

    try {
        const res  = await fetch(url);
        const json = await res.json();
        renderGrid(json.data || []);
    } catch (e) {
        renderGrid([]);
        console.error('Failed to load recipes:', e);
    }
}

function renderGrid(recipes) {
    const grid = document.getElementById('recipe-grid');
    if (recipes.length === 0) {
        grid.innerHTML = '<p class="empty-state">No recipes found. Add one to get started!</p>';
        return;
    }
    grid.innerHTML = recipes.map(r => `
        <div class="recipe-card" onclick="viewRecipe(${r.id})">
            <h3>${esc(r.name)}</h3>
            <p class="meta">${esc(r.category)}${r.servings ? ' · ' + esc(r.servings) : ''}</p>
        </div>
    `).join('');
}

// ── View Recipe ────────────────────────────────────────────
async function viewRecipe(id) {
    try {
        const res  = await fetch(`${API}/recipe.php?id=${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        currentRecipe = json.data;
        renderRecipeDetail(currentRecipe);
        showView('recipe');
    } catch (e) {
        alert('Could not load recipe.');
        console.error(e);
    }
}

function renderRecipeDetail(r) {
    const ingredients = (r.ingredients || '').split('\n').filter(l => l.trim());
    document.getElementById('recipe-detail').innerHTML = `
        <div class="recipe-detail-inner">
            <h2>${esc(r.name)}</h2>
            <p class="recipe-meta">
                ${esc(r.category)}${r.servings ? ' · ' + esc(r.servings) : ''}
            </p>
            ${ingredients.length ? `
            <div class="recipe-section">
                <h3>Ingredients</h3>
                <ul class="ingredients-list">
                    ${ingredients.map(i => `<li>${esc(i)}</li>`).join('')}
                </ul>
            </div>` : ''}
            ${r.instructions ? `
            <div class="recipe-section">
                <h3>Instructions</h3>
                <p class="instructions-text">${esc(r.instructions)}</p>
            </div>` : ''}
            ${r.notes ? `
            <div class="recipe-section">
                <h3>Notes</h3>
                <p class="notes-text">${esc(r.notes)}</p>
            </div>` : ''}
        </div>
    `;
}

// ── Add / Edit Form ────────────────────────────────────────
function setupForm(recipe) {
    document.getElementById('form-title').textContent = recipe ? 'Edit Recipe' : 'Add Recipe';
    document.getElementById('f-name').value         = recipe ? recipe.name         : '';
    document.getElementById('f-category').value     = recipe ? recipe.category     : 'Dinner';
    document.getElementById('f-servings').value     = recipe ? recipe.servings     : '';
    document.getElementById('f-ingredients').value  = recipe ? recipe.ingredients  : '';
    document.getElementById('f-instructions').value = recipe ? recipe.instructions : '';
    document.getElementById('f-notes').value        = recipe ? recipe.notes        : '';
}

function editCurrentRecipe() {
    if (!currentRecipe) return;
    setupForm(currentRecipe);
    document.getElementById('view-recipe').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
}

async function saveRecipe() {
    const name = document.getElementById('f-name').value.trim();
    if (!name) {
        alert('Recipe name is required.');
        return;
    }

    // === MODIFIED 20260426 ===
    // PREVENT DOUBLE-CLICKS ON SAVE BY DISABLING
    // BUTTON WHEN 'Save Recipe' IS CLICKED AND CHANGING
    // BUTTON LABEL TO 'Saving...'
    const btn = document.querySelector('.btn-primary');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    // === MODIFIED STOP ===

    const payload = {
        name:         name,
        category:     document.getElementById('f-category').value,
        servings:     document.getElementById('f-servings').value.trim(),
        ingredients:  document.getElementById('f-ingredients').value.trim(),
        instructions: document.getElementById('f-instructions').value.trim(),
        notes:        document.getElementById('f-notes').value.trim(),
    };

    const isEdit = currentRecipe && currentRecipe.id;
    const url    = isEdit ? `${API}/recipe.php?id=${currentRecipe.id}` : `${API}/recipe.php`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res  = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);

        const id = isEdit ? currentRecipe.id : json.id;
        await viewRecipe(id);
    } catch (e) {

        // === MODIFIED 20260426 ===
        // # IF THERE IS AN ISSUE WITH THE CONTENT PREVENTING 
        // A SAVE THEN RE-ENABLE THE SAVE BUTTON
        btn.disabled = false;
        btn.textContent = 'Save Recipe';
        // === MODIFIED STOP ===
        
        alert('Could not save recipe.');
        console.error(e);
        
    }
}

// ── Delete ─────────────────────────────────────────────────
async function deleteCurrentRecipe() {
    if (!currentRecipe) return;
    if (!confirm(`Delete "${currentRecipe.name}"? This cannot be undone.`)) return;

    try {
        const res  = await fetch(`${API}/recipe.php?id=${currentRecipe.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        currentRecipe = null;
        showView('browse');
    } catch (e) {
        alert('Could not delete recipe.');
        console.error(e);
    }
}

// ── Shopping List ──────────────────────────────────────────
function showShoppingList() {
    if (!currentRecipe) return;
    const items = (currentRecipe.ingredients || '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const content = document.getElementById('shopping-content');
    content.innerHTML = `
        <div class="shopping-content">
            <h2>${esc(currentRecipe.name)}</h2>
            <p class="sub">Shopping List · ${items.length} item${items.length !== 1 ? 's' : ''}</p>
            <ul class="shopping-list">
                ${items.map((item, i) => `
                    <li id="shop-item-${i}" onclick="toggleShopItem(${i})">
                        <input type="checkbox" onclick="event.stopPropagation(); toggleShopItem(${i})">
                        <span>${esc(item)}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    showView('shopping');
}

function toggleShopItem(i) {
    const li  = document.getElementById('shop-item-' + i);
    const cb  = li.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    li.classList.toggle('checked', cb.checked);
}

// ── Print Card ─────────────────────────────────────────────
function printCard() {
    if (!currentRecipe) return;
    const r           = currentRecipe;
    const ingredients = (r.ingredients || '').split('\n').filter(l => l.trim());

    document.getElementById('print-card').innerHTML = `
        <div class="print-card-inner">
            <h2>${esc(r.name)}</h2>
            <p class="print-meta">
                ${esc(r.category)}${r.servings ? ' · ' + esc(r.servings) : ''}
            </p>
            ${ingredients.length ? `
            <p class="print-section-title">Ingredients</p>
            <ul class="print-ingredients">
                ${ingredients.map(i => `<li>${esc(i)}</li>`).join('')}
            </ul>` : ''}
            ${r.instructions ? `
            <p class="print-section-title">Instructions</p>
            <p class="print-instructions">${esc(r.instructions)}</p>` : ''}
            ${r.notes ? `
            <p class="print-section-title">Notes</p>
            <p class="print-notes">${esc(r.notes)}</p>` : ''}
            <p class="print-footer">Rouxmise</p>
        </div>
    `;
    window.print();
}

// ── Utility ────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
