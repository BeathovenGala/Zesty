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
    const generateRecipeBtn = document.getElementById('generate-recipe-btn');
    const recipeOutput = document.getElementById('recipe-output');
    const quickLookBar = document.getElementById('quick-look-bar');
    
    const apiUrl = '/api/groceries';

    let items = [];

    const daysRemaining = (expiryTimestamp) => {
        const today = new Date();
        const expiry = new Date(expiryTimestamp);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderGroceryList = (itemsToRender) => {
        items = itemsToRender;
        groceryListContainer.innerHTML = '';
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
    
    const getExpiryEstimate = async (itemName) => {
        return 7; // Placeholder
    };
    
    const generateRecipe = async (ingredients) => {
        return `Placeholder Recipe for: ${ingredients.join(', ')}
            Title: Zesty Expiring-Item Salad
            Instructions:
            1. Combine all ingredients in a bowl.
            2. Add a Zesty dressing of your choice.
            3. Enjoy before it's too late!
        `;
    };

    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('item-name').value;
        const quantity = document.getElementById('item-quantity').value;
        
        const shelfLife = await getExpiryEstimate(name);
        const estimatedExpiryDate = Date.now() + (shelfLife * 24 * 60 * 60 * 1000);
    
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, quantity: parseInt(quantity), estimatedExpiryDate })
            });
            if (!response.ok) throw new Error('Failed to add item');
            document.getElementById('item-name').value = '';
            document.getElementById('item-quantity').value = '1';
            addItemDialog.classList.remove('active');
            fetchGroceries();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    });
    
    const deleteItem = async (id) => {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete item');
            fetchGroceries();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    generateRecipeBtn.addEventListener('click', async () => {
        const expiringItems = items.filter(item => {
            const days = daysRemaining(item.estimatedExpiryDate);
            return days <= 7 && days >= 0;
        });
    
        if (expiringItems.length === 0) {
            recipeOutput.innerHTML = '<p style="text-align:center;">No items are nearing expiry. Add some groceries!</p>';
            return;
        }
    
        const ingredients = expiringItems.map(item => item.name);
        const recipeText = await generateRecipe(ingredients);
        recipeOutput.innerHTML = `<pre>${recipeText}</pre>`;
    });
    
    // UI interactions
    addItemFab.addEventListener('click', () => {
        addItemDialog.classList.add('active');
    });
    
    closeDialogBtn.addEventListener('click', () => {
        addItemDialog.classList.remove('active');
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const panelId = e.target.dataset.panel;
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(panelId).classList.add('active');
        });
    });

    fetchGroceries();
});