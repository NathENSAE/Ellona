const SUPABASE_URL = "https://nxicvujcwgyfkzfrgent.supabase.co";
const SUPABASE_KEY = "sb_publishable_foF1MsdY2jA3RuJ96HS_RA_tFmS6fJG";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CLOUD_NAME = "due68cbih";
const UPLOAD_PRESET = "ellona";

let swiperInstance = null; 

async function loadGallery() {
    console.log("Loading gallery...");
    // Order by 'position' first, so the custom order is respected
    const { data, error } = await supabaseClient
    .from("photos")
    .select("*")
    .order("position", { ascending: true });

    if (error) return console.error(error);

    const wrapper = document.getElementById("gallery-wrapper");
    wrapper.innerHTML = "";

    data.forEach(photo => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    
    const img = document.createElement("img");
    img.src = photo.url;
    // Store the Supabase ID inside the HTML element so we can read it later
    img.dataset.id = photo.id; 
    img.alt = "Photo";
    
    slide.appendChild(img);
    wrapper.appendChild(slide);
    });

    initSwiper();
}

function initSwiper() {
    if (swiperInstance !== null) swiperInstance.destroy(true, true);

    swiperInstance = new Swiper(".mySwiper", {
    spaceBetween: 0,
    centeredSlides: true,
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false, // Continues auto-swiping after interaction
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    // Events listener
    on: {
        click: function(swiper, event) {
        // Check if the clicked item is an image
        const clickedElement = event.target;
        if (clickedElement.tagName === 'IMG') {
            // Get the ID we stored earlier
            const photoId = clickedElement.dataset.id;
            if (photoId) {
            handleDelete(photoId);
            }
        }
        }
    }
    });
}

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

// Gallery Button Logic
document.getElementById("galleryBtn").addEventListener("click", () => {
    window.location.href = "gallery.html";
});

document.getElementById("fileInput").addEventListener("change", function() {
    const fileName = this.files[0]?.name;
    if(fileName) document.getElementById("statusText").innerText = fileName;
});

loadGallery();