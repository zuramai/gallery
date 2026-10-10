interface GalleryPhoto {
    index: number;
    title: string;
    description: string;
    location: string;
    tags: string[];
    fullImage: string;
    camera_settings: {
        camera: string;
        aperture: number;
        focal_length: number;
        iso: number;
    };
}

function initializeGallery() {
    const gallery = document.querySelector<HTMLElement>("[data-gallery]");
    const grid = gallery?.querySelector<HTMLElement>("[data-gallery-grid]");
    const dialog = document.querySelector<HTMLDialogElement>("#photo-lightbox");
    if (!gallery || !grid || !dialog) return;

    const cards = [...grid.querySelectorAll<HTMLElement>("[data-photo-index]")];
    // Shuffle once per page load so filtering retains this visit's order.
    for (let index = cards.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }
    const filters = [...gallery.querySelectorAll<HTMLButtonElement>("[data-filter]")];
    const photos = cards.map((card) => JSON.parse(card.querySelector<HTMLElement>("[data-open-photo]")!.dataset.photo!) as GalleryPhoto);
    const filterStatus = gallery.querySelector<HTMLElement>("[data-filter-status]")!;
    const image = dialog.querySelector<HTMLImageElement>("[data-lightbox-image]")!;
    const imageError = dialog.querySelector<HTMLElement>("[data-image-error]")!;
    const previous = dialog.querySelector<HTMLButtonElement>("[data-previous-photo]")!;
    const next = dialog.querySelector<HTMLButtonElement>("[data-next-photo]")!;
    const closeButton = dialog.querySelector<HTMLButtonElement>("[data-close-lightbox]")!;
    const desktop = window.matchMedia("(min-width: 901px)");
    const tablet = window.matchMedia("(min-width: 601px)");
    let visiblePhotos = [...photos];
    let currentIndex = 0;
    let returnFocus: HTMLElement | null = null;

    function layoutGallery() {
        const count = desktop.matches ? 3 : tablet.matches ? 2 : 1;
        const columns = Array.from({ length: count }, () => {
            const column = document.createElement("div");
            column.className = "gallery-column";
            column.setAttribute("data-gallery-column", "");
            return column;
        });
        const heights = Array(count).fill(0) as number[];
        for (const card of cards) {
            if (card.hidden) continue;
            const column = heights.indexOf(Math.min(...heights));
            columns[column].append(card);
            heights[column] += Number(card.dataset.photoRatio) + 0.3;
        }
        grid!.replaceChildren(...columns);
    }

    function selectTag(tag: string) {
        visiblePhotos = photos.filter((photo) => !tag || photo.tags.includes(tag));
        cards.forEach((card, index) => { card.hidden = !visiblePhotos.includes(photos[index]); });
        filters.forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.filter === tag)); });
        filterStatus.textContent = tag
            ? `Showing ${visiblePhotos.length} ${visiblePhotos.length === 1 ? "photograph" : "photographs"} tagged ${tag}`
            : `Showing all ${photos.length} photographs`;
        layoutGallery();
    }

    function showPhoto(index: number) {
        currentIndex = (index + visiblePhotos.length) % visiblePhotos.length;
        const photo = visiblePhotos[currentIndex];
        imageError.hidden = true;
        image.alt = photo.description;
        image.src = photo.fullImage;
        dialog!.querySelector<HTMLElement>("#lightbox-title")!.textContent = photo.title;
        dialog!.querySelector<HTMLElement>("#lightbox-description")!.textContent = photo.description;
        dialog!.querySelector<HTMLElement>("[data-lightbox-location]")!.textContent = photo.location;
        dialog!.querySelector<HTMLElement>("[data-lightbox-counter]")!.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(visiblePhotos.length).padStart(2, "0")}`;
        dialog!.querySelector<HTMLElement>("[data-lightbox-announcement]")!.textContent = `${photo.title}. Photograph ${currentIndex + 1} of ${visiblePhotos.length}.`;
        dialog!.querySelector<HTMLAnchorElement>("[data-full-image]")!.href = photo.fullImage;
        dialog!.querySelector<HTMLAnchorElement>("[data-image-retry]")!.href = photo.fullImage;
        const details = {
            camera: photo.camera_settings.camera,
            aperture: `ƒ/${photo.camera_settings.aperture}`,
            focal_length: `${photo.camera_settings.focal_length} mm`,
            iso: String(photo.camera_settings.iso),
        };
        for (const [key, value] of Object.entries(details)) {
            dialog!.querySelector<HTMLElement>(`[data-detail="${key}"]`)!.textContent = value;
        }
        dialog!.querySelector<HTMLElement>("[data-lightbox-tags]")!.replaceChildren(...photo.tags.map((tag) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = tag;
            button.dataset.lightboxTag = tag;
            button.setAttribute("aria-label", `Show photographs tagged ${tag}`);
            return button;
        }));
        previous.disabled = next.disabled = visiblePhotos.length < 2;

        // Warm the next frame while the current one is being viewed.
        if (visiblePhotos.length > 1) {
            const preload = new window.Image();
            preload.src = visiblePhotos[(currentIndex + 1) % visiblePhotos.length].fullImage;
        }
    }

    gallery.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        const filter = event.target.closest<HTMLButtonElement>("[data-filter], [data-select-tag]");
        if (filter) {
            selectTag(filter.dataset.filter ?? filter.dataset.selectTag ?? "");
            if (filter.hasAttribute("data-select-tag")) {
                filters.find((button) => button.dataset.filter === filter.dataset.selectTag)?.focus({ preventScroll: true });
            }
            return;
        }
        const link = event.target.closest<HTMLAnchorElement>("[data-open-photo]");
        if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        const photo = JSON.parse(link.dataset.photo!) as GalleryPhoto;
        const index = visiblePhotos.findIndex((entry) => entry.index === photo.index);
        if (index < 0) return;
        returnFocus = link;
        showPhoto(index);
        dialog!.showModal();
        document.body.classList.add("lightbox-open");
        closeButton.focus();
    });

    closeButton.addEventListener("click", () => dialog.close());
    previous.addEventListener("click", () => showPhoto(currentIndex - 1));
    next.addEventListener("click", () => showPhoto(currentIndex + 1));
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            if (visiblePhotos.length > 1) showPhoto(currentIndex + (event.key === "ArrowLeft" ? -1 : 1));
        }
    });
    dialog.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        const tag = event.target.closest<HTMLButtonElement>("[data-lightbox-tag]");
        if (tag) {
            const value = tag.dataset.lightboxTag!;
            returnFocus = filters.find((button) => button.dataset.filter === value) ?? null;
            dialog.close();
            selectTag(value);
        }
    });
    let backdropPointerDown = false;
    dialog.addEventListener("pointerdown", (event) => { backdropPointerDown = event.target === dialog; });
    dialog.addEventListener("pointerup", (event) => {
        if (backdropPointerDown && event.target === dialog) dialog.close();
        backdropPointerDown = false;
    });
    dialog.addEventListener("close", () => {
        document.body.classList.remove("lightbox-open");
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
    image.addEventListener("error", () => { imageError.hidden = false; });
    image.addEventListener("load", () => { imageError.hidden = true; });

    desktop.addEventListener("change", layoutGallery);
    tablet.addEventListener("change", layoutGallery);
    layoutGallery();
}

initializeGallery();
