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

    const { data, error } = await supabaseClient
    .from("photos")
    .select("*")
    .order("id", { ascending: false });

    if (error) {
    console.error(error);
    return;
    }

    gallery.innerHTML = ""; // Clear loading text

    data.forEach(photo => {
    // Create grid item container
    const item = document.createElement("div");
    item.className = "gallery-item";
    
    // Create image
    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = "Gallery Photo";
    img.loading = "lazy";

    // Add Click Event to Open Lightbox
    item.addEventListener("click", () => {
        openLightbox(photo.url, photo.id);
    });

    item.appendChild(img);
    gallery.appendChild(item);
    });
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