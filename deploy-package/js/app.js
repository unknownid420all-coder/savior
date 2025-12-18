/**
 * SAVIOR MITRA - Main Application JavaScript
 * Frontend logic with complete routing, CRUD operations, and UI interactions
 */

// ==================== APPLICATION STATE ====================
const App = {
    currentPage: 'home',
    currentSubject: null,
    editingSubject: null,
    editingDocument: null,
    isAdmin: false,
    currentViewingDoc: null
};

// ==================== DOM ELEMENTS ====================
const elements = {
    // Pages
    pages: document.querySelectorAll('.page'),
    homePage: document.getElementById('homePage'),
    subjectPage: document.getElementById('subjectPage'),
    adminPage: document.getElementById('adminPage'),
    
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    hamburger: document.getElementById('hamburger'),
    navMenu: document.querySelector('.nav-menu'),
    themeToggle: document.getElementById('themeToggle'),
    adminLink: document.getElementById('adminLink'),
    adminLinkText: document.getElementById('adminLinkText'),
    
    // Home Page
    subjectsGrid: document.getElementById('subjectsGrid'),
    
    // Subject Page
    backBtn: document.getElementById('backBtn'),
    subjectTitle: document.getElementById('subjectTitle'),
    searchInput: document.getElementById('searchInput'),
    documentsGrid: document.getElementById('documentsGrid'),
    emptyState: document.getElementById('emptyState'),
    
    // Admin
    adminLoginContainer: document.getElementById('adminLoginContainer'),
    adminPanel: document.getElementById('adminPanel'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminUsername: document.getElementById('adminUsername'),
    adminPassword: document.getElementById('adminPassword'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Admin Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    adminSubjectsGrid: document.getElementById('adminSubjectsGrid'),
    adminDocumentsGrid: document.getElementById('adminDocumentsGrid'),
    documentSubjectFilter: document.getElementById('documentSubjectFilter'),
    
    // Modals
    subjectModal: document.getElementById('subjectModal'),
    documentModal: document.getElementById('documentModal'),
    viewDocumentModal: document.getElementById('viewDocumentModal'),
    
    // Subject Form
    subjectForm: document.getElementById('subjectForm'),
    subjectModalTitle: document.getElementById('subjectModalTitle'),
    subjectName: document.getElementById('subjectName'),
    subjectDescription: document.getElementById('subjectDescription'),
    subjectImageUpload: document.getElementById('subjectImageUpload'),
    subjectImageInput: document.getElementById('subjectImageInput'),
    subjectUploadPlaceholder: document.getElementById('subjectUploadPlaceholder'),
    subjectImagePreview: document.getElementById('subjectImagePreview'),
    subjectPreviewImg: document.getElementById('subjectPreviewImg'),
    removeSubjectImage: document.getElementById('removeSubjectImage'),
    
    // Document Form
    documentForm: document.getElementById('documentForm'),
    documentModalTitle: document.getElementById('documentModalTitle'),
    documentSubject: document.getElementById('documentSubject'),
    documentName: document.getElementById('documentName'),
    documentDescription: document.getElementById('documentDescription'),
    documentType: document.getElementById('documentType'),
    documentFileUpload: document.getElementById('documentFileUpload'),
    documentFileInput: document.getElementById('documentFileInput'),
    documentUploadPlaceholder: document.getElementById('documentUploadPlaceholder'),
    documentFilePreview: document.getElementById('documentFilePreview'),
    documentFileName: document.getElementById('documentFileName'),
    removeDocumentFile: document.getElementById('removeDocumentFile'),
    
    // View Document
    viewDocumentTitle: document.getElementById('viewDocumentTitle'),
    documentViewer: document.getElementById('documentViewer'),
    copyDocumentBtn: document.getElementById('copyDocumentBtn'),
    
    // UI
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    loadingSpinner: document.getElementById('loadingSpinner')
};

// ==================== INITIALIZATION ====================
async function init() {
    // Initialize window.dataService first
    await window.dataService.init();
    
    // Initialize default data
    await window.dataService.initializeDefaultData();
    
    // Load theme
    await loadTheme();
    
    // Check admin status
    App.isAdmin = window.dataService.isLoggedIn();
    updateAdminUI();
    
    // Load home page
    await loadHomePage();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ App initialized');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    elements.hamburger.addEventListener('click', toggleMobileMenu);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.backBtn.addEventListener('click', () => navigateTo('home'));
    
    // Admin
    elements.adminLoginForm.addEventListener('submit', handleAdminLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Admin Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });
    
    // Subject form
    document.getElementById('addSubjectBtn')?.addEventListener('click', () => openSubjectModal());
    elements.subjectForm.addEventListener('submit', handleSubjectSubmit);
    elements.subjectImageUpload.addEventListener('click', () => elements.subjectImageInput.click());
    elements.subjectImageInput.addEventListener('change', handleSubjectImageSelect);
    elements.removeSubjectImage.addEventListener('click', removeSubjectImage);
    
    // Document form
    document.getElementById('addDocumentBtn')?.addEventListener('click', () => openDocumentModal());
    elements.documentForm.addEventListener('submit', handleDocumentSubmit);
    elements.documentFileUpload.addEventListener('click', () => elements.documentFileInput.click());
    elements.documentFileInput.addEventListener('change', handleDocumentFileSelect);
    elements.removeDocumentFile.addEventListener('click', removeDocumentFile);
    elements.documentSubjectFilter.addEventListener('change', loadAdminDocuments);
    
    // View document
    elements.copyDocumentBtn.addEventListener('click', handleCopyDocument);
    
    // Drag and drop for images
    setupDragAndDrop(elements.subjectImageUpload, elements.subjectImageInput, handleSubjectImageSelect);
    setupDragAndDrop(elements.documentFileUpload, elements.documentFileInput, handleDocumentFileSelect);
}

function setupDragAndDrop(dropArea, fileInput, handler) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'), false);
    });
    
    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handler({ target: fileInput });
        }
    }, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// ==================== NAVIGATION ====================
function handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.getAttribute('data-page');
    console.log('Navigating to:', page, 'isAdmin:', App.isAdmin);
    
    if (page === 'admin' && !App.isAdmin) {
        navigateTo('admin');
        return;
    }
    
    navigateTo(page);
}

function navigateTo(page) {
    App.currentPage = page;
    
    // Update active nav link
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show page
    elements.pages.forEach(p => {
        p.classList.remove('active');
    });
    
    const pageMap = {
        'home': elements.homePage,
        'subject': elements.subjectPage,
        'admin': elements.adminPage
    };
    
    pageMap[page]?.classList.add('active');
    
    // Load page content
    if (page === 'home') {
        loadHomePage();
    } else if (page === 'admin') {
        loadAdminPage();
    }
    
    // Close mobile menu
    elements.navMenu.classList.remove('active');
    elements.hamburger.classList.remove('active');
}

function toggleMobileMenu() {
    elements.navMenu.classList.toggle('active');
    elements.hamburger.classList.toggle('active');
}

// ==================== THEME ====================
async function loadTheme() {
    const theme = await window.dataService.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

async function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    await window.dataService.setTheme(newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Switched to ${newTheme} mode`);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== HOME PAGE ====================
async function loadHomePage() {
    showLoading();
    
    try {
        const subjects = await window.dataService.getAllSubjects();
        renderSubjects(subjects);
    } catch (error) {
        showToast('Error loading subjects', 'error');
    }
    
    hideLoading();
}

function renderSubjects(subjects) {
    elements.subjectsGrid.innerHTML = '';
    
    if (subjects.length === 0) {
        elements.subjectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No subjects available</p>
                <small>Admin can add subjects from the Admin Panel</small>
            </div>
        `;
        return;
    }
    
    subjects.forEach((subject, index) => {
        const card = createSubjectCard(subject, index);
        elements.subjectsGrid.appendChild(card);
    });
}

function createSubjectCard(subject, index) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <img src="${subject.image}" alt="${subject.name}" class="subject-card-image">
        <div class="subject-card-overlay">
            <h3 class="subject-card-name">${subject.name}</h3>
            <p class="subject-card-description">${subject.description || ''}</p>
        </div>
        <i class="fas fa-arrow-right subject-card-icon"></i>
    `;
    
    card.addEventListener('click', () => openSubjectPage(subject));
    
    return card;
}

// ==================== SUBJECT PAGE ====================
async function openSubjectPage(subject) {
    App.currentSubject = subject;
    elements.subjectTitle.textContent = subject.name;
    elements.searchInput.value = '';
    
    navigateTo('subject');
    await loadSubjectDocuments();
}

async function loadSubjectDocuments(searchQuery = '') {
    showLoading();
    
    try {
        let documents = await window.dataService.getDocumentsBySubject(App.currentSubject.id);
        
        if (searchQuery) {
            documents = await window.dataService.searchDocuments(searchQuery, App.currentSubject.id);
        }
        
        renderDocuments(documents);
    } catch (error) {
        showToast('Error loading documents', 'error');
    }
    
    hideLoading();
}

function renderDocuments(documents) {
    elements.documentsGrid.innerHTML = '';
    
    if (documents.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.documentsGrid.style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.documentsGrid.style.display = 'grid';
    
    documents.forEach(doc => {
        const card = createDocumentCard(doc);
        elements.documentsGrid.appendChild(card);
    });
}

function createDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    
    const iconMap = {
        pdf: 'fa-file-pdf',
        word: 'fa-file-word',
        text: 'fa-file-alt'
    };
    
    card.innerHTML = `
        <div class="document-icon">
            <i class="fas ${iconMap[doc.type] || 'fa-file'}"></i>
        </div>
        <h4 class="document-name">${doc.name}</h4>
        <p class="document-description">${doc.description || 'No description'}</p>
        <div class="document-actions">
            <button class="btn-icon btn-primary view-btn">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="btn-icon btn-secondary copy-btn">
                <i class="fas fa-copy"></i> Copy
            </button>
        </div>
    `;
    
    card.querySelector('.view-btn').addEventListener('click', () => viewDocument(doc));
    card.querySelector('.copy-btn').addEventListener('click', () => copyDocumentContent(doc));
    
    return card;
}

async function handleSearch(e) {
    const query = e.target.value.trim();
    await loadSubjectDocuments(query);
}

// ==================== VIEW & COPY DOCUMENT ====================
function viewDocument(doc) {
    elements.viewDocumentTitle.textContent = doc.name;
    App.currentViewingDoc = doc;
    
    // Clear previous content
    elements.documentViewer.innerHTML = '';
    
    // Handle different document types
    if (doc.type === 'pdf') {
        // PDF documents
        if (doc.content.includes('base64')) {
            try {
                const base64Data = doc.content.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                
                elements.documentViewer.innerHTML = `
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; justify-content: center;">
                            <a href="${blobUrl}" download="${doc.name}" class="btn btn-primary" style="text-decoration: none;">
                                <i class="fas fa-download"></i> Download PDF
                            </a>
                        </div>
                        <iframe src="${blobUrl}" style="width: 100%; height: 600px; border: none; border-radius: 8px;"></iframe>
                    </div>
                `;
            } catch (e) {
                elements.documentViewer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: var(--danger-color);"></i>
                        <p>Error loading PDF</p>
                    </div>
                `;
            }
        } else {
            elements.documentViewer.innerHTML = `
                <iframe src="${doc.content}" style="width: 100%; height: 600px; border: none;"></iframe>
            `;
        }
    } else if (doc.type === 'word') {
        // Word documents - show viewer with download option
        if (doc.content.includes('base64')) {
            try {
                const base64Data = doc.content.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const mimeType = doc.name.endsWith('.docx')
                    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    : 'application/msword';
                const blob = new Blob([byteArray], { type: mimeType });
                const blobUrl = URL.createObjectURL(blob);
                
                elements.documentViewer.innerHTML = `
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="viewWordInBrowser('${blobUrl}', '${doc.name}')" class="btn btn-primary">
                                <i class="fas fa-eye"></i> View in Browser
                            </button>
                            <a href="${blobUrl}" download="${doc.name}" class="btn btn-secondary" style="text-decoration: none;">
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>
                        <div id="wordViewerContainer" style="width: 100%; min-height: 600px; border-radius: 8px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                            <div style="text-align: center; padding: 40px;">
                                <i class="fas fa-file-word" style="font-size: 80px; color: #2b579a; margin-bottom: 20px;"></i>
                                <h3 style="margin-bottom: 15px; color: var(--text-primary);">Word Document Ready</h3>
                                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                                    Click "View in Browser" to preview the document
                                </p>
                                <p style="font-size: 14px; color: var(--text-tertiary);">
                                    ${doc.name}
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            } catch (e) {
                elements.documentViewer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: var(--danger-color);"></i>
                        <p>Error loading document</p>
                    </div>
                `;
            }
        }
    } else {
        // Text documents
        let content = doc.content;
        
        // Only decode text files
        if (content.includes('base64') && content.includes('text/')) {
            try {
                const base64Data = content.split(',')[1];
                content = atob(base64Data);
            } catch (e) {
                content = 'Unable to decode content';
            }
        }
        
        elements.documentViewer.innerHTML = `
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; padding: 30px; background: rgba(255,255,255,0.03); border-radius: 12px; max-height: 600px; overflow-y: auto; line-height: 1.6; font-size: 14px; color: var(--text-primary); user-select: text;">${escapeHtml(content)}</pre>
        `;
    }
    
    openModal('viewDocumentModal');
}

// Global function for viewing Word documents in browser
window.viewWordInBrowser = function(blobUrl, fileName) {
    const container = document.getElementById('wordViewerContainer');
    
    // Show loading state
    container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="margin: 0 auto 20px;"></div>
            <p style="color: var(--text-primary);">Loading document viewer...</p>
        </div>
    `;
    
    // Use mammoth.js to convert to HTML
    fetch(blobUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            // Use mammoth.js if available
            if (typeof mammoth !== 'undefined') {
                mammoth.convertToHtml({arrayBuffer: arrayBuffer})
                    .then(result => {
                        container.innerHTML = `
                            <div style="background: white; color: black; padding: 40px; border-radius: 8px; max-height: 600px; overflow-y: auto; box-shadow: var(--shadow-md);">
                                ${result.value}
                            </div>
                        `;
                    })
                    .catch(err => {
                        showIframeViewer(container, blobUrl, fileName);
                    });
            } else {
                showIframeViewer(container, blobUrl, fileName);
            }
        })
        .catch(err => {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: var(--danger-color);"></i>
                    <p style="color: var(--text-primary);">Unable to load document viewer</p>
                    <p style="color: var(--text-secondary); font-size: 14px;">Please download the file to view it</p>
                </div>
            `;
        });
}

// Helper function to show iframe viewer fallback
function showIframeViewer(container, blobUrl, fileName) {
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; background: var(--bg-secondary); border-radius: 8px;">
            <i class="fas fa-info-circle" style="font-size: 60px; color: var(--primary-color); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 15px; color: var(--text-primary);">Preview Limitation</h3>
            <p style="color: var(--text-secondary); margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
                Due to browser security restrictions, Word documents stored locally cannot be previewed directly.
                <br><br>
                <strong>Options:</strong><br>
                1. Download the file and open it in Microsoft Word<br>
                2. Or upload documents to a server for online preview
            </p>
            <a href="${blobUrl}" download="${fileName}" class="btn btn-primary" style="text-decoration: none; margin-top: 20px;">
                <i class="fas fa-download"></i> Download ${fileName}
            </a>
        </div>
    `;
}

function handleCopyDocument() {
    if (App.currentViewingDoc) {
        copyDocumentContent(App.currentViewingDoc);
    }
}

async function copyDocumentContent(doc) {
    try {
        // For Word/PDF, try to copy any visible text content
        if (doc.type === 'word' || doc.type === 'pdf') {
            // Try to get text from the viewer
            const viewerContent = document.querySelector('#wordViewerContainer');
            if (viewerContent && viewerContent.innerText) {
                const textContent = viewerContent.innerText;
                if (textContent && textContent.trim().length > 0) {
                    await navigator.clipboard.writeText(textContent);
                    showToast('Content copied to clipboard!');
                    return;
                }
            }
            showToast('Please view the document first, then you can select and copy text manually.', 'error');
            return;
        }
        
        let content = doc.content;
        
        // Only decode text files
        if (content.includes('base64') && content.includes('text/')) {
            content = atob(content.split(',')[1]);
        }
        
        await navigator.clipboard.writeText(content);
        showToast('Content copied to clipboard!');
    } catch (error) {
        showToast('Failed to copy content', 'error');
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== ADMIN PAGE ====================
async function loadAdminPage() {
    if (!App.isAdmin) {
        elements.adminLoginContainer.style.display = 'flex';
        elements.adminPanel.style.display = 'none';
    } else {
        elements.adminLoginContainer.style.display = 'none';
        elements.adminPanel.style.display = 'block';
        await loadAdminSubjects();
        await loadAdminDocuments();
        await populateSubjectSelects();
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = elements.adminUsername.value.trim();
    const password = elements.adminPassword.value.trim();
    console.log('Login attempt:', username);
    
    showLoading();
    
    try {
        const result = await window.dataService.login(username, password);
        console.log('Login result:', result);
        
        if (result.success) {
            App.isAdmin = true;
            updateAdminUI();
            showToast('Login successful! Welcome, Admin.');
            elements.adminLoginForm.reset();
            await loadAdminPage();
        } else {
            showToast(result.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Login failed. Please try again.', 'error');
    }
    
    hideLoading();
}

function handleLogout() {
    window.dataService.logout();
    App.isAdmin = false;
    updateAdminUI();
    showToast('Logged out successfully');
    navigateTo('home');
}

function updateAdminUI() {
    if (App.isAdmin) {
        elements.adminLinkText.textContent = 'Admin Panel';
    } else {
        elements.adminLinkText.textContent = 'Admin Login';
    }
}

function handleTabSwitch(e) {
    const tab = e.currentTarget.getAttribute('data-tab');
    
    // Update tab buttons
    elements.tabBtns.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Update tab content
    elements.tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
}

// ==================== ADMIN - SUBJECTS ====================
async function loadAdminSubjects() {
    showLoading();
    
    try {
        const subjects = await window.dataService.getAllSubjects();
        renderAdminSubjects(subjects);
    } catch (error) {
        showToast('Error loading subjects', 'error');
    }
    
    hideLoading();
}

function renderAdminSubjects(subjects) {
    elements.adminSubjectsGrid.innerHTML = '';
    
    if (subjects.length === 0) {
        elements.adminSubjectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No subjects yet</p>
                <small>Click "Add Subject" to create one</small>
            </div>
        `;
        return;
    }
    
    subjects.forEach(subject => {
        const card = createAdminSubjectCard(subject);
        elements.adminSubjectsGrid.appendChild(card);
    });
}

function createAdminSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'admin-card';
    
    card.innerHTML = `
        <img src="${subject.image}" alt="${subject.name}" 
             style="width: 100%; height: 150px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
        <h4>${subject.name}</h4>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
            ${subject.description || 'No description'}
        </p>
        <div class="admin-card-actions">
            <button class="btn btn-sm btn-primary edit-subject-btn">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger delete-subject-btn">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    card.querySelector('.edit-subject-btn').addEventListener('click', () => openSubjectModal(subject));
    card.querySelector('.delete-subject-btn').addEventListener('click', () => deleteSubject(subject));
    
    return card;
}

async function deleteSubject(subject) {
    if (!confirm(`Are you sure you want to delete "${subject.name}"? This will also delete all related documents.`)) {
        return;
    }
    
    showLoading();
    
    try {
        await window.dataService.deleteSubject(subject.id);
        showToast('Subject deleted successfully');
        await loadAdminSubjects();
        await loadHomePage();
        await populateSubjectSelects();
    } catch (error) {
        showToast('Failed to delete subject', 'error');
    }
    
    hideLoading();
}

// ==================== ADMIN - DOCUMENTS ====================
async function loadAdminDocuments() {
    showLoading();
    
    try {
        const filterSubjectId = elements.documentSubjectFilter.value;
        const documents = filterSubjectId 
            ? await window.dataService.getDocumentsBySubject(filterSubjectId)
            : await window.dataService.getAllDocuments();
        
        renderAdminDocuments(documents);
    } catch (error) {
        showToast('Error loading documents', 'error');
    }
    
    hideLoading();
}

function renderAdminDocuments(documents) {
    elements.adminDocumentsGrid.innerHTML = '';
    
    if (documents.length === 0) {
        elements.adminDocumentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file"></i>
                <p>No documents yet</p>
                <small>Click "Add Document" to upload one</small>
            </div>
        `;
        return;
    }
    
    documents.forEach(doc => {
        const card = createAdminDocumentCard(doc);
        elements.adminDocumentsGrid.appendChild(card);
    });
}

function createAdminDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'admin-card';
    
    const iconMap = {
        pdf: 'fa-file-pdf',
        word: 'fa-file-word',
        text: 'fa-file-alt'
    };
    
    card.innerHTML = `
        <div class="document-icon" style="margin-bottom: 1rem;">
            <i class="fas ${iconMap[doc.type] || 'fa-file'}"></i>
        </div>
        <h4>${doc.name}</h4>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">
            Type: ${doc.type.toUpperCase()}
        </p>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
            ${doc.description || 'No description'}
        </p>
        <div class="admin-card-actions">
            <button class="btn btn-sm btn-primary edit-doc-btn">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger delete-doc-btn">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    card.querySelector('.edit-doc-btn').addEventListener('click', () => openDocumentModal(doc));
    card.querySelector('.delete-doc-btn').addEventListener('click', () => deleteDocument(doc));
    
    return card;
}

async function deleteDocument(doc) {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) {
        return;
    }
    
    showLoading();
    
    try {
        await window.dataService.deleteDocument(doc.id);
        showToast('Document deleted successfully');
        await loadAdminDocuments();
        
        // Refresh subject page if we're viewing it
        if (App.currentPage === 'subject' && App.currentSubject) {
            await loadSubjectDocuments();
        }
    } catch (error) {
        showToast('Failed to delete document', 'error');
    }
    
    hideLoading();
}

// ==================== SUBJECT MODAL ====================
async function openSubjectModal(subject = null) {
    App.editingSubject = subject;
    
    if (subject) {
        elements.subjectModalTitle.textContent = 'Edit Subject';
        elements.subjectName.value = subject.name;
        elements.subjectDescription.value = subject.description || '';
        
        if (subject.image) {
            elements.subjectUploadPlaceholder.style.display = 'none';
            elements.subjectImagePreview.style.display = 'block';
            elements.subjectPreviewImg.src = subject.image;
        }
    } else {
        elements.subjectModalTitle.textContent = 'Add Subject';
        elements.subjectForm.reset();
        elements.subjectUploadPlaceholder.style.display = 'block';
        elements.subjectImagePreview.style.display = 'none';
    }
    
    openModal('subjectModal');
}

function handleSubjectImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.subjectUploadPlaceholder.style.display = 'none';
        elements.subjectImagePreview.style.display = 'block';
        elements.subjectPreviewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeSubjectImage(e) {
    e.stopPropagation();
    elements.subjectImageInput.value = '';
    elements.subjectUploadPlaceholder.style.display = 'block';
    elements.subjectImagePreview.style.display = 'none';
}

async function handleSubjectSubmit(e) {
    e.preventDefault();
    
    const name = elements.subjectName.value.trim();
    const description = elements.subjectDescription.value.trim();
    const imageFile = elements.subjectImageInput.files[0];
    
    if (!name) {
        showToast('Please enter a subject name', 'error');
        return;
    }
    
    if (!App.editingSubject && !imageFile) {
        showToast('Please select an image', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const subjectData = {
            name,
            description
        };
        
        // Get image data
        if (imageFile) {
            subjectData.image = await fileToBase64(imageFile);
        } else if (App.editingSubject) {
            subjectData.image = App.editingSubject.image;
        }
        
        if (App.editingSubject) {
            await window.dataService.updateSubject(App.editingSubject.id, subjectData);
            showToast('Subject updated successfully');
        } else {
            await window.dataService.addSubject(subjectData);
            showToast('Subject added successfully');
        }
        
        closeModal('subjectModal');
        await loadAdminSubjects();
        await loadHomePage();
        await populateSubjectSelects();
    } catch (error) {
        showToast('Failed to save subject', 'error');
    }
    
    hideLoading();
}

// ==================== DOCUMENT MODAL ====================
async function openDocumentModal(document = null) {
    App.editingDocument = document;
    await populateSubjectSelects();
    
    if (document) {
        elements.documentModalTitle.textContent = 'Edit Document';
        elements.documentSubject.value = document.subjectId;
        elements.documentName.value = document.name;
        elements.documentDescription.value = document.description || '';
        elements.documentType.value = document.type;
        
        elements.documentUploadPlaceholder.style.display = 'none';
        elements.documentFilePreview.style.display = 'flex';
        elements.documentFileName.textContent = document.name;
    } else {
        elements.documentModalTitle.textContent = 'Add Document';
        elements.documentForm.reset();
        elements.documentUploadPlaceholder.style.display = 'block';
        elements.documentFilePreview.style.display = 'none';
    }
    
    openModal('documentModal');
}

async function populateSubjectSelects() {
    const subjects = await window.dataService.getAllSubjects();
    
    // Document form select
    elements.documentSubject.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        elements.documentSubject.appendChild(option);
    });
    
    // Filter select
    elements.documentSubjectFilter.innerHTML = '<option value="">All Subjects</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        elements.documentSubjectFilter.appendChild(option);
    });
}

function handleDocumentFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    elements.documentUploadPlaceholder.style.display = 'none';
    elements.documentFilePreview.style.display = 'flex';
    elements.documentFileName.textContent = file.name;
}

function removeDocumentFile(e) {
    e.stopPropagation();
    elements.documentFileInput.value = '';
    elements.documentUploadPlaceholder.style.display = 'block';
    elements.documentFilePreview.style.display = 'none';
}

async function handleDocumentSubmit(e) {
    e.preventDefault();
    
    const subjectId = elements.documentSubject.value;
    const name = elements.documentName.value.trim();
    const description = elements.documentDescription.value.trim();
    const type = elements.documentType.value;
    const file = elements.documentFileInput.files[0];
    
    if (!subjectId) {
        showToast('Please select a subject', 'error');
        return;
    }
    
    if (!name) {
        showToast('Please enter a document name', 'error');
        return;
    }
    
    if (!App.editingDocument && !file) {
        showToast('Please select a file', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const documentData = {
            subjectId,
            name,
            description,
            type
        };
        
        // Get file content
        if (file) {
            documentData.content = await fileToBase64(file);
        } else if (App.editingDocument) {
            documentData.content = App.editingDocument.content;
        }
        
        if (App.editingDocument) {
            await window.dataService.updateDocument(App.editingDocument.id, documentData);
            showToast('Document updated successfully');
        } else {
            await window.dataService.addDocument(documentData);
            showToast('Document added successfully');
        }
        
        closeModal('documentModal');
        await loadAdminDocuments();
        
        // Refresh subject page if we're viewing it
        if (App.currentPage === 'subject' && App.currentSubject) {
            await loadSubjectDocuments();
        }
    } catch (error) {
        showToast('Failed to save document', 'error');
    }
    
    hideLoading();
}

// ==================== UTILITY FUNCTIONS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    
    // Update icon based on type
    const icon = elements.toast.querySelector('i');
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        elements.toast.style.background = 'linear-gradient(135deg, var(--danger-color), #dc2626)';
    } else {
        icon.className = 'fas fa-check-circle';
        elements.toast.style.background = 'linear-gradient(135deg, var(--success-color), #22c55e)';
    }
    
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function showLoading() {
    elements.loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    elements.loadingSpinner.style.display = 'none';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);
