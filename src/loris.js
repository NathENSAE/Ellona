document.addEventListener('DOMContentLoaded', () => {
    // Existing code for buttons and modal goes here...
    // ...

    // --- NEW INTRO ANIMATION CODE ---
    const introElement = document.getElementById('intro-glitch');
    const mainContent = document.querySelector('main');
    const headerContent = document.querySelector('header');
    
    // 1. Hide the main content initially (done via CSS, but good to check)
    mainContent.style.opacity = '0';
    headerContent.style.opacity = '0';
    
    // 2. Set the duration of the intro animation (e.g., 3.5 seconds)
    const introDuration = 3500; 

    // 3. Hide the intro overlay and reveal the main content after the duration
    setTimeout(() => {
        // Fade out the intro overlay
        if (introElement) {
            introElement.style.opacity = '0';
            introElement.style.pointerEvents = 'none'; // Make it unclickable
        }
        
        // Animate the main content in
        mainContent.style.transition = 'opacity 1s ease 0.5s';
        mainContent.style.opacity = '1';

        headerContent.style.transition = 'opacity 1s ease 0.5s';
        headerContent.style.opacity = '1';

        // Clean up the intro element after the fade-out
        setTimeout(() => {
             if (introElement) {
                introElement.style.display = 'none';
             }
        }, 1500); // 1.5 seconds after starting the fade-out
        
    }, introDuration); // Runs after 3.5 seconds

    const buttons = document.querySelectorAll('button[data-topic]');
    const modal = document.getElementById('popup-modal');
    const closeButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');

    // --- Existing DOM elements and intro logic remain above ---

    // New function to fetch news from your secure Express endpoint
    async function fetchNews(topic) {
        // Call the server endpoint, which then calls NewsAPI
        const response = await fetch(`/api/news?topic=${encodeURIComponent(topic)}`);
        if (!response.ok) {
            throw new Error('Could not load news. Server or API error.');
        }
        return response.json();
    }

    // Function to format the news articles for display
    function formatNews(articles) {
        if (articles.length === 0) {
            return '<p>No recent news found for this topic.</p>';
        }
        
        let html = '<ul>';
        articles.forEach(article => {
            const title = article.title || 'No Title';
            const url = article.url || '#';
            const source = article.source.name || 'Unknown Source';

            html += `
                <li>
                    <a href="${url}" target="_blank"><strong>${title}</strong></a>
                    <p class="source-info">Source: ${source}</p>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    }

    // Data mapping the topic to a nice title and keywords for the API
    const topics = {
        cars: {
            title: "🏎️ Les dernières nouvelles automobiles",
            keywords: 'supercars OR "voitures de collection"'
        },
        crypto: {
            title: "💰 Le top des actualités crypto",
            keywords: "bitcoin OR ethereum OR blockchain"
        },
        anime: {
            title: "🔥 Les nouveautés anime et manga",
            keywords: '"nouvel animé" OR manga'
        },
        tft: {
            title: "♟️ Pour devenir un pro de TFT",
            keywords: '"teamfight tactics"'
        }
    };

    // Updated function to show the modal with dynamic content
    async function showModal(topic) {
        const data = topics[topic];
        
        // 1. Show Loading State
        modalTitle.textContent = data.title;
        modalText.innerHTML = '<p class="loading-state">Fetching latest data... <span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></p>';
        modal.style.display = 'block';

        try {
            // 2. Fetch News
            const articles = await fetchNews(data.keywords);

            // 3. Display Results
            modalText.innerHTML = formatNews(articles);
        } catch (error) {
            console.error(error);
            modalText.innerHTML = `<p class="error-state"><strong>ERROR:</strong> Could not load news headlines. Please try again later.</p>`;
        }
    };

    // Event listeners for the buttons
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const topic = e.target.dataset.topic;
            showModal(topic);
        });
    });

    // Event listener to close the modal using the 'X'
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Event listener to close the modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});