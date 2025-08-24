document.addEventListener('DOMContentLoaded', () => {
    const dashboardTab = document.getElementById('dashboard-tab');
    const recipesTab = document.getElementById('recipes-tab');
    const dashboardSection = document.getElementById('dashboard');
    const recipesSection = document.getElementById('recipes');
    const groceryListContainer = document.getElementById('grocery-list');
    const addItemForm = document.getElementById('add-item-form');
    const generateRecipeBtn = document.getElementById('generate-recipe-btn');
    const recipeOutput = document.getElementById('recipe-output');

    const apiUrl = '/api/groceries';
    
    // Function to calculate days remaining
    const daysRemaining = (expiryTimestamp) => {
        const today = new Date();
        const expiry = new Date(expiryTimestamp);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Function to render grocery list
    const renderGroceryList = (items) => {
        groceryListContainer.innerHTML = '';
        if (items.length === 0) {
            groceryListContainer.innerHTML = '<p style="text-align: center; color: #666;">Your pantry is empty. Add some groceries!</p>';
            return;
        }

        items.forEach(item => {
            const daysLeft = daysRemaining(item.estimatedExpiryDate);
            const card = document.createElement('div');
            card.className = 'grocery-card';
            if (daysLeft <= 0) {
                card.classList.add('card-expired');
            } else if (daysLeft <= 3) {
                card.classList.add('card-near-expiry');
            }

            const formattedDate = new Date(item.estimatedExpiryDate).toLocaleDateString();

            card.innerHTML = `
                <div class="card-content">
                    <h3 class="name">${item.name}</h3>
                    <p class="info">Quantity: ${item.quantity}</p>
                    <p class="info">Expires: ${formattedDate}</p>
                    <p class="info" style="font-weight: bold;">Days left: ${daysLeft}</p>
                </div>
                <button class="delete-btn" data-id="${item.id}">&times;</button>
            `;
            groceryListContainer.appendChild(card);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteItem(id);
            });
        });
    };

    // Function to fetch and display groceries
    const fetchGroceries = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch groceries');
            const items = await response.json();
            renderGroceryList(items);
        } catch (error) {
            console.error('Error fetching groceries:', error);
        }
    };

    // Function to get an expiry estimate (AI placeholder)
    const getExpiryEstimate = async (itemName) => {
        // In a real app, this would be an AI call.
        // For now, we'll use a hardcoded value.
        return 7; // Placeholder for 7 days
    };

    // Handle adding a new item
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
            fetchGroceries();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    });

    // Handle deleting an item
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

    // Handle generating a recipe (AI placeholder)
    generateRecipeBtn.addEventListener('click', async () => {
        const expiringItems = items.filter(item => {
            const days = daysRemaining(item.estimatedExpiryDate);
            return days <= 7 && days >= 0;
        });

        if (expiringItems.length === 0) {
            recipeOutput.innerHTML = '<p>No items are nearing expiry. Add some groceries!</p>';
            return;
        }

        const ingredients = expiringItems.map(item => item.name);
        const recipeText = `Placeholder Recipe:
            Title: Quick Expiring-Item Salad
            Ingredients: ${ingredients.join(', ')}
            Instructions:
            1. Combine all ingredients in a bowl.
            2. Add dressing of your choice.
            3. Enjoy before it's too late!
        `;
        recipeOutput.innerHTML = `<pre>${recipeText}</pre>`;
    });
    
    // Tab switching logic
    const switchTab = (tabToActivate, sectionToShow) => {
        document.querySelector('.active').classList.remove('active');
        tabToActivate.classList.add('active');
        document.querySelector('.active-section').classList.remove('active-section');
        sectionToShow.classList.add('active-section');
    };

    dashboardTab.addEventListener('click', () => switchTab(dashboardTab, dashboardSection));
    recipesTab.addEventListener('click', () => switchTab(recipesTab, recipesSection));
    
    // Initial fetch
    fetchGroceries();
});