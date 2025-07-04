// js_likes.js (New File)

const likedItemsContainer = document.getElementById('liked-items-container');
const emptyLikesState = document.getElementById('likes-empty-state');

async function loadLikedItems() {
    showLoader();
    likedItemsContainer.innerHTML = '';
    emptyLikesState.classList.add('hidden');

    try {
        const user = window.currentUser;
        if (!user) {
            emptyLikesState.classList.remove('hidden');
            emptyLikesState.querySelector('p').textContent = 'Please log in to see your liked items.';
            hideLoader();
            return;
        }

        const { data: likedRefs, error: likedRefError } = await supabase
            .from('likes')
            .select('menu_item_id')
            .eq('user_id', user.id);
        if (likedRefError) throw likedRefError;

        const likedItemIds = likedRefs.map(ref => ref.menu_item_id);
        if (likedItemIds.length === 0) {
            emptyLikesState.classList.remove('hidden');
            hideLoader();
            return;
        }

        const { data: likedItems, error: itemsError } = await supabase
            .from('menu_items')
            .select(`*, likes(count)`)
            .in('id', likedItemIds);
        if (itemsError) throw itemsError;

        if (likedItems.length > 0) {
            const itemsWithLikeStatus = likedItems.map(item => ({
                ...item,
                is_liked_by_user: true,
                like_count: item.likes[0]?.count || 0
            }));
            renderItems(itemsWithLikeStatus, likedItemsContainer, 'likes');
        } else {
            emptyLikesState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading liked items:', error.message);
        emptyLikesState.classList.remove('hidden');
        emptyLikesState.querySelector('p').textContent = `Error loading liked items: ${error.message}`;
    } finally {
        hideLoader();
    }
}
