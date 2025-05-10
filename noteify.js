// Initial data
const initialData = {
    folders: {
        School: [
            {
                id: 1,
                name: 'Algebra 1',
                notes: [
                    { id: 1, title: 'Lecture 1', content: 'Introduction to algebraic expressions' },
                    { id: 2, title: 'Formulas', content: 'Key formulas for the semester' }
                ]
            }
        ],
        Work: [
            {
                id: 2,
                name: 'Project Alpha',
                notes: [
                    { id: 3, title: 'Meeting Notes', content: 'Client requirements discussed on May 8' },
                    { id: 4, title: 'Tasks', content: 'Deadline: May 15 - Complete initial prototype' }
                ]
            }
        ],
        Everyday: [
            {
                id: 3,
                name: 'Shopping Lists',
                notes: [
                    { id: 5, title: 'Groceries', content: 'Milk, eggs, bread, fruits' },
                    { id: 6, title: 'Home Supplies', content: 'Paper towels, soap, detergent' }
                ]
            }
        ],
        Other: [
            {
                id: 4,
                name: 'Ideas',
                notes: [
                    { id: 7, title: 'Book Recommendations', content: 'Books to read this summer' },
                    { id: 8, title: 'Gift Ideas', content: 'Birthday gift ideas for friends' }
                ]
            }
        ]
    },
    currentNoteType: 'School'
};

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const folderList = document.getElementById('folderList');
const addFolderNoteBtn = document.getElementById('addFolderNoteBtn');
const actionButtons = document.getElementById('actionButtons');
const addFolderBtn = document.getElementById('addFolderBtn');
const addNoteBtn = document.getElementById('addNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const noteBody = document.getElementById('noteBody');
const noteTypeSelector = document.querySelector('.note-type-selector');
const noteTypeDropdown = document.getElementById('noteTypeDropdown');
const editorContainer = document.getElementById('editorContainer');
const emptyState = document.getElementById('emptyState');

// App state
let state = {
    darkMode: false,
    folders: initialData.folders[initialData.currentNoteType],
    currentNoteType: initialData.currentNoteType,
    activeNote: null,
    activeFolder: null
};

// Event Listeners
themeToggle.addEventListener('click', toggleTheme);
addFolderNoteBtn.addEventListener('click', showActionButtons);
addFolderBtn.addEventListener('click', createNewFolder);
addNoteBtn.addEventListener('click', createNewNote);
noteTypeSelector.addEventListener('click', toggleNoteTypeDropdown);

// Initialize text editor behavior
initializeEditor();

// Initialize the app
renderFolders();

// Local Storage Functions
function saveToLocalStorage() {
    const dataToSave = {
        folders: initialData.folders,
        currentNoteType: state.currentNoteType,
        darkMode: state.darkMode
    };
    localStorage.setItem('noteifyData', JSON.stringify(dataToSave));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('noteifyData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        initialData.folders = parsedData.folders;
        state.currentNoteType = parsedData.currentNoteType;
        state.darkMode = parsedData.darkMode;
        state.folders = initialData.folders[state.currentNoteType];
        
        // Apply dark mode if it was saved
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
            const themeIcon = themeToggle.querySelector('use');
            themeIcon.setAttribute('href', '#icon-sun');
        }
        
        renderFolders();
    }
}

// Functions
function toggleTheme() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode', state.darkMode);
    const themeIcon = themeToggle.querySelector('use');
    themeIcon.setAttribute('href', state.darkMode ? '#icon-sun' : '#icon-moon');
    saveToLocalStorage();
}

function showActionButtons(e) {
    e.stopPropagation();
    const rect = addFolderNoteBtn.getBoundingClientRect();
    actionButtons.style.top = `${rect.bottom + 5}px`;
    actionButtons.style.left = `${rect.left}px`;
    actionButtons.style.display = 'block';

    // Close when clicking outside
    document.addEventListener('click', function closeActionButtons(e) {
        if (!actionButtons.contains(e.target) && e.target !== addFolderNoteBtn) {
            actionButtons.style.display = 'none';
            document.removeEventListener('click', closeActionButtons);
        }
    });
}

function changeNoteType(type) {
    state.currentNoteType = type;
    state.folders = initialData.folders[type];
    state.activeNote = null;
    state.activeFolder = null;
    
    // Update UI
    noteTypeSelector.textContent = type;
    editorContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    renderFolders();
    saveToLocalStorage();
}

function toggleNoteTypeDropdown(e) {
    e.stopPropagation();
    noteTypeDropdown.classList.toggle('dropdown-active');

    // Add event listeners to dropdown items
    const dropdownItems = noteTypeDropdown.querySelectorAll('div');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function () {
            changeNoteType(this.dataset.type);
            noteTypeDropdown.classList.remove('dropdown-active');
        });
    });

    // Close when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!noteTypeDropdown.contains(e.target) && e.target !== noteTypeSelector) {
            noteTypeDropdown.classList.remove('dropdown-active');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

async function createNewFolder() {
    const folderName = await showModal('Enter folder name:', true);
    if (folderName) {
        const newFolder = {
            id: Date.now(),
            name: folderName,
            notes: []
        };
        initialData.folders[state.currentNoteType].push(newFolder);
        state.folders = initialData.folders[state.currentNoteType];
        renderFolders();
        actionButtons.style.display = 'none';
        saveToLocalStorage();
    }
}

async function createNewNote() {
    if (state.activeFolder === null) {
        alert('Please select a folder first or create a new one.');
        return;
    }

    const noteTitle = await showModal('Enter note title:', true);
    if (noteTitle) {
        const folder = state.folders.find(f => f.id === state.activeFolder);
        if (folder) {
            const newNote = {
                id: Date.now(),
                title: noteTitle,
                content: ''
            };
            folder.notes.push(newNote);
            renderFolders();
            actionButtons.style.display = 'none';
            saveToLocalStorage();

            editorContainer.style.display = 'block';
            emptyState.style.display = 'none';
            setActiveNote(folder.id, newNote.id);
        }
    }
}

async function deleteNote(folderId, noteId, event) {
    event.stopPropagation();
    
    const confirmed = await showModal('Are you sure you want to delete this note?');
    if (confirmed) {
        const folder = state.folders.find(f => f.id === folderId);
        if (folder) {
            folder.notes = folder.notes.filter(n => n.id !== noteId);

            if (state.activeNote === noteId) {
                state.activeNote = null;
                noteTitle.value = '';
                noteBody.innerHTML = '';
                editorContainer.style.display = 'none';
                emptyState.style.display = 'flex';
            }

            renderFolders();
            saveToLocalStorage();
        }
    }
}

async function deleteFolder(folderId, event) {
    event.stopPropagation();
    
    const confirmed = await showModal('Are you sure you want to delete this folder and all its notes?');
    if (confirmed) {
        initialData.folders[state.currentNoteType] = initialData.folders[state.currentNoteType]
            .filter(f => f.id !== folderId);
        state.folders = initialData.folders[state.currentNoteType];
        
        if (state.activeFolder === folderId) {
            state.activeFolder = null;
            state.activeNote = null;
            editorContainer.style.display = 'none';
            emptyState.style.display = 'flex';
        }
        
        renderFolders();
        saveToLocalStorage();
    }
}

function toggleFolder(folderId) {
    const folderElement = document.querySelector(`.folder-item[data-id="${folderId}"]`);
    const arrow = folderElement.querySelector('.folder-arrow');
    const noteList = folderElement.querySelector('.note-list');

    arrow.classList.toggle('expanded');
    noteList.classList.toggle('expanded');

    // Set active folder
    state.activeFolder = folderId;
    highlightActiveFolder();
}

function setActiveNote(folderId, noteId) {
    state.activeNote = noteId;
    state.activeFolder = folderId;

    // Show editor, hide empty state
    editorContainer.style.display = 'block';
    emptyState.style.display = 'none';

    // Highlight active note and folder
    highlightActiveNote();
    highlightActiveFolder();

    // Expand folder if it's not already expanded
    const folderElement = document.querySelector(`.folder-item[data-id="${folderId}"]`);
    const noteList = folderElement.querySelector('.note-list');
    const arrow = folderElement.querySelector('.folder-arrow');

    if (!noteList.classList.contains('expanded')) {
        arrow.classList.add('expanded');
        noteList.classList.add('expanded');
    }

    // Load note content to editor
    const folder = state.folders.find(f => f.id === folderId);
    if (folder) {
        const note = folder.notes.find(n => n.id === noteId);
        if (note) {
            noteTitle.value = note.title;
            noteBody.innerHTML = note.content || '';

            // Remove placeholder if there's content
            if (note.content) {
                noteBody.classList.remove('placeholder');
            } else {
                noteBody.classList.add('placeholder');
            }
        }
    }
}

function highlightActiveNote() {
    // Remove active class from all notes
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to current note
    if (state.activeNote) {
        const activeNoteElement = document.querySelector(`.note-item[data-id="${state.activeNote}"]`);
        if (activeNoteElement) {
            activeNoteElement.classList.add('active');
        }
    }
}

function highlightActiveFolder() {
    // Remove active class from all folders
    document.querySelectorAll('.folder-header').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to current folder
    if (state.activeFolder) {
        const activeFolderElement = document.querySelector(`.folder-item[data-id="${state.activeFolder}"] .folder-header`);
        if (activeFolderElement) {
            activeFolderElement.classList.add('active');
        }
    }
}

function initializeRichTextEditor() {
    const toolbar = document.getElementById('formattingToolbar');
    const editor = document.getElementById('noteBody');

    // Enable content editing
    editor.contentEditable = 'true';
    document.execCommand('defaultParagraphSeparator', false, 'p');

    // Show toolbar when editor is focused
    editor.addEventListener('focus', () => {
        toolbar.style.display = 'block';
        updateToolbarPosition();
    });

    // Hide toolbar when editor loses focus (unless selecting text)
    editor.addEventListener('blur', (e) => {
        // Don't hide if clicking toolbar
        if (e.relatedTarget && toolbar.contains(e.relatedTarget)) {
            return;
        }
        if (!window.getSelection().toString()) {
            toolbar.style.display = 'none';
        }
    });

    // Update toolbar position on key events and mouse movement
    editor.addEventListener('keyup', updateToolbarPosition);
    editor.addEventListener('click', updateToolbarPosition);
    editor.addEventListener('mouseup', updateToolbarPosition);

    // Handle cursor movement
    editor.addEventListener('input', updateToolbarPosition);

    // Update on scroll
    editor.addEventListener('scroll', updateToolbarPosition);
    window.addEventListener('scroll', updateToolbarPosition);

    // Handle toolbar buttons
    toolbar.addEventListener('mousedown', (e) => {
        // Prevent editor from losing focus
        e.preventDefault();
        const button = e.target.closest('button');
        if (!button) return;

        const command = button.dataset.command;
        document.execCommand(command, false, null);
        updateToolbarState();
    });

    // Handle font size selection
    const fontSizeSelector = toolbar.querySelector('.font-size-selector');
    fontSizeSelector.addEventListener('change', (e) => {
        document.execCommand('fontSize', false, e.target.value);
        editor.focus();
    });

    // Update toolbar state on selection change
    document.addEventListener('selectionchange', updateToolbarState);
}

function handleSelection() {
    updateToolbarPosition();
    updateToolbarState();
}

function updateToolbarState() {
    const toolbar = document.getElementById('formattingToolbar');
    const buttons = toolbar.querySelectorAll('button[data-command]');
    
    buttons.forEach(button => {
        const command = button.dataset.command;
        try {
            const state = document.queryCommandState(command);
            button.classList.toggle('active', state);
        } catch (e) {
            console.warn(`Command state check failed for: ${command}`);
        }
    });

    // Update font size selector
    const fontSizeSelector = toolbar.querySelector('.font-size-selector');
    if (fontSizeSelector) {
        const size = document.queryCommandValue('fontSize');
        if (size) {
            fontSizeSelector.value = size;
        }
    }
}

function updateToolbarPosition() {
    const toolbar = document.getElementById('formattingToolbar');
    const editor = document.getElementById('noteBody');
    
    // Get cursor position
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // If no selection, use caret position
    if (rect.width === 0) {
        const clonedRange = range.cloneRange();
        const span = document.createElement('span');
        span.textContent = '|';
        clonedRange.insertNode(span);
        const spanRect = span.getBoundingClientRect();
        span.remove();
        
        // Position toolbar above the cursor
        const editorRect = editor.getBoundingClientRect();
        const toolbarHeight = toolbar.offsetHeight;
        
        toolbar.style.position = 'fixed';
        toolbar.style.left = `${spanRect.left}px`;
        toolbar.style.top = `${spanRect.top - toolbarHeight - 10}px`;
    } else {
        // Position toolbar above the selection
        toolbar.style.position = 'fixed';
        toolbar.style.left = `${rect.left}px`;
        toolbar.style.top = `${rect.top - toolbar.offsetHeight - 10}px`;
    }

    // Keep toolbar within window bounds
    const toolbarRect = toolbar.getBoundingClientRect();
    if (toolbarRect.left < 0) {
        toolbar.style.left = '0px';
    }
    if (toolbarRect.right > window.innerWidth) {
        toolbar.style.left = `${window.innerWidth - toolbarRect.width}px`;
    }
}

function initializeEditor() {
    // Handle note title changes
    noteTitle.addEventListener('input', saveNoteContent);

    // Handle note body changes
    noteBody.addEventListener('input', function () {
        saveNoteContent();
    });

    // Initialize rich text editing
    initializeRichTextEditor();

    // Add word count update functionality
    const wordCountElement = document.getElementById('wordCount');
    
    function updateWordCount() {
        const text = noteBody.textContent || '';
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const chars = text.length;
        wordCountElement.textContent = `${words} words | ${chars} chars`;
    }

    noteBody.addEventListener('input', updateWordCount);
    updateWordCount(); // Initial count
}

function saveNoteContent() {
    if (state.activeNote && state.activeFolder) {
        const folder = state.folders.find(f => f.id === state.activeFolder);
        if (folder) {
            const note = folder.notes.find(n => n.id === state.activeNote);
            if (note) {
                note.title = noteTitle.value;
                note.content = noteBody.innerHTML;
                renderFolders(); // Update notes list with new title
                saveToLocalStorage();
            }
        }
    }
}

function renderFolders() {
    folderList.innerHTML = '';

    state.folders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.className = 'folder-item';
        folderElement.dataset.id = folder.id;

        const isActive = state.activeFolder === folder.id;

        folderElement.innerHTML = `
            <div class="folder-header ${isActive ? 'active' : ''}" onclick="toggleFolder(${folder.id})">
                <span class="folder-name">${folder.name}</span>
                <div class="folder-actions">
                    <button class="delete-folder" onclick="deleteFolder(${folder.id}, event)">
                        <span class="icon">
                            <svg><use href="#icon-trash"/></svg>
                        </span>
                    </button>
                    <span class="folder-arrow ${isActive ? 'expanded' : ''}">
                        <svg><use href="#icon-arrow"/></svg>
                    </span>
                </div>
            </div>
            <div class="note-list ${isActive ? 'expanded' : ''}">
                ${folder.notes.map(note => `
                    <div class="note-item ${state.activeNote === note.id ? 'active' : ''}"
                         data-id="${note.id}"
                         onclick="setActiveNote(${folder.id}, ${note.id})">
                        <span>${note.title}</span>
                        <div class="note-actions">
                            <button class="delete-note" onclick="deleteNote(${folder.id}, ${note.id}, event)">
                                <span class="icon">
                                    <svg><use href="#icon-trash"/></svg>
                                </span>
                            </button>
                        </div>
                    </div>
                `).join('')}
                <div class="create-note" onclick="createNewNoteInFolder(${folder.id})">
                    <span>New note</span>
                    <span class="create-note-icon">+</span>
                </div>
            </div>
        `;

        folderList.appendChild(folderElement);
    });
}

function showModal(title, isInput = false) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalInput = document.getElementById('modalInput');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');

    modalTitle.textContent = title;
    modalInput.style.display = isInput ? 'block' : 'none';
    modalInput.value = '';
    modal.style.display = 'flex';
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    if (isInput) {
        modalInput.focus();
        modalConfirm.textContent = 'Create';
    } else {
        modalConfirm.textContent = 'Delete';
    }

    return new Promise((resolve) => {
        function cleanup() {
            // Trigger exit animation
            modal.classList.add('closing');
            modal.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('closing');
                modalConfirm.removeEventListener('click', handleConfirm);
                modalCancel.removeEventListener('click', handleCancel);
            }, 300); // Match this with your CSS transition duration
        }

        function handleConfirm() {
            cleanup();
            resolve(isInput ? modalInput.value : true);
        }

        function handleCancel() {
            cleanup();
            resolve(false);
        }

        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
    });
}

// Globally accessible functions for HTML event handlers
window.toggleFolder = toggleFolder;
window.setActiveNote = setActiveNote;
window.deleteNote = deleteNote;
window.createNewNoteInFolder = function (folderId) {
    state.activeFolder = folderId;
    createNewNote();
};
window.deleteFolder = deleteFolder;

// Load saved data when the page loads
document.addEventListener('DOMContentLoaded', loadFromLocalStorage);

// Calendar functionality
const calendarBtn = document.getElementById('calendarBtn');
const calendarPopup = document.getElementById('calendarPopup');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
let currentDate = new Date();
let selectedDate = null;

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const monthLength = lastDay.getDate();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.querySelector('.calendar-title').textContent = `${monthNames[month]} ${year}`;
    
    const calendarGrid = document.querySelector('.calendar-grid');
    const weekdays = calendarGrid.querySelectorAll('.calendar-weekday');
    const existingDays = calendarGrid.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let i = 1; i <= monthLength; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = i;
        
        const currentDay = new Date(year, month, i);
        if (currentDay.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        if (selectedDate && currentDay.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        dayElement.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
            dayElement.classList.add('selected');
            // You can add your date selection handling here
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

calendarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = calendarBtn.getBoundingClientRect();
    
    if (calendarPopup.classList.contains('show')) {
        closeCalendar();
    } else {
        calendarPopup.style.top = `${rect.bottom + 10}px`;
        calendarPopup.style.left = `${rect.right - 10}px`; // Changed this line to position from the right
        calendarPopup.classList.add('show');
        renderCalendar();
    }
});

// Add a function to close the calendar with animation
function closeCalendar() {
    calendarPopup.classList.add('hide');
    setTimeout(() => {
        calendarPopup.classList.remove('show', 'hide');
    }, 300);
}

// Update the document click handler
document.addEventListener('click', (e) => {
    if (!calendarPopup.contains(e.target) && e.target !== calendarBtn) {
        closeCalendar();
    }
});

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Advanced Search System
class SearchEngine {
    constructor(notes) {
        this.notes = notes;
        this.searchIndex = new Map();
        this.buildSearchIndex();
    }

    buildSearchIndex() {
        Object.values(this.notes).forEach(category => {
            category.forEach(folder => {
                folder.notes.forEach(note => {
                    const tokens = this.tokenize(`${note.title} ${note.content}`);
                    this.searchIndex.set(note.id, tokens);
                });
            });
        });
    }

    tokenize(text) {
        return text.toLowerCase()
            .split(/\W+/)
            .filter(token => token.length > 2);
    }

    search(query) {
        const queryTokens = this.tokenize(query);
        const results = new Map();

        this.searchIndex.forEach((tokens, noteId) => {
            const score = this.calculateRelevance(queryTokens, tokens);
            if (score > 0) {
                results.set(noteId, score);
            }
        });

        return Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([noteId]) => this.findNoteById(noteId));
    }

    calculateRelevance(queryTokens, docTokens) {
        let score = 0;
        queryTokens.forEach(token => {
            docTokens.forEach(docToken => {
                if (docToken.includes(token)) {
                    score += token.length === docToken.length ? 2 : 1;
                }
            });
        });
        return score;
    }

    findNoteById(noteId) {
        for (const category of Object.values(this.notes)) {
            for (const folder of category) {
                const note = folder.notes.find(n => n.id === noteId);
                if (note) return { ...note, folderId: folder.id };
            }
        }
        return null;
    }
}

// Note Analytics System
class NoteAnalytics {
    constructor(notes) {
        this.notes = notes;
        this.analytics = {};
    }

    generateAnalytics() {
        this.analytics = {
            totalNotes: 0,
            totalWords: 0,
            averageWordsPerNote: 0,
            mostEditedNote: null,
            recentlyModified: [],
            categoryDistribution: {},
            wordFrequency: new Map(),
            modificationTrends: new Map()
        };

        Object.entries(this.notes).forEach(([category, folders]) => {
            this.analytics.categoryDistribution[category] = 0;
            
            folders.forEach(folder => {
                folder.notes.forEach(note => {
                    this.processNote(note, category);
                });
            });
        });

        this.calculateAverages();
        return this.analytics;
    }

    processNote(note, category) {
        this.analytics.totalNotes++;
        this.analytics.categoryDistribution[category]++;

        const wordCount = this.countWords(note.content);
        this.analytics.totalWords += wordCount;

        this.updateWordFrequency(note.content);
        this.trackModification(note);
    }

    countWords(content) {
        return content.trim().split(/\s+/).length;
    }

    updateWordFrequency(content) {
        const words = content.toLowerCase().split(/\W+/);
        words.forEach(word => {
            if (word.length > 3) {
                this.analytics.wordFrequency.set(
                    word,
                    (this.analytics.wordFrequency.get(word) || 0) + 1
                );
            }
        });
    }

    trackModification(note) {
        const date = new Date(note.lastModified || Date.now()).toISOString().split('T')[0];
        this.analytics.modificationTrends.set(
            date,
            (this.analytics.modificationTrends.get(date) || 0) + 1
        );
    }

    calculateAverages() {
        this.analytics.averageWordsPerNote = 
            Math.round(this.analytics.totalWords / this.analytics.totalNotes);
    }
}

// Auto-save and Version Control
class VersionControl {
    constructor() {
        this.versions = new Map();
        this.maxVersions = 10;
    }

    saveVersion(noteId, content) {
        if (!this.versions.has(noteId)) {
            this.versions.set(noteId, []);
        }

        const versions = this.versions.get(noteId);
        versions.push({
            timestamp: Date.now(),
            content: content,
            version: versions.length + 1
        });

        // Keep only the last N versions
        if (versions.length > this.maxVersions) {
            versions.shift();
        }
    }

    getVersionHistory(noteId) {
        return this.versions.get(noteId) || [];
    }

    restoreVersion(noteId, versionNumber) {
        const versions = this.versions.get(noteId);
        if (!versions) return null;

        const version = versions.find(v => v.version === versionNumber);
        return version ? version.content : null;
    }
}

// Initialize advanced features
const searchEngine = new SearchEngine(initialData.folders);
const analytics = new NoteAnalytics(initialData.folders);
const versionControl = new VersionControl();

// Add auto-save functionality
let autoSaveTimeout;
noteBody.addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (state.activeNote) {
            versionControl.saveVersion(state.activeNote, noteBody.innerHTML);
            console.log('Auto-saved and version created');
        }
    }, 1000);
});

// Search function
function performSearch(query) {
    const results = searchEngine.search(query);
    console.log('Search results:', results);
    return results;
}

// Generate analytics report
function generateAnalyticsReport() {
    const report = analytics.generateAnalytics();
    console.log('Analytics Report:', report);
    return report;
}

// Add to window object for global access
window.performSearch = performSearch;
window.generateAnalyticsReport = generateAnalyticsReport;
window.versionControl = versionControl;
