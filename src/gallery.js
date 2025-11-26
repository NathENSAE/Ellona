const SUPABASE_URL = "https://nxicvujcwgyfkzfrgent.supabase.co";
const SUPABASE_KEY = "sb_publishable_foF1MsdY2jA3RuJ96HS_RA_tFmS6fJG";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CLOUD_NAME = "due68cbih";
const UPLOAD_PRESET = "ellona";

let currentPhotoId = null; // Tracks which photo is open in lightbox

// --- NEW DELETE FUNCTION ---
async function handleDelete(id) {
    // 1. Ask for confirmation
    const confirmDelete = confirm("Do you want to DELETE this photo?");
    
    if (confirmDelete) {
    // 2. Delete from Supabase
    const { error } = await supabaseClient
        .from('photos')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Error deleting: " + error.message);
    } else {
        // 3. Reload gallery to show it's gone
        alert("Photo deleted.");
        loadGallery();
    }
    }
}

// --- DRAG AND DROP LOGIC ---
function initSortable() {
    const gallery = document.getElementById('gallery');
    
    new Sortable(gallery, {
    animation: 150, // Smooth animation
    ghostClass: 'sortable-ghost', // Class for the "shadow" while dragging
    delay: 20, // Small delay to prevent accidental drags
    onEnd: function (evt) {
        // This runs when you drop the item
        saveNewOrder();
    },
    });
}

// --- SAVE ORDER TO SUPABASE ---
async function saveNewOrder() {
    const gallery = document.getElementById('gallery');
    const items = gallery.querySelectorAll('.gallery-item');
    
    // Create a list of updates
    const updates = [];
    
    items.forEach((item, index) => {
    const id = item.getAttribute('data-id');
    // We prepare an update for every single photo with its new index
    updates.push({
        id: parseInt(id),
        position: index,
        // We must include the URL or other required fields if your DB requires them, 
        // but usually partial updates work if configured, 
        // strictly speaking 'upsert' needs the primary key (id).
    });
    });

    // Send updates to Supabase
    // We use 'upsert' which updates existing rows based on ID
    const { error } = await supabaseClient
    .from('photos')
    .upsert(updates, { onConflict: 'id' });

    if (error) {
    console.error("Error saving order:", error);
    } else {
    console.log("New order saved!");
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

    await supabaseClient.from("photos").insert({ url: data.secure_url });
    
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

document.getElementById("fileInput").addEventListener("change", function() {
    const fileName = this.files[0]?.name;
    if(fileName) document.getElementById("statusText").innerText = fileName;
});

// --- LOAD GALLERY ---
async function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Loading...</p>';

    // Order by 'position' first, so the custom order is respected
    const { data, error } = await supabaseClient
    .from("photos")
    .select("*")
    .order("position", { ascending: true });

    if (error) return console.error(error);

    gallery.innerHTML = ""; 

    data.forEach(photo => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    
    // VITAL: Store the ID in the HTML so Sortable knows which photo moved
    item.setAttribute("data-id", photo.id); 

    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = "Gallery Photo";
    img.loading = "lazy";

    // Prevent dragging the image itself (interferes with reordering)
    img.addEventListener('dragstart', (e) => e.preventDefault());

    // Click to Open Lightbox
    item.addEventListener("click", (e) => {
        // Only open if we didn't just drag
        openLightbox(photo.url, photo.id);
    });

    item.appendChild(img);
    gallery.appendChild(item);
    });

    // Initialize the Drag and Drop logic
    initSortable();
}

// --- LIGHTBOX FUNCTIONS ---
function openLightbox(url, id) {
    const lightbox = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightbox-img");
    
    // Set content
    lbImg.src = url;
    currentPhotoId = id; // Remember this ID in case user clicks Delete

    // Show
    lightbox.style.display = "flex";
}

function closeLightbox() {
    document.getElementById("lightbox").style.display = "none";
    currentPhotoId = null;
}

// Close lightbox if clicking on the dark background (but not the image)
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