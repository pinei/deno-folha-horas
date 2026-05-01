import { ref } from 'vue';

export function useKanbanDragAndDrop() {
    const draggedCardId = ref(null);
    let dragClone = null;
    let dragOffset = { x: 0, y: 0 };

    const startVisualDrag = (evt, cardId) => {
        evt.dataTransfer.dropEffect = 'move';
        evt.dataTransfer.effectAllowed = 'move';

        // Hide the default semi-transparent HTML5 drag image
        const emptyImage = new Image();
        emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        evt.dataTransfer.setDragImage(emptyImage, 0, 0);

        // Record mouse offset relative to the card's top-left corner
        const rect = evt.target.getBoundingClientRect();
        dragOffset.x = evt.clientX - rect.left;
        dragOffset.y = evt.clientY - rect.top;

        // Create a wrapper for the solid clone to act as the custom drag image
        const wrapper = document.createElement('div');
        wrapper.className = 'ui cards';
        wrapper.style.position = 'fixed';
        wrapper.style.top = rect.top + 'px';
        wrapper.style.left = rect.left + 'px';
        wrapper.style.width = rect.width + 'px';
        wrapper.style.height = rect.height + 'px';
        wrapper.style.pointerEvents = 'none'; // So it doesn't block drop targets
        wrapper.style.zIndex = '9999';
        wrapper.style.transform = 'rotate(3deg)'; // Add slight rotation for drag feel

        const cardClone = evt.target.cloneNode(true);
        cardClone.style.margin = '0';
        cardClone.style.width = '100%';
        cardClone.style.height = '100%';
        cardClone.style.backgroundColor = '#fff';
        
        // Remove the 'is-dragging' class if it was cloned with it
        cardClone.classList.remove('is-dragging');
        
        wrapper.appendChild(cardClone);
        dragClone = wrapper;
        document.body.appendChild(dragClone);
        
        // Wait for native drag image to capture the card before turning original into placeholder
        setTimeout(() => {
            draggedCardId.value = cardId;
        }, 0);
    };

    const autoScroll = (evt) => {
        // Auto-scroll window when dragging near the edges
        const scrollMargin = 60;
        const scrollSpeed = 20;

        let scrollX = 0;
        let scrollY = 0;

        if (evt.clientY < scrollMargin) {
            scrollY = -scrollSpeed;
        } else if (window.innerHeight - evt.clientY < scrollMargin) {
            scrollY = scrollSpeed;
        }

        if (evt.clientX < scrollMargin) {
            scrollX = -scrollSpeed;
        } else if (window.innerWidth - evt.clientX < scrollMargin) {
            scrollX = scrollSpeed;
        }

        if (scrollX !== 0 || scrollY !== 0) {
            window.scrollBy(scrollX, scrollY);
        }
    };

    const onVisualDrag = (evt) => {
        if (dragClone && (evt.clientX !== 0 || evt.clientY !== 0)) {
            dragClone.style.left = (evt.clientX - dragOffset.x) + 'px';
            dragClone.style.top = (evt.clientY - dragOffset.y) + 'px';

            autoScroll(evt);
        }
    };

    const endVisualDrag = (evt) => {
        draggedCardId.value = null;
        if (dragClone) {
            document.body.removeChild(dragClone);
            dragClone = null;
        }
    };

    return {
        draggedCardId,
        startVisualDrag,
        onVisualDrag,
        endVisualDrag
    };
}
