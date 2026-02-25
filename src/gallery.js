const CLOUD_NAME = "due68cbih";
const UPLOAD_PRESET = "ellona";

let currentPhotoId = null; // Tracks which photo is open in lightbox

// --- NEW DELETE FUNCTION ---
async function handleDelete(id) {
    const confirmDelete = confirm("Do you want to DELETE this photo?");

    if (confirmDelete) {
        try {
            const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            alert("Photo deleted.");
            loadGallery();
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    }
}

// --- DRAG AND DROP LOGIC ---
function initSortable() {
    const gallery = document.getElementById('gallery');

    new Sortable(gallery, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        delay: 20,
        onEnd: function (evt) {
            saveNewOrder();
        },
    });
}

// --- SAVE ORDER TO BACKEND ---
async function saveNewOrder() {
    const gallery = document.getElementById('gallery');
    const items = gallery.querySelectorAll('.gallery-item');

    const updates = [];
    items.forEach((item, index) => {
        const id = item.getAttribute('data-id');
        updates.push({
            id: id,
            position: index,
        });
    });

    try {
        const res = await fetch('/api/photos/order', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });
        if (!res.ok) throw new Error("Failed to save order");
        console.log("New order saved!");
    } catch (err) {
        console.error("Error saving order:", err);
    }
}

// Upload Logic
document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    const statusText = document.getElementById("statusText");
    const btn = document.getElementById("uploadBtn");

    if (!file) return alert("Choose an image first!");

    btn.disabled = true;
    btn.innerText = "...";
    statusText.innerText = "Uploading...";

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error.message);

        // Save to our backend (MongoDB)
        await fetch("/api/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: data.secure_url })
        });

        fileInput.value = "";
        statusText.innerText = "Done!";
        setTimeout(() => { statusText.innerText = ""; }, 2000);
        loadGallery();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Upload";
    }
});

document.getElementById("fileInput").addEventListener("change", function () {
    const fileName = this.files[0]?.name;
    if (fileName) document.getElementById("statusText").innerText = fileName;
});

// --- LOAD GALLERY ---
async function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Loading...</p>';

    try {
        const res = await fetch("/api/photos");
        const data = await res.json();

        gallery.innerHTML = "";

        data.forEach(photo => {
            const item = document.createElement("div");
            item.className = "gallery-item";

            // Store MongoDB _id
            item.setAttribute("data-id", photo._id);

            const img = document.createElement("img");
            img.src = photo.url;
            img.alt = "Gallery Photo";
            img.loading = "lazy";

            img.addEventListener('dragstart', (e) => e.preventDefault());

            item.addEventListener("click", (e) => {
                openLightbox(photo.url, photo._id);
            });

            item.appendChild(img);
            gallery.appendChild(item);
        });

        initSortable();
    } catch (err) {
        console.error(err);
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Error loading photos.</p>';
    }
}

// --- LIGHTBOX FUNCTIONS ---
function openLightbox(url, id) {
    const lightbox = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightbox-img");

    lbImg.src = url;
    currentPhotoId = id;

    lightbox.style.display = "flex";
}

function closeLightbox() {
    document.getElementById("lightbox").style.display = "none";
    currentPhotoId = null;
}

document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") {
        closeLightbox();
    }
});

document.getElementById("lb-delete-btn").addEventListener("click", () => {
    if (currentPhotoId !== null) {
        handleDelete(currentPhotoId);
        closeLightbox();
    }
});

document.getElementById("lb-close-btn").addEventListener("click", closeLightbox);
document.getElementById("lb-close-btn-2").addEventListener("click", closeLightbox);

loadGallery();