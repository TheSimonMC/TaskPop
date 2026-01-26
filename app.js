/**
 * Pop-It Task Board - Vanilla JS
 * Handles State, Drag & Drop, Persistence, and Rendering
 */

const STORAGE_KEY = 'popit_tasks_v3'; // Bumped version

// --- DICTIONARY (I18N) ---
const translations = {
    en: {
        newTask: "New Task",
        searchPlaceholder: "Search tasks...",
        optAll: "All Priorities",
        optHigh: "High",
        optMedium: "Medium",
        optLow: "Low",
        sortCreated: "Sort: Created",
        sortDue: "Sort: Due Date",
        sortPriority: "Sort: Priority",
        showDone: "Show Done",
        zoneTodo: "TODO",
        zoneDoing: "DOING",
        zoneDone: "DONE ZONE",
        thStatus: "Status",
        thTitle: "Title",
        thPriority: "Priority",
        thDue: "Due Date",
        thTags: "Tags",
        thActions: "Actions",
        settingsTitle: "Settings",
        lblLang: "Language",
        lblTheme: "Theme",
        lblViewMode: "Board Mode",
        lblData: "Data",
        lblBackup: "Backup Data",
        btnClose: "Close",
        modalEdit: "Edit Task",
        modalNew: "New Task",
        formTitle: "Title",
        formStatus: "Status",
        formPriority: "Priority",
        formDesc: "Description",
        formDue: "Due Date",
        formColor: "Color",
        formTags: "Tags",
        btnCancel: "Cancel",
        btnSave: "Save",
        newProject: "New Project",
        confirmMsg: "Are you sure?",
        statusTodo: "Todo",
        statusDoing: "Doing",
        statusDone: "Done",
        msgDone: "Task Completed! 🎉",
        msgMovedDone: "Moved to Done!",
        msgDeleted: "Task deleted",
        modeFocused: "Focused",
        modeInfinite: "Infinite",
        lblImport: "Import Backup",
        msgImportOk: "Import successful!",
        msgImportFail: "Import failed: invalid file",
        msgImportCanceled: "Import canceled",
        confirmImportReplace: "Replace current data with imported backup?",
        importTitle: "Import Backup",
        importDesc: "What do you want to do with the imported backup?",
        importSeparate: "Import separately",
        importMerge: "Merge into current project",
        importCancel: "Cancel",
        msgImportLoaded: "Backup loaded. Choose an import mode.",
        msgImportMerged: "Merged into current project!",
        msgImportAddedProjects: "Imported as new projects!"


    },
    de: {
        newTask: "Neue Aufgabe",
        searchPlaceholder: "Suchen...",
        optAll: "Alle Prioritäten",
        optHigh: "Hoch",
        optMedium: "Mittel",
        optLow: "Niedrig",
        sortCreated: "Sort: Erstellt",
        sortDue: "Sort: Fälligkeit",
        sortPriority: "Sort: Priorität",
        showDone: "Erledigte zeigen",
        zoneTodo: "ZU TUN",
        zoneDoing: "IN ARBEIT",
        zoneDone: "ERLEDIGT",
        thStatus: "Status",
        thTitle: "Titel",
        thPriority: "Prio",
        thDue: "Fälligkeit",
        thTags: "Tags",
        thActions: "Aktionen",
        settingsTitle: "Einstellungen",
        lblLang: "Sprache",
        lblTheme: "Design",
        lblViewMode: "Board Modus",
        lblData: "Daten",
        lblBackup: "Backup herunterladen",
        btnClose: "Schließen",
        modalEdit: "Aufgabe bearbeiten",
        modalNew: "Neue Aufgabe",
        formTitle: "Titel",
        formStatus: "Status",
        formPriority: "Priorität",
        formDesc: "Beschreibung",
        formDue: "Fälligkeit",
        formColor: "Farbe",
        formTags: "Tags",
        btnCancel: "Abbrechen",
        btnSave: "Speichern",
        newProject: "Neues Projekt",
        confirmMsg: "Sind Sie sicher?",
        statusTodo: "Zu tun",
        statusDoing: "In Arbeit",
        statusDone: "Fertig",
        msgDone: "Aufgabe erledigt! 🎉",
        msgMovedDone: "In Erledigt verschoben!",
        msgDeleted: "Aufgabe gelöscht",
        modeFocused: "Fokussiert",
        modeInfinite: "Unendlich",
        lblImport: "Backup importieren",
        msgImportOk: "Import erfolgreich!",
        msgImportFail: "Import fehlgeschlagen: Datei ungültig",
        msgImportCanceled: "Import abgebrochen",
        confirmImportReplace: "Aktuelle Daten durch das Backup ersetzen?",
        importTitle: "Backup importieren",
        importDesc: "Was möchtest du mit dem importierten Backup machen?",
        importSeparate: "Separat importieren",
        importMerge: "Mit aktuellem Projekt mergen",
        importCancel: "Abbrechen",
        msgImportLoaded: "Backup geladen. Wähle einen Import-Modus.",
        msgImportMerged: "In aktuelles Projekt gemerged!",
        msgImportAddedProjects: "Als neue Projekte importiert!"


    }
};

const defaultState = {
    projects: [
        { id: 'proj_1', name: 'Personal', tasks: [] },
        { id: 'proj_2', name: 'Work', tasks: [] }
    ],
    activeProjectId: 'proj_1',
    settings: {
        showDone: true,
        sortBy: 'created',
        view: 'board',
        theme: 'light',
        lang: 'en',
        canvasMode: 'focused' // 'focused' or 'infinite'
    }
};

let appState = loadState();
let undoStack = [];
const PROJECT_GAP = 1600; // Pixels between projects in Infinite mode

// --- DOM ELEMENTS ---
const els = {
    tabsContainer: document.getElementById('project-tabs'),
    workspace: document.getElementById('workspace'),
    boardSurface: document.getElementById('board-surface'),
    listContainer: document.getElementById('list-container'),
    listBody: document.getElementById('list-tbody'),
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form'),
    confirmModal: document.getElementById('confirm-modal'),
    projectModal: document.getElementById('project-modal'),
    settingsModal: document.getElementById('settings-modal'),
    searchInput: document.getElementById('search-input'),
    filterPriority: document.getElementById('filter-priority'),
    sortSelect: document.getElementById('sort-select'),
    toggleDone: document.getElementById('toggle-done'),
    colorPicker: document.getElementById('color-picker')
};

// --- INITIALIZATION ---
function init() {
    applySettings();
    renderApp();
    setupEventListeners();
    setupDragAndDrop();
}

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultState;
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function isValidState(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!Array.isArray(obj.projects)) return false;
    if (!obj.settings || typeof obj.settings !== 'object') return false;
    // Minimal required settings keys (tolerant)
    if (!('lang' in obj.settings)) obj.settings.lang = 'en';
    if (!('theme' in obj.settings)) obj.settings.theme = 'light';
    if (!('view' in obj.settings)) obj.settings.view = 'board';
    if (!('sortBy' in obj.settings)) obj.settings.sortBy = 'created';
    if (!('showDone' in obj.settings)) obj.settings.showDone = true;
    if (!('canvasMode' in obj.settings)) obj.settings.canvasMode = 'focused';

    // Ensure each project has id/name/tasks
    for (const p of obj.projects) {
        if (!p || typeof p !== 'object') return false;
        if (!p.id || !p.name || !Array.isArray(p.tasks)) return false;
        // tasks should be objects; be tolerant
        p.tasks = p.tasks.filter(t => t && typeof t === 'object' && t.id && t.title);
        // normalize missing fields
        for (const tsk of p.tasks) {
            if (!tsk.tags) tsk.tags = [];
            if (!tsk.priority) tsk.priority = 'low';
            if (!tsk.status) tsk.status = 'todo';
            if (typeof tsk.x !== 'number') tsk.x = 100;
            if (typeof tsk.y !== 'number') tsk.y = 100;
            if (!tsk.createdAt) tsk.createdAt = Date.now();
            if (!tsk.updatedAt) tsk.updatedAt = Date.now();
        }
    }

    // activeProjectId fallback
    if (!obj.activeProjectId || !obj.projects.some(p => p.id === obj.activeProjectId)) {
        obj.activeProjectId = obj.projects[0]?.id || 'proj_1';
    }
    return true;
}

function importStateFromJson(jsonText) {
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch {
        return { ok: false, error: 'parse' };
    }

    if (!isValidState(parsed)) {
        return { ok: false, error: 'invalid' };
    }

    // Replace current state (simplest and safest)
    appState = parsed;
    saveState();
    applySettings();
    renderApp();
    return { ok: true };
}


function pushUndo() {
    undoStack.push(JSON.parse(JSON.stringify(appState)));
    if (undoStack.length > 5) undoStack.shift();
}

function undo() {
    if (undoStack.length === 0) return;
    appState = undoStack.pop();
    saveState();
    applySettings();
    renderApp();
    showToast('Undo successful');
}

// --- SETTINGS & I18N ---
function t(key) {
    const lang = appState.settings.lang || 'en';
    return translations[lang][key] || key;
}

function applySettings() {
    // Theme
    if (appState.settings.theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Static Text Translations
    document.getElementById('lbl-new-task').innerText = t('newTask');
    document.getElementById('search-input').placeholder = t('searchPlaceholder');
    document.getElementById('opt-all').innerText = t('optAll');
    document.getElementById('opt-high').innerText = t('optHigh');
    document.getElementById('opt-medium').innerText = t('optMedium');
    document.getElementById('opt-low').innerText = t('optLow');
    document.getElementById('opt-sort-created').innerText = t('sortCreated');
    document.getElementById('opt-sort-due').innerText = t('sortDue');
    document.getElementById('opt-sort-priority').innerText = t('sortPriority');
    document.getElementById('lbl-show-done').innerText = t('showDone');

    document.getElementById('th-status').innerText = t('thStatus');
    document.getElementById('th-title').innerText = t('thTitle');
    document.getElementById('th-priority').innerText = t('thPriority');
    document.getElementById('th-due').innerText = t('thDue');
    document.getElementById('th-tags').innerText = t('thTags');
    document.getElementById('th-actions').innerText = t('thActions');

    // Settings Modal
    document.getElementById('lbl-settings-title').innerText = t('settingsTitle');
    document.getElementById('lbl-language').innerText = t('lblLang');
    document.getElementById('lbl-theme').innerText = t('lblTheme');
    document.getElementById('lbl-view-mode').innerText = t('lblViewMode');
    document.getElementById('mode-focused').innerText = t('modeFocused');
    document.getElementById('mode-infinite').innerText = t('modeInfinite');
    document.getElementById('lbl-data').innerText = t('lblData');
    document.getElementById('lbl-backup').innerText = t('lblBackup');
    const importLbl = document.getElementById('lbl-import');
    if (importLbl) importLbl.innerText = t('lblImport');
    document.getElementById('close-settings').innerText = t('btnClose');

    // Forms
    document.getElementById('lbl-form-title').innerText = t('formTitle');
    document.getElementById('lbl-form-status').innerText = t('formStatus');
    document.getElementById('lbl-form-priority').innerText = t('formPriority');
    document.getElementById('lbl-form-desc').innerText = t('formDesc');
    document.getElementById('lbl-form-due').innerText = t('formDue');
    document.getElementById('lbl-form-color').innerText = t('formColor');
    document.getElementById('lbl-form-tags').innerText = t('formTags');
    document.getElementById('cancel-task-btn').innerText = t('btnCancel');
    document.getElementById('btn-save-task').innerText = t('btnSave');

    const statusSel = document.getElementById('task-status');
    statusSel.options[0].text = t('statusTodo');
    statusSel.options[1].text = t('statusDoing');
    statusSel.options[2].text = t('statusDone');

    document.getElementById('lbl-new-project').innerText = t('newProject');
    document.getElementById('cancel-project').innerText = t('btnCancel');
    document.getElementById('save-project').innerText = t('newProject');
    document.getElementById('confirm-msg').innerText = t('confirmMsg');

    // Import modal texts
    const it = document.getElementById('lbl-import-title');
    if (it) it.innerText = t('importTitle');
    const idesc = document.getElementById('lbl-import-desc');
    if (idesc) idesc.innerText = t('importDesc');
    const isep = document.getElementById('lbl-import-separate');
    if (isep) isep.innerText = t('importSeparate');
    const imerge = document.getElementById('lbl-import-merge');
    if (imerge) imerge.innerText = t('importMerge');
    const icancel = document.getElementById('lbl-import-cancel');
    if (icancel) icancel.innerText = t('importCancel');

}

// --- DATA HELPERS ---
function getActiveProject() {
    return appState.projects.find(p => p.id === appState.activeProjectId) || appState.projects[0];
}

// Filter tasks based on UI inputs
function filterTasks(tasks) {
    let result = tasks;

    if (!appState.settings.showDone) {
        result = result.filter(t => t.status !== 'done');
    }

    const term = els.searchInput.value.toLowerCase();
    if (term) {
        result = result.filter(t => 
            t.title.toLowerCase().includes(term) || 
            (t.desc && t.desc.toLowerCase().includes(term)) ||
            t.tags.some(tag => tag.toLowerCase().includes(term))
        );
    }

    const priority = els.filterPriority.value;
    if (priority !== 'all') {
        result = result.filter(t => t.priority === priority);
    }

    const sorter = appState.settings.sortBy;
    result.sort((a, b) => {
        if (sorter === 'priority') {
            const map = { high: 3, medium: 2, low: 1 };
            return map[b.priority] - map[a.priority];
        } else if (sorter === 'due') {
            return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
        } else {
            return b.createdAt - a.createdAt;
        }
    });

    return result;
}

// --- RENDERING ---
function renderApp() {
    renderTabs();
    
    const view = appState.settings.view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    els.toggleDone.checked = appState.settings.showDone;
    els.sortSelect.value = appState.settings.sortBy;

    if (view === 'board') {
        els.listContainer.style.display = 'none';
        els.boardSurface.style.display = 'block';
        renderBoard();
    } else {
        els.boardSurface.style.display = 'none';
        els.listContainer.style.display = 'block';
        renderList();
    }
}

function renderTabs() {
    els.tabsContainer.innerHTML = '';
    appState.projects.forEach((p, index) => {
        const btn = document.createElement('button');
        btn.className = `tab ${p.id === appState.activeProjectId ? 'active' : ''}`;
        btn.innerHTML = `${p.name} <span class="material-icons-round tab-delete" data-pid="${p.id}">close</span>`;
        
        btn.onclick = (e) => {
            if(e.target.classList.contains('tab-delete')) {
                confirmDeleteProject(p.id);
            } else {
                appState.activeProjectId = p.id;
                
                if (appState.settings.canvasMode === 'infinite') {
                    // Infinite mode: scroll to project offset
                    const targetX = index * PROJECT_GAP;
                    els.workspace.scrollTo({ left: targetX, behavior: 'smooth' });
                    // Also update UI to show active tab
                    saveState();
                    renderTabs(); // to update active class
                } else {
                    // Focused mode: reload data
                    saveState();
                    renderApp();
                }
            }
        };
        els.tabsContainer.appendChild(btn);
    });
}

function renderBoard() {
    els.boardSurface.innerHTML = '';
    const isInfinite = appState.settings.canvasMode === 'infinite';

    // 1. Determine which projects to render
    let projectsToRender = [];
    if (isInfinite) {
        projectsToRender = appState.projects;
        // Resize board surface width dynamically
        els.boardSurface.style.width = (appState.projects.length * PROJECT_GAP + 500) + 'px';
    } else {
        projectsToRender = [getActiveProject()];
        els.boardSurface.style.width = '3000px'; // Standard fixed size
    }

    // 2. Loop and render zones + tasks
    projectsToRender.forEach((proj, index) => {
        const xOffset = isInfinite ? index * PROJECT_GAP : 0;
        
        // Render Zone Guides (Background)
        const zoneTodo = createZoneGuide(t('zoneTodo'), 'zone-todo', xOffset);
        const zoneDoing = createZoneGuide(t('zoneDoing'), 'zone-doing', xOffset);
        const zoneDone = createZoneGuide(t('zoneDone'), 'zone-done', xOffset);
        
        els.boardSurface.appendChild(zoneTodo);
        els.boardSurface.appendChild(zoneDoing);
        els.boardSurface.appendChild(zoneDone);

        // Render Project Title (in Infinite Mode)
        if(isInfinite) {
            const titleEl = document.createElement('div');
            titleEl.className = 'project-region-title';
            titleEl.innerText = proj.name;
            titleEl.style.left = (xOffset + 50) + 'px';
            els.boardSurface.appendChild(titleEl);
        }

        // Render Tasks
        const tasks = filterTasks(proj.tasks);
        tasks.forEach(task => {
            const card = createTaskElement(task, proj.id);
            if (window.innerWidth > 600) {
                // Add offset to stored coordinates
                card.style.left = (task.x + xOffset) + 'px';
                card.style.top = task.y + 'px';
            }
            els.boardSurface.appendChild(card);
        });
    });
}

function createZoneGuide(text, className, xOffset) {
    const el = document.createElement('div');
    el.className = `zone-guide ${className}`;
    el.innerHTML = `<span>${text}</span>`;
    // Adjust left position by offset (CSS has base left, we add to it)
    // We need to parse CSS or just set standard values. Let's hardcode standards here for simplicity.
    let baseLeft = 0;
    if(className.includes('todo')) baseLeft = 50;
    if(className.includes('doing')) baseLeft = 500;
    if(className.includes('done')) baseLeft = 950;
    
    el.style.left = (baseLeft + xOffset) + 'px';
    return el;
}

function renderList() {
    els.listBody.innerHTML = '';
    // List view only shows Active Project (even in infinite mode, list is per project for sanity)
    const tasks = filterTasks(getActiveProject().tasks);
    
    if(tasks.length === 0) {
        els.listBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color:var(--text-light)">...</td></tr>`;
        return;
    }

    tasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="status-check ${task.status === 'done' ? 'is-done' : ''}" onclick="toggleTaskStatus('${task.id}', '${getActiveProject().id}')">
                ${task.status === 'done' ? '<span class="material-icons-round" style="font-size:16px">check</span>' : ''}
            </span></td>
            <td><strong>${task.title}</strong></td>
            <td><span class="chip priority-${task.priority}">${t('opt'+task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}</span></td>
            <td>${task.dueDate || '-'}</td>
            <td>${task.tags.join(', ')}</td>
            <td>
                <button class="icon-btn" style="width:30px;height:30px;" onclick="editTask('${task.id}', '${getActiveProject().id}')"><span class="material-icons-round" style="font-size:16px">edit</span></button>
                <button class="icon-btn" style="width:30px;height:30px;" onclick="confirmDeleteTask('${task.id}')"><span class="material-icons-round" style="font-size:16px">delete</span></button>
            </td>
        `;
        els.listBody.appendChild(tr);
    });
}

function createTaskElement(task, projectId) {
    const el = document.createElement('div');
    el.className = 'task-card';
    el.id = task.id;
    // Store project ID on element for drag logic
    el.dataset.pid = projectId; 
    
    if(task.color) el.style.backgroundColor = task.color;
    if(task.status === 'done') el.style.opacity = '0.7';

    const tagsHtml = task.tags.map(t => `<span class="chip">${t}</span>`).join('');
    
    el.innerHTML = `
        <div class="pin"></div>
        <div class="card-header">
            <div class="card-title">${task.title}</div>
            <div class="material-icons-round card-menu-btn" onclick="editTask('${task.id}', '${projectId}')">more_horiz</div>
        </div>
        <div class="chips">
            <span class="chip priority-${task.priority}">${t('opt'+task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}</span>
            ${tagsHtml}
        </div>
        ${task.desc ? `<div class="task-desc">${task.desc.substring(0, 50)}${task.desc.length>50?'...':''}</div>` : ''}
        <div class="card-footer">
            <span>${task.dueDate || ''}</span>
            <div class="status-check ${task.status === 'done' ? 'is-done' : ''}" data-action="toggle-done">
                 ${task.status === 'done' ? '<span class="material-icons-round" style="font-size:16px">check</span>' : ''}
            </div>
        </div>
    `;

    el.querySelector('[data-action="toggle-done"]').addEventListener('mousedown', (e) => {
        e.stopPropagation();
        toggleTaskStatus(task.id, projectId);
    });

    return el;
}

// --- DRAG & DROP ---
let dragItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function setupDragAndDrop() {
    els.boardSurface.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    
    els.boardSurface.addEventListener('touchstart', dragStart, {passive: false});
    document.addEventListener('touchmove', dragMove, {passive: false});
    document.addEventListener('touchend', dragEnd);
}

function dragStart(e) {
    if (appState.settings.view !== 'board') return;
    const card = e.target.closest('.task-card');
    if (!card || e.target.closest('button') || e.target.closest('.status-check') || e.target.closest('.card-menu-btn')) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    dragItem = card;
    document.querySelectorAll('.task-card').forEach(c => c.style.zIndex = '1');
    dragItem.style.zIndex = '1000';

    const rect = dragItem.getBoundingClientRect();
    dragOffsetX = clientX - rect.left;
    dragOffsetY = clientY - rect.top;

    dragItem.classList.add('dragging');
}

function dragMove(e) {
    if (!dragItem) return;
    e.preventDefault();

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const parentRect = els.boardSurface.getBoundingClientRect();
    let newX = clientX - parentRect.left - dragOffsetX;
    let newY = clientY - parentRect.top - dragOffsetY;

    // Boundary (simple)
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    dragItem.style.left = newX + 'px';
    dragItem.style.top = newY + 'px';
}

function dragEnd(e) {
    if (!dragItem) return;
    const rect = dragItem.getBoundingClientRect();
    const parentRect = els.boardSurface.getBoundingClientRect();
    const relativeX = rect.left - parentRect.left;
    const relativeY = rect.top - parentRect.top;
    
    // Determine Project ID
    const pid = dragItem.dataset.pid;
    // Find project
    const project = appState.projects.find(p => p.id === pid);
    
    if (project) {
        const task = project.tasks.find(t => t.id === dragItem.id);
        if (task) {
            // Calculate Project Offset
            let projectOffset = 0;
            if (appState.settings.canvasMode === 'infinite') {
                const pIndex = appState.projects.findIndex(p => p.id === pid);
                projectOffset = pIndex * PROJECT_GAP;
            }

            // Save X relative to project origin
            task.x = relativeX - projectOffset;
            task.y = relativeY;

            // Determine Status based on local X (relative to project start)
            const localX = task.x;

            if (localX > 900) {
                task.status = 'done';
                showToast(t('msgMovedDone'));
            } else if (localX > 450) {
                task.status = 'doing';
            } else {
                task.status = 'todo';
            }
            saveState();
            renderApp(); 
        }
    }
    dragItem.classList.remove('dragging');
    dragItem = null;
}

// --- CRUD ---
function toggleTaskStatus(taskId, projectId) {
    const project = appState.projects.find(p => p.id === projectId);
    const task = project ? project.tasks.find(t => t.id === taskId) : null;
    
    if (task) {
        task.status = task.status === 'done' ? 'todo' : 'done';
        saveState();
        renderApp();
        if(task.status === 'done') showToast(t('msgDone'));
    }
}

function openTaskModal(taskId = null, projectId = null) {
    const form = els.taskForm;
    form.reset();
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    document.querySelector('.color-dot[data-color="#ffffff"]').classList.add('selected');

    // If projectId provided, use that, else active
    // Store target project in a data attribute on the form for save
    els.taskForm.dataset.targetPid = projectId || appState.activeProjectId;

    if (taskId) {
        const project = appState.projects.find(p => p.id === (projectId || appState.activeProjectId));
        const task = project.tasks.find(t => t.id === taskId);
        
        document.getElementById('modal-title').innerText = t('modalEdit');
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.desc || '';
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-due').value = task.dueDate || '';
        document.getElementById('task-tags').value = task.tags.join(', ');

        if(task.color) {
            document.querySelectorAll('.color-dot').forEach(d => {
                d.classList.toggle('selected', d.dataset.color === task.color);
            });
        }
    } else {
        document.getElementById('modal-title').innerText = t('modalNew');
        document.getElementById('task-id').value = '';
    }
    
    els.taskModal.classList.remove('hidden');
    document.getElementById('task-title').focus();
}

function saveTask(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    if (!title.trim()) return;

    pushUndo();
    
    // Determine target project
    const targetPid = els.taskForm.dataset.targetPid || appState.activeProjectId;
    const project = appState.projects.find(p => p.id === targetPid);

    const tags = document.getElementById('task-tags').value.split(',').map(t => t.trim()).filter(t=>t);
    const selectedColorEl = document.querySelector('.color-dot.selected');
    const color = selectedColorEl ? selectedColorEl.dataset.color : '#ffffff';

    const taskData = {
        title,
        desc: document.getElementById('task-desc').value,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due').value,
        tags,
        color,
        updatedAt: Date.now()
    };

    if (id) {
        const task = project.tasks.find(t => t.id === id);
        Object.assign(task, taskData);
    } else {
        const newTask = {
            id: 'task_' + Date.now(),
            createdAt: Date.now(),
            x: 100 + (Math.random() * 50),
            y: 100 + (Math.random() * 50),
            ...taskData
        };
        project.tasks.push(newTask);
    }
    saveState();
    closeModals();
    renderApp();
}

function confirmDeleteTask(taskId) {
    els.confirmModal.classList.remove('hidden');
    const yesBtn = document.getElementById('confirm-yes');
    const newYes = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    
    newYes.onclick = () => {
        pushUndo();
        // We need to find which project this task is in (simplified)
        appState.projects.forEach(p => {
            p.tasks = p.tasks.filter(t => t.id !== taskId);
        });
        saveState();
        renderApp();
        closeModals();
        showToast(t('msgDeleted'), true);
    };
}

function editTask(taskId, projectId) { openTaskModal(taskId, projectId); }

function confirmDeleteProject(projId) {
    if (appState.projects.length <= 1) return;
    els.confirmModal.classList.remove('hidden');
    
    const yesBtn = document.getElementById('confirm-yes');
    const newYes = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    
    newYes.onclick = () => {
        appState.projects = appState.projects.filter(p => p.id !== projId);
        appState.activeProjectId = appState.projects[0].id;
        saveState();
        renderApp();
        closeModals();
    };
}

let pendingImportState = null;

function getImportSummary(state) {
    const projCount = state.projects.length;
    const taskCount = state.projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
    return { projCount, taskCount };
}

function openImportChoiceModal(state) {
    pendingImportState = state;

    const summaryEl = document.getElementById('import-summary');
    if (summaryEl) {
        const s = getImportSummary(state);
        summaryEl.innerText = `${s.projCount} projects • ${s.taskCount} tasks`;
    }

    document.getElementById('import-choice-modal').classList.remove('hidden');
    showToast(t('msgImportLoaded'));
}

function closeImportChoiceModal() {
    const m = document.getElementById('import-choice-modal');
    if (m) m.classList.add('hidden');
    pendingImportState = null;
}

function makeUniqueProjectName(baseName) {
    const existing = new Set(appState.projects.map(p => p.name));
    if (!existing.has(baseName)) return baseName;

    let i = 2;
    while (existing.has(`${baseName} (${i})`)) i++;
    return `${baseName} (${i})`;
}

function remapTaskIds(tasks, prefix) {
    return tasks.map(t => ({
        ...t,
        id: `${prefix}_${t.id || ('task_' + Date.now())}`,
        createdAt: t.createdAt || Date.now(),
        updatedAt: t.updatedAt || Date.now(),
        x: typeof t.x === 'number' ? t.x : 100,
        y: typeof t.y === 'number' ? t.y : 100,
        tags: Array.isArray(t.tags) ? t.tags : []
    }));
}

// Mode 1: Import separately = add projects from backup as NEW projects (no overwrite)
function importSeparately(state) {
    pushUndo();

    state.projects.forEach((p, idx) => {
        const newPid = `imp_proj_${Date.now()}_${idx}`;
        const newName = makeUniqueProjectName(p.name || 'Imported');

        const newProject = {
            id: newPid,
            name: newName,
            tasks: remapTaskIds(p.tasks || [], `imp_task_${newPid}`)
        };
        appState.projects.push(newProject);
    });

    // Keep current settings & active project
    saveState();
    renderApp();
    showToast(t('msgImportAddedProjects'));
}

// Mode 2: Merge into current project = pull ALL tasks from backup into active project
function mergeIntoCurrentProject(state) {
    pushUndo();

    const target = getActiveProject();
    const allImportedTasks = state.projects.flatMap((p, idx) => {
        const prefix = `merge_${Date.now()}_${idx}`;
        return remapTaskIds(p.tasks || [], prefix);
    });

    // Optional: place merged tasks a bit offset so they don’t overlap hard
    const offsetX = 60, offsetY = 40;
    let n = 0;
    for (const tsk of allImportedTasks) {
        tsk.x = (typeof tsk.x === 'number' ? tsk.x : 100) + offsetX + (n % 5) * 15;
        tsk.y = (typeof tsk.y === 'number' ? tsk.y : 100) + offsetY + (n % 5) * 15;
        n++;
        target.tasks.push(tsk);
    }

    saveState();
    renderApp();
    showToast(t('msgImportMerged'));
}


// --- EVENT LISTENERS ---
function setupEventListeners() {
    // New Task
    document.getElementById('new-task-btn').onclick = () => openTaskModal();
    document.getElementById('cancel-task-btn').onclick = closeModals;
    document.getElementById('confirm-no').onclick = closeModals;
    els.taskForm.onsubmit = saveTask;
    
    // Settings Modal
    document.getElementById('settings-open-btn').onclick = () => {
        const isDe = appState.settings.lang === 'de';
        document.getElementById('lang-en').classList.toggle('active', !isDe);
        document.getElementById('lang-de').classList.toggle('active', isDe);
        
        const isDark = appState.settings.theme === 'dark';
        document.getElementById('theme-light').classList.toggle('active', !isDark);
        document.getElementById('theme-dark').classList.toggle('active', isDark);

        const isInfinite = appState.settings.canvasMode === 'infinite';
        document.getElementById('mode-focused').classList.toggle('active', !isInfinite);
        document.getElementById('mode-infinite').classList.toggle('active', isInfinite);

        els.settingsModal.classList.remove('hidden');
    };
    document.getElementById('close-settings').onclick = closeModals;

    // View Mode Toggles (Settings)
    document.getElementById('mode-focused').onclick = () => {
        appState.settings.canvasMode = 'focused';
        saveState();
        applySettings();
        document.getElementById('mode-focused').classList.add('active');
        document.getElementById('mode-infinite').classList.remove('active');
        renderApp();
    };
    document.getElementById('mode-infinite').onclick = () => {
        appState.settings.canvasMode = 'infinite';
        saveState();
        applySettings();
        document.getElementById('mode-infinite').classList.add('active');
        document.getElementById('mode-focused').classList.remove('active');
        renderApp();
    };

    // Language Toggles
    document.getElementById('lang-en').onclick = () => {
        appState.settings.lang = 'en';
        saveState();
        applySettings();
        renderApp();
        document.getElementById('lang-en').classList.add('active');
        document.getElementById('lang-de').classList.remove('active');
    };
    document.getElementById('lang-de').onclick = () => {
        appState.settings.lang = 'de';
        saveState();
        applySettings();
        renderApp();
        document.getElementById('lang-de').classList.add('active');
        document.getElementById('lang-en').classList.remove('active');
    };

    // Theme Toggles
    document.getElementById('theme-light').onclick = () => {
        appState.settings.theme = 'light';
        saveState();
        applySettings();
        document.getElementById('theme-light').classList.add('active');
        document.getElementById('theme-dark').classList.remove('active');
    };
    document.getElementById('theme-dark').onclick = () => {
        appState.settings.theme = 'dark';
        saveState();
        applySettings();
        document.getElementById('theme-dark').classList.add('active');
        document.getElementById('theme-light').classList.remove('active');
    };

    document.getElementById('backup-btn').onclick = () => {
        // date in YYYY-MM-DD
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
    
        const fileName = `TaskPop - Workplace ${dateStr}.json`;
    
        const json = JSON.stringify(appState, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
    
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
    
        document.body.appendChild(a);
        a.click();
        a.remove();
    
        URL.revokeObjectURL(a.href);
    
        showToast(`Backup downloaded: ${fileName}`);
    };



    // Import
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    if (importBtn && importFile) {
        importBtn.onclick = () => {
            importFile.value = "";
            importFile.click();
        };

        importFile.addEventListener('change', async () => {
            const file = importFile.files && importFile.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                let parsed = JSON.parse(text);

                if (!isValidState(parsed)) {
                    showToast(t('msgImportFail'));
                    return;
                }

                // Instead of replacing immediately -> open pretty modal
                openImportChoiceModal(parsed);
            } catch {
                showToast(t('msgImportFail'));
            }
        });
    }


    document.getElementById('add-project-btn').onclick = () => {
        els.projectModal.classList.remove('hidden');
        document.getElementById('new-project-name').focus();
    };
    document.getElementById('cancel-project').onclick = closeModals;
    document.getElementById('save-project').onclick = () => {
        const name = document.getElementById('new-project-name').value;
        if(name) {
            appState.projects.push({ id: 'proj_' + Date.now(), name: name, tasks: [] });
            saveState();
            renderTabs();
            renderApp(); // Update canvas
            closeModals();
        }
    };

    els.colorPicker.addEventListener('click', (e) => {
        if(e.target.classList.contains('color-dot')) {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });

    els.searchInput.addEventListener('input', renderApp);
    els.filterPriority.addEventListener('change', renderApp);
    els.sortSelect.addEventListener('change', (e) => {
        appState.settings.sortBy = e.target.value;
        saveState();
        renderApp();
    });
    els.toggleDone.addEventListener('change', (e) => {
        appState.settings.showDone = e.target.checked;
        saveState();
        renderApp();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => {
            appState.settings.view = btn.dataset.view;
            saveState();
            renderApp();
        };
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });

    // Import choice modal buttons
    const importCancelBtn = document.getElementById('import-cancel-btn');
    const importSeparateBtn = document.getElementById('import-separate-btn');
    const importMergeBtn = document.getElementById('import-merge-btn');
    
    if (importCancelBtn) importCancelBtn.onclick = () => closeImportChoiceModal();
    
    if (importSeparateBtn) importSeparateBtn.onclick = () => {
        if (!pendingImportState) return;
        const st = pendingImportState;
        closeImportChoiceModal();
        closeModals(); // closes settings too (optional)
        importSeparately(st);
    };
    
    if (importMergeBtn) importMergeBtn.onclick = () => {
        if (!pendingImportState) return;
        const st = pendingImportState;
        closeImportChoiceModal();
        closeModals(); // closes settings too (optional)
        mergeIntoCurrentProject(st);
    };

}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
}

function showToast(msg, showUndoBtn = false) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${msg}</span> ${showUndoBtn ? '<span class="toast-undo">Undo</span>' : ''}`;
    
    if (showUndoBtn) {
        el.querySelector('.toast-undo').onclick = () => {
            undo();
            el.remove();
        };
    }
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// Start
init();