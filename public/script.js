document.addEventListener('DOMContentLoaded', () => {
    const dashboardPanel = document.getElementById('dashboard');
    const recipesPanel = document.getElementById('recipes');
    const dashboardTab = document.querySelector('[data-panel="dashboard"]');
    const recipesTab = document.querySelector('[data-panel="recipes"]');
    const groceryListContainer = document.getElementById('grocery-list');
    const addItemFab = document.getElementById('add-item-fab');
    const addItemDialog = document.getElementById('add-item-dialog');
    const closeDialogBtn = document.getElementById('close-dialog-btn');
    const addItemForm = document.getElementById('add-item-form');
    const quickLookBar = document.getElementById('quick-look-bar');
    
    const generateAutoRecipeBtn = document.getElementById('generate-auto-recipe-btn');
    const generateSelectedRecipeBtn = document.getElementById('generate-selected-recipe-btn');
    const ingredientSelectionList = document.getElementById('ingredient-selection-list');
    const recipeOutput = document.getElementById('recipe-output');
    const loadingSpinner = document.getElementById('loading-spinner');

    const apiUrl = '/api/groceries';
    const recipeApiUrl = '/api/recipes';
    
    let items = [];

    const showLoading = () => { loadingSpinner.classList.add('active'); };
    const hideLoading = () => { loadingSpinner.classList.remove('active'); };

    const daysRemaining = (expiryTimestamp) => {
        const today = new Date();
        const expiry = new Date(expiryTimestamp);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderGroceryList = (itemsToRender) => {
        items = itemsToRender;
        groceryListContainer.innerHTML = '';
        ingredientSelectionList.innerHTML = ''; // Clear ingredient list on refresh
        if (items.length === 0) {
            groceryListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Your pantry is empty. Add some groceries!</p>';
            return;
        }
        
        let nearingExpiryCount = 0;

        items.forEach(item => {
            const daysLeft = daysRemaining(item.estimatedExpiryDate);
            const card = document.createElement('div');
            let cardClass = '';
            let daysLeftClass = '';
            
            if (daysLeft <= 0) {
                cardClass = 'expired';
                daysLeftClass = 'red';
            } else if (daysLeft <= 3) {
                cardClass = 'near-expiry';
                daysLeftClass = 'yellow';
                nearingExpiryCount++;
            }

            card.className = `grocery-card ${cardClass}`;
            const formattedDate = new Date(item.estimatedExpiryDate).toLocaleDateString();

            card.innerHTML = `
                <div class="card-content">
                    <h3 class="card-name">${item.name}</h3>
                    <p class="card-info">Quantity: ${item.quantity}</p>
                    <p class="card-info">Expires: ${formattedDate}</p>
                    <p class="days-left ${daysLeftClass}">${daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</p>
                </div>
                <button class="delete-btn" data-id="${item.id}">&times;</button>
            `;
            groceryListContainer.appendChild(card);
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.innerHTML = `
                <input type="checkbox" name="ingredient" value="${item.name}">
                ${item.name}
            `;
            ingredientSelectionList.appendChild(checkboxLabel);
        });

        if (nearingExpiryCount > 0) {
            quickLookBar.textContent = `${nearingExpiryCount} item(s) are nearing expiry!`;
            quickLookBar.style.color = 'var(--yellow-alert)';
        } else {
            quickLookBar.textContent = 'All items are fresh!';
            quickLookBar.style.color = 'var(--primary-accent)';
        }

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteItem(id);
            });
        });
    };

    const fetchGroceries = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch groceries');
            const itemsData = await response.json();
            renderGroceryList(itemsData);
        } catch (error) {
            console.error('Error fetching groceries:', error);
        }
    };
    
    // AI Functionality
    const generateRecipe = async (ingredients) => {
        showLoading();
        recipeOutput.innerHTML = '<p style="text-align:center;">Generating recipe...</p>';
        try {
            const response = await fetch(`${recipeApiUrl}?ingredients=${encodeURIComponent(ingredients.join(','))}`);
            if (!response.ok) throw new Error('Failed to generate recipe');
            const data = await response.json();
            recipeOutput.innerHTML = `<pre>${data.recipe}</pre>`;
        } catch (error) {
            console.error('Error generating recipe:', error);
            recipeOutput.innerHTML = `<p style="text-align:center; color: var(--red-alert);">Sorry, I couldn't generate a recipe. Please try again!</p>`;
        } finally {
            hideLoading();
        }
    };

    // Event Listeners
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('item-name').value;
        const quantity = document.getElementById('item-quantity').value;
        
        try {
            showLoading();
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, quantity: parseInt(quantity) })
            });
            if (!response.ok) throw new Error('Failed to add item');
            document.getElementById('item-name').value = '';
            document.getElementById('item-quantity').value = '1';
            addItemDialog.classList.remove('active');
            await fetchGroceries();
        } catch (error) {
            console.error('Error adding item:', error);
        } finally {
            hideLoading();
        }
    });
    
    const deleteItem = async (id) => {
        try {
            await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
            fetchGroceries();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    generateAutoRecipeBtn.addEventListener('click', () => {
        const expiringItems = items.filter(item => {
            const days = daysRemaining(item.estimatedExpiryDate);
            return days <= 7 && days >= 0;
        });
    
        if (expiringItems.length === 0) {
            recipeOutput.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No items are nearing expiry. Add some groceries!</p>';
            return;
        }
    
        const ingredients = expiringItems.map(item => item.name);
        generateRecipe(ingredients);
    });

    generateSelectedRecipeBtn.addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('#ingredient-selection-list input[type="checkbox"]:checked');
        const selectedIngredients = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedIngredients.length === 0) {
            recipeOutput.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Please select at least one ingredient.</p>';
            return;
        }
        generateRecipe(selectedIngredients);
    });

    // UI interactions
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const panelId = e.target.dataset.panel;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(panelId).classList.add('active');
            if (panelId === 'recipes') {
                recipeOutput.innerHTML = '<p style="text-align:center;">Click a button to get a recipe!</p>';
            }
        });
    });

    addItemFab.addEventListener('click', () => { addItemDialog.classList.add('active'); });
    closeDialogBtn.addEventListener('click', () => { addItemDialog.classList.remove('active'); });

    fetchGroceries();
});