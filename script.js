/**
 * Lumina Bible App Logic
 * Refactored to use Bolls Life API (bolls.life)
 */

const state = {
    translation: 'WEB', // Bolls uses uppercase codes (WEB, KJV, YLT)
    currentBook: null,  // Will store the integer ID now (e.g., 1 for Genesis)
    currentBookName: '', // Storing name for display since API doesn't return it
    currentChapter: 1,
    totalChapters: 0,
    books: []
};

// DOM Elements
const elements = {
    booksList: document.getElementById('books-list'),
    bibleText: document.getElementById('bible-text-container'),
    chapterTitle: document.getElementById('current-chapter-title'),
    prevBtn: document.getElementById('prev-chapter'),
    nextBtn: document.getElementById('next-chapter'),
    translationSelect: document.getElementById('translation-select'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menu-toggle'),
    themeToggles: [document.getElementById('theme-toggle-desktop'), document.getElementById('theme-toggle-mobile')]
};

// --- Initialization ---

async function init() {
    setupEventListeners();
    setupTheme();
    await fetchBooks();
    renderBookList('ot'); 
}

// --- Data Fetching ---

async function fetchBooks() {
    // Standard Protestant Canon
    // We map these to Bolls API IDs (1-66)
    const rawData = [
        { name: "Genesis", test: "ot", chapters: 50 },
        { name: "Exodus", test: "ot", chapters: 40 },
        { name: "Leviticus", test: "ot", chapters: 27 },
        { name: "Numbers", test: "ot", chapters: 36 },
        { name: "Deuteronomy", test: "ot", chapters: 34 },
        { name: "Joshua", test: "ot", chapters: 24 },
        { name: "Judges", test: "ot", chapters: 21 },
        { name: "Ruth", test: "ot", chapters: 4 },
        { name: "1 Samuel", test: "ot", chapters: 31 },
        { name: "2 Samuel", test: "ot", chapters: 24 },
        { name: "1 Kings", test: "ot", chapters: 22 },
        { name: "2 Kings", test: "ot", chapters: 25 },
        { name: "1 Chronicles", test: "ot", chapters: 29 },
        { name: "2 Chronicles", test: "ot", chapters: 36 },
        { name: "Ezra", test: "ot", chapters: 10 },
        { name: "Nehemiah", test: "ot", chapters: 13 },
        { name: "Esther", test: "ot", chapters: 10 },
        { name: "Job", test: "ot", chapters: 42 },
        { name: "Psalms", test: "ot", chapters: 150 },
        { name: "Proverbs", test: "ot", chapters: 31 },
        { name: "Ecclesiastes", test: "ot", chapters: 12 },
        { name: "Song of Solomon", test: "ot", chapters: 8 },
        { name: "Isaiah", test: "ot", chapters: 66 },
        { name: "Jeremiah", test: "ot", chapters: 52 },
        { name: "Lamentations", test: "ot", chapters: 5 },
        { name: "Ezekiel", test: "ot", chapters: 48 },
        { name: "Daniel", test: "ot", chapters: 12 },
        { name: "Hosea", test: "ot", chapters: 14 },
        { name: "Joel", test: "ot", chapters: 3 },
        { name: "Amos", test: "ot", chapters: 9 },
        { name: "Obadiah", test: "ot", chapters: 1 },
        { name: "Jonah", test: "ot", chapters: 4 },
        { name: "Micah", test: "ot", chapters: 7 },
        { name: "Nahum", test: "ot", chapters: 3 },
        { name: "Habakkuk", test: "ot", chapters: 3 },
        { name: "Zephaniah", test: "ot", chapters: 3 },
        { name: "Haggai", test: "ot", chapters: 2 },
        { name: "Zechariah", test: "ot", chapters: 14 },
        { name: "Malachi", test: "ot", chapters: 4 },
        { name: "Matthew", test: "nt", chapters: 28 },
        { name: "Mark", test: "nt", chapters: 16 },
        { name: "Luke", test: "nt", chapters: 24 },
        { name: "John", test: "nt", chapters: 21 },
        { name: "Acts", test: "nt", chapters: 28 },
        { name: "Romans", test: "nt", chapters: 16 },
        { name: "1 Corinthians", test: "nt", chapters: 16 },
        { name: "2 Corinthians", test: "nt", chapters: 13 },
        { name: "Galatians", test: "nt", chapters: 6 },
        { name: "Ephesians", test: "nt", chapters: 6 },
        { name: "Philippians", test: "nt", chapters: 4 },
        { name: "Colossians", test: "nt", chapters: 4 },
        { name: "1 Thessalonians", test: "nt", chapters: 5 },
        { name: "2 Thessalonians", test: "nt", chapters: 3 },
        { name: "1 Timothy", test: "nt", chapters: 6 },
        { name: "2 Timothy", test: "nt", chapters: 4 },
        { name: "Titus", test: "nt", chapters: 3 },
        { name: "Philemon", test: "nt", chapters: 1 },
        { name: "Hebrews", test: "nt", chapters: 13 },
        { name: "James", test: "nt", chapters: 5 },
        { name: "1 Peter", test: "nt", chapters: 5 },
        { name: "2 Peter", test: "nt", chapters: 3 },
        { name: "1 John", test: "nt", chapters: 5 },
        { name: "2 John", test: "nt", chapters: 1 },
        { name: "3 John", test: "nt", chapters: 1 },
        { name: "Jude", test: "nt", chapters: 1 },
        { name: "Revelation", test: "nt", chapters: 22 }
    ];
    
    // Transform data to include Bolls API ID (1-based index)
    state.books = rawData.map((book, index) => ({
        ...book,
        id: index + 1 // Bolls uses integer IDs: Genesis=1, Rev=66
    }));
}

async function loadChapter(bookId, chapter) {
    elements.bibleText.innerHTML = '<div class="loading-spinner">Loading...</div>';
    
    // Ensure we track the current book name for the title display
    const bookObj = state.books.find(b => b.id === bookId);
    if(bookObj) state.currentBookName = bookObj.name;

    try {
        // Bolls API Format: /get-text/{translation}/{bookId}/{chapter}/
        const response = await fetch(`https://bolls.life/get-text/${state.translation}/${bookId}/${chapter}/`);
        
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        
        // Bolls returns an empty array if the chapter doesn't exist
        if (Array.isArray(data) && data.length > 0) {
            renderText(data);
            updateNavigation(bookId, chapter);
        } else {
            throw new Error("Chapter data not found");
        }
        
        // Mobile: Close sidebar after selection
        if (window.innerWidth <= 768) {
            elements.sidebar.classList.remove('open');
        }

    } catch (error) {
        elements.bibleText.innerHTML = `<div class="error-container">
            <p class="error">Unable to load text.</p>
            <small>Make sure you are connected to the internet.</small>
        </div>`;
        console.error(error);
    }
}

// --- Rendering ---

function renderBookList(testament) {
    elements.booksList.innerHTML = '';
    
    const filteredBooks = state.books.filter(b => b.test === testament);
    
    filteredBooks.forEach(book => {
        const div = document.createElement('div');
        div.className = `book-item ${state.currentBook === book.id ? 'active' : ''}`;
        div.textContent = book.name;
        div.onclick = () => showChapterSelection(book);
        elements.booksList.appendChild(div);
    });
}

function showChapterSelection(book) {
    // Highlight active book
    state.currentBook = book.id;
    state.currentBookName = book.name;
    state.totalChapters = book.chapters;
    renderBookList(book.test); // Re-render to update active class

    // Show grid of chapters
    let gridHtml = `<div class="chapter-selection-view">
        <h3>Select a Chapter for ${book.name}</h3>
        <div class="chapter-grid">`;
    
    for (let i = 1; i <= book.chapters; i++) {
        gridHtml += `<div class="chapter-box" onclick="state.currentChapter = ${i}; loadChapter(${book.id}, ${i})">${i}</div>`;
    }
    
    gridHtml += `</div></div>`;
    elements.bibleText.innerHTML = gridHtml;
    elements.chapterTitle.textContent = book.name;
    
    // Disable nav buttons in chapter selection mode
    elements.prevBtn.disabled = true;
    elements.nextBtn.disabled = true;
}

function renderText(verses) {
    // Manually construct the title since Bolls doesn't return it
    const title = `${state.currentBookName} ${state.currentChapter}`;
    elements.chapterTitle.textContent = title;
    
    let html = '';
    
    // Bolls returns a simple array: [{ verse: 1, text: "..." }, { verse: 2, text: "..." }]
    verses.forEach(v => {
        html += `<p class="verse">
            <span class="verse-num">${v.verse}</span>
            ${v.text}
        </p>`;
    });

    // Add footer
    html += `<div style="margin-top: 2rem; font-size: 0.8rem; color: var(--text-secondary); border-top: 1px solid var(--border); padding-top: 1rem;">
        Translation: ${state.translation}<br>
        Source: bolls.life
    </div>`;

    elements.bibleText.innerHTML = html;
    elements.bibleText.scrollTop = 0;
}

function updateNavigation(bookId, chapter) {
    elements.prevBtn.disabled = chapter <= 1;
    elements.nextBtn.disabled = chapter >= state.totalChapters;
}

// --- Event Listeners ---

function setupEventListeners() {
    // Tab Switching (OT/NT)
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderBookList(btn.dataset.tab);
        });
    });

    // Navigation Buttons
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentChapter > 1) {
            state.currentChapter--;
            loadChapter(state.currentBook, state.currentChapter);
        }
    });

    elements.nextBtn.addEventListener('click', () => {
        if (state.currentChapter < state.totalChapters) {
            state.currentChapter++;
            loadChapter(state.currentBook, state.currentChapter);
        }
    });

    // Translation Select
    elements.translationSelect.addEventListener('change', (e) => {
        // Ensure uppercase for Bolls API
        state.translation = e.target.value.toUpperCase();
        if (state.currentBook) {
            loadChapter(state.currentBook, state.currentChapter);
        }
    });

    // Mobile Menu
    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !elements.sidebar.contains(e.target) && 
            !elements.menuToggle.contains(e.target)) {
            elements.sidebar.classList.remove('open');
        }
    });
}

// --- Theme Management ---

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    elements.themeToggles.forEach(btn => {
        if(!btn) return;
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcons(newTheme);
        });
    });
}

function updateThemeIcons(theme) {
    const iconName = theme === 'light' ? 'moon' : 'sun';
    elements.themeToggles.forEach(btn => {
        if(!btn) return;
        if(typeof lucide !== 'undefined') {
            btn.innerHTML = `<i data-lucide="${iconName}"></i>`;
            lucide.createIcons();
        } else {
            // Fallback if Lucide isn't loaded
            btn.textContent = theme === 'light' ? 'Dark' : 'Light';
        }
    });
}

// Run App
init();