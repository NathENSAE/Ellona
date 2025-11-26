// --- STEP 1: DEFINE YOUR LETTERS HERE ---
// Instead of "content", we use "filename" which points to your .txt file
const letters = [
    {
    title: "Sur l'admiration",
    date: "24 Novembre, 2025",
    preview: "Alors, par où commencer...", // Short text for the card
    filename: "letters/letter1.txt" // The path to the file
    },
    {
    title: "Sur le changement",
    date: "22 Octobre, 2025",
    preview: "Oui Éléa, la clé réside...",
    filename: "letters/letter2.txt"
    },
    // You can add as many as you want here...
];

const grid = document.getElementById('grid');
const modal = document.getElementById('reader-modal');
const titleEl = document.getElementById('modal-title');
const dateEl = document.getElementById('modal-date');
const bodyEl = document.getElementById('modal-body');

// --- STEP 2: BUILD THE GRID ---
letters.forEach(letter => {
    const card = document.createElement('div');
    card.className = 'envelope-card';
    card.innerHTML = `
    <h3>${letter.title}</h3>
    <div class="date">${letter.date}</div>
    <div class="preview">${letter.preview}</div>
    `;
    
    // When clicked, call the async function to load the file
    card.addEventListener('click', () => {
    loadAndOpenLetter(letter);
    });

    grid.appendChild(card);
});

// --- STEP 3: FETCH THE TEXT FILE ---
async function loadAndOpenLetter(letter) {
    // 1. Open Modal immediately
    modal.style.display = "flex";
    
    // 2. Set static info
    titleEl.innerText = letter.title;
    dateEl.innerText = letter.date;
    
    // 3. Show a loading state in the body
    bodyEl.innerText = "Unfolding letter...";

    try {
    // 4. Fetch the actual .txt file
    const response = await fetch(letter.filename);
    
    if (!response.ok) {
        throw new Error("Could not find the letter file.");
    }

    // 5. Get text and put it in the box
    const text = await response.text();
    bodyEl.innerText = text;

    } catch (error) {
    bodyEl.innerText = "Error: " + error.message + "\n\nMake sure the file exists in the 'letters' folder.";
    }
}

function closeLetter() {
    modal.style.display = "none";
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLetter();
});