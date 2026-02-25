const CLOUD_NAME = "due68cbih";
const UPLOAD_PRESET = "ellona";

let swiperInstance = null;

async function loadGallery() {
    console.log("Loading gallery...");
    try {
        const res = await fetch("/api/photos");
        const data = await res.json();

        const wrapper = document.getElementById("gallery-wrapper");
        wrapper.innerHTML = "";

        data.forEach(photo => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";

            const img = document.createElement("img");
            img.src = photo.url;
            img.dataset.id = photo._id;
            img.alt = "Photo";

            slide.appendChild(img);
            wrapper.appendChild(slide);
        });

        initSwiper();
    } catch (err) {
        console.error("Error loading gallery:", err);
    }
}

function initSwiper() {
    if (swiperInstance !== null) swiperInstance.destroy(true, true);

    swiperInstance = new Swiper(".mySwiper", {
        spaceBetween: 0,
        centeredSlides: true,
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        on: {
            click: function (swiper, event) {
                const clickedElement = event.target;
                if (clickedElement.tagName === 'IMG') {
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

// Gallery Button Logic
document.getElementById("galleryBtn").addEventListener("click", () => {
    window.location.href = "gallery.html";
});

document.getElementById("fileInput").addEventListener("change", function () {
    const fileName = this.files[0]?.name;
    if (fileName) document.getElementById("statusText").innerText = fileName;
});

loadGallery();