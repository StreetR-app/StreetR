// js_search_filter.js
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const suggestionTags = document.querySelectorAll('.suggestion-tag');
const searchTabs = document.querySelectorAll('.search-tab');
const foodResultsContainer = document.getElementById('search-results-food');
const shopsResultsContainer = document.getElementById('search-results-shops');
const emptyState = document.getElementById('search-empty-state');
const searchQueryDisplay = document.getElementById('search-query-display');
let searchTimeout;

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
    searchTimeout = setTimeout(() => {
        performSearch(searchInput.value.trim());
    }, 300);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    clearResults();
});

suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
        searchInput.value = tag.textContent;
        performSearch(tag.textContent);
    });
});

searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        searchTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetContentId = `search-results-${tab.dataset.tab}`;
        document.querySelectorAll('.search-results-content').forEach(c => c.classList.remove('active'));
        document.getElementById(targetContentId).classList.add('active');
    });
});

function clearResults() {
    foodResultsContainer.innerHTML = '';
    shopsResultsContainer.innerHTML = '';
    emptyState.classList.add('hidden');
}

async function performSearch(query) {
    if (!query) {
        clearResults();
        return;
    }

    showLoader();
    clearResults();
    searchQueryDisplay.textContent = query;

    try {
        const pincode = window.userProfile?.pincode;
        if (!pincode) {
            emptyState.classList.remove('hidden');
            hideLoader();
            return;
        }

        // Search for food items
        const { data: foodItems, error: foodError } = await supabase
            .from('menu_items')
            .select(`*, likes(count)`)
            .ilike('name', `%${query}%`);
        if (foodError) throw foodError;

        // Search for shops
        const { data: shops, error: shopsError } = await supabase
            .from('profiles')
            .select('id, shop_name, business_category')
            .eq('user_type', 'Seller')
            .eq('pincode', pincode)
            .or(`shop_name.ilike.%${query}%,business_category.ilike.%${query}%`);
        if (shopsError) throw shopsError;

        renderFoodResults(foodItems);
        renderShopResults(shops);

        if (foodItems.length === 0 && shops.length === 0) {
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search error:', error);
        emptyState.classList.remove('hidden');
    } finally {
        hideLoader();
    }
}

function renderFoodResults(items) {
    foodResultsContainer.innerHTML = '';
    if (items.length === 0) {
        foodResultsContainer.innerHTML = '<p class="no-results-small">No food items found.</p>';
        return;
    }
    const likedItems = JSON.parse(localStorage.getItem('likedItems')) || {};
    const itemsWithLikeStatus = items.map(item => ({
        ...item,
        is_liked_by_user: !!likedItems[item.id],
        like_count: item.likes[0]?.count || 0
    }));
    renderItems(itemsWithLikeStatus, foodResultsContainer, 'search-food');
}

function renderShopResults(shops) {
    shopsResultsContainer.innerHTML = '';
    if (shops.length === 0) {
        shopsResultsContainer.innerHTML = '<p class="no-results-small">No shops found.</p>';
        return;
    }
    const shopList = document.createElement('div');
    shopList.className = 'shop-list';
    shops.forEach(shop => {
        const shopCard = document.createElement('div');
        shopCard.className = 'shop-card';
        shopCard.dataset.shopId = shop.id;
        shopCard.innerHTML = `
            <img src="assets/shop-placeholder.png" alt="${shop.shop_name}">
            <div class="shop-card-content">
                <h4>${shop.shop_name}</h4>
                <p>${shop.business_category}</p>
            </div>
        `;
        shopCard.addEventListener('click', () => showShopProfilePage(shop.id));
        shopList.appendChild(shopCard);
    });
    shopsResultsContainer.appendChild(shopList);
}
