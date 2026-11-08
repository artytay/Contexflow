import { WORKFLOWS } from './workflows.js';

// Default / Sample Master Profile Data
const DEFAULT_VAULT = {
  skills_and_work: `CORE SKILLS & TALENTS:
- Systems Architecture, Notion Database Engineering, Workflow Automation (Zapier/Make)
- Strategic synthesis, rapid MVP development, prompt engineering & agent workflows
- Documentation, technical writing, process re-engineering

WORKING PREFERENCES:
- Highly autonomous, asynchronous-first communication
- Deep work blocks (minimal fragmented synchronous meetings)
- Outcome and leverage-driven rather than hours-logged driven`,

  limits_and_health: `HEALTH & BOUNDARIES:
- Manage screen fatigue: preference for self-paced, flexible learning rather than rigid live webinars
- Time allocation: Maximum 8-12 hours per week for new study or side projects

STRICT MUST-HAVES & MUST-NOTS:
- Must-Haves: High leverage, low artificial barrier to entry, recognized industry credibility or demonstrable portfolio artifact
- Must-Nots: Rigid 9-5 fixed schedules, overly academic theoretical programs without immediate practical application`,

  personality_reports: `PERSONALITY & COGNITIVE PROFILES:
- MBTI: INTJ (Strategic Visionary & Systems Builder)
- Communication Style: Direct, structured, low fluff, high clarity, evidence-grounded
- Operating Mode: Enjoys optimizing broken processes and turning messy information into elegant automated architectures.`,

  custom_doc: `SOURCE DOCUMENTATION & RESUME HIGHLIGHTS:
- Background in business operations, digital tools consulting, and modern productivity architectures.
- Seeking high-margin specialization to maximize earnings per hour worked.`
};

// Application State
const state = {
  workflows: { ...WORKFLOWS },
  activeWorkflowId: 'certifications',
  activeCategory: 'All',
  currentIndex: 0,
  answers: {},
  vault: { ...DEFAULT_VAULT },
  history: [],
  apiKey: '',
  model: 'gemini-3.5-flash-lite',
  hasServerKey: false,
  notionToken: '',
  notionDatabaseId: '',
  hasNotionToken: false,

  // Notion Grounding Sources & Vault Blocks
  selectedNotionSources: [],
  vaultBlocks: [],
  vaultHeadingGroups: {},
  vaultBlocksFilter: 'all',
  vaultViewMode: 'blocks',
  activeVaultTab: 'Working Style & Skills',
  draggedBlockId: null
};

// DOM Elements
const el = {
  workflowTabs: document.getElementById('workflow-tabs'),
  categoryChips: document.getElementById('category-chips'),
  toggleGroupedHubBtn: document.getElementById('toggle-grouped-hub-btn'),
  closeGroupedHubBtn: document.getElementById('close-grouped-hub-btn'),
  groupedSetsHub: document.getElementById('grouped-sets-hub'),
  groupedCategoriesGrid: document.getElementById('grouped-categories-grid'),
  workflowProgressPill: document.getElementById('workflow-progress-pill'),
  remainingCounter: document.getElementById('remaining-counter'),
  questionnaireView: document.getElementById('questionnaire-view'),
  outputView: document.getElementById('output-view'),
  currentWorkflowBadge: document.getElementById('current-workflow-badge'),
  stepCounter: document.getElementById('step-counter'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  questionLabel: document.getElementById('question-label'),
  questionHelp: document.getElementById('question-help'),
  inputContainer: document.getElementById('input-container'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  inspectBtn: document.getElementById('inspect-btn'),

  // Notion Relational Banner & Context
  notionContextBanner: document.getElementById('notion-context-banner'),
  setStatusPill: document.getElementById('set-status-pill'),
  setNameBadge: document.getElementById('set-name-badge'),
  expandedFromBadge: document.getElementById('expanded-from-badge'),
  parentSetName: document.getElementById('parent-set-name'),
  openNotionSetLink: document.getElementById('open-notion-set-link'),
  addSimilarQuestionBtn: document.getElementById('add-similar-question-btn'),
  generateHintsBtn: document.getElementById('generate-hints-btn'),
  questionContextBox: document.getElementById('question-context-box'),
  questionContextText: document.getElementById('question-context-text'),

  // Notion Sync Overlay
  notionSyncOverlay: document.getElementById('notion-sync-overlay'),
  syncOverlayTitle: document.getElementById('sync-overlay-title'),
  syncOverlayDesc: document.getElementById('sync-overlay-desc'),
  syncCountdownTimer: document.getElementById('sync-countdown-timer'),

  // Output
  outputTitle: document.getElementById('output-title'),
  outputSubtitle: document.getElementById('output-subtitle'),
  outputStatusSpinner: document.getElementById('output-status-spinner'),
  outputContent: document.getElementById('output-content'),
  restartBtn: document.getElementById('restart-btn'),
  pushNotionBtn: document.getElementById('push-notion-btn'),
  exportNotionResponsesBtn: document.getElementById('export-notion-responses-btn'),
  copyOutputBtn: document.getElementById('copy-output-btn'),
  downloadOutputBtn: document.getElementById('download-output-btn'),

  // History
  historyBtn: document.getElementById('history-btn'),
  historyCount: document.getElementById('history-count'),
  historyModal: document.getElementById('history-modal'),
  closeHistoryModal: document.getElementById('close-history-modal'),
  historyList: document.getElementById('history-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),

  // Vault Modal
  vaultBtn: document.getElementById('vault-btn'),
  vaultModal: document.getElementById('vault-modal'),
  closeVaultModal: document.getElementById('close-vault-modal'),
  saveVaultBtn: document.getElementById('save-vault-btn'),
  loadSampleVaultBtn: document.getElementById('load-sample-vault-btn'),
  compileVaultNotionBtn: document.getElementById('compile-vault-notion-btn'),
  vaultNotionStatus: document.getElementById('vault-notion-status'),
  vaultSkills: document.getElementById('vault-skills'),
  vaultLimits: document.getElementById('vault-limits'),
  vaultPersonality: document.getElementById('vault-personality'),
  vaultCustomDoc: document.getElementById('vault-custom-doc'),
  vaultFileInput: document.getElementById('vault-file-input'),
  dropZone: document.getElementById('drop-zone'),

  // Notion Sources & Vault Blocks
  toggleSourcesPickerBtn: document.getElementById('toggle-sources-picker-btn'),
  selectedSourcesCount: document.getElementById('selected-sources-count'),
  notionSourcesPanel: document.getElementById('notion-sources-panel'),
  closeSourcesPanelBtn: document.getElementById('close-sources-panel-btn'),
  notionSourceSearchInput: document.getElementById('notion-source-search-input'),
  notionSearchBtn: document.getElementById('notion-search-btn'),
  notionSearchResults: document.getElementById('notion-search-results'),
  selectedSourcesChips: document.getElementById('selected-sources-chips'),
  generateVaultBlocksBtn: document.getElementById('generate-vault-blocks-btn'),
  vaultBlocksOrganizer: document.getElementById('vault-blocks-organizer'),
  vaultBlocksFilter: document.getElementById('vault-blocks-filter'),
  toggleVaultViewModeBtn: document.getElementById('toggle-vault-view-mode-btn'),
  addVaultHeadingBtn: document.getElementById('add-vault-heading-btn'),

  // Custom Generator Modal
  customGeneratorBtn: document.getElementById('custom-generator-btn'),
  generatorModal: document.getElementById('generator-modal'),
  closeGeneratorModal: document.getElementById('close-generator-modal'),
  generatorGoalInput: document.getElementById('generator-goal-input'),
  generatorNumQuestions: document.getElementById('generator-num-questions'),
  runGeneratorBtn: document.getElementById('run-generator-btn'),
  genSpinner: document.getElementById('gen-spinner'),

  // Payload Modal
  payloadModal: document.getElementById('payload-modal'),
  closePayloadModal: document.getElementById('close-payload-modal'),
  payloadPreview: document.getElementById('payload-preview'),

  // Settings Modal
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettingsModal: document.getElementById('close-settings-modal'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  apiKeyInput: document.getElementById('api-key-input'),
  modelSelect: document.getElementById('model-select'),
  notionTokenInput: document.getElementById('notion-token-input'),
  notionDatabaseIdInput: document.getElementById('notion-database-id-input')
};

// Current Active Session for Export
let currentSessionRecord = null;

// Initialize Application
async function init() {
  loadStoredSettings();
  await checkServerConfig();
  renderWorkflowTabs();
  renderCurrentQuestion();
  setupEventListeners();
  updateHistoryUI();
  await loadNotionWorkflows();
}

// Fetch live Question Sets from Notion databases
async function loadNotionWorkflows() {
  try {
    const res = await fetch('/api/notion/questionnaires');
    if (res.ok) {
      const data = await res.json();
      if (data.workflows && data.workflows.length > 0) {
        data.workflows.forEach(wf => {
          state.workflows[wf.id] = wf;
        });
        renderWorkflowTabs();
        renderCurrentQuestion();
      }
    }
  } catch (err) {
    console.warn('Could not load Notion questionnaires:', err);
  }
}

// Check if server already has GEMINI_API_KEY from .env
async function checkServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      state.hasServerKey = data.hasServerKey;
      state.hasNotionToken = data.hasNotionToken;

      if (state.hasServerKey && !state.apiKey) {
        el.apiKeyInput.placeholder = 'Configured via .env on server';
      }
      if (state.hasNotionToken && !state.notionToken) {
        el.notionTokenInput.placeholder = 'Configured via .env on server';
      }
      if (data.notionDatabaseId && !state.notionDatabaseId) {
        state.notionDatabaseId = data.notionDatabaseId;
        el.notionDatabaseIdInput.value = data.notionDatabaseId;
      }
    }
  } catch (err) {
    console.warn('Server config check skipped');
  }
}

// Storage helpers
function loadStoredSettings() {
  const savedVault = localStorage.getItem('contextflow_vault');
  if (savedVault) {
    try {
      state.vault = { ...DEFAULT_VAULT, ...JSON.parse(savedVault) };
    } catch (e) {
      console.error('Failed to parse saved vault', e);
    }
  }

  const savedKey = localStorage.getItem('contextflow_api_key');
  if (savedKey) {
    state.apiKey = savedKey;
    el.apiKeyInput.value = savedKey;
  }

  const savedModel = localStorage.getItem('contextflow_model');
  if (savedModel) {
    state.model = savedModel;
    el.modelSelect.value = savedModel;
  }

  const savedNotionToken = localStorage.getItem('contextflow_notion_token');
  if (savedNotionToken) {
    state.notionToken = savedNotionToken;
    el.notionTokenInput.value = savedNotionToken;
  }

  const savedNotionDb = localStorage.getItem('contextflow_notion_db_id');
  if (savedNotionDb) {
    state.notionDatabaseId = savedNotionDb;
    el.notionDatabaseIdInput.value = savedNotionDb;
  }

  const savedHistory = localStorage.getItem('contextflow_history');
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory) || [];
    } catch (e) {
      state.history = [];
    }
  }

  // Populate Vault inputs
  el.vaultSkills.value = state.vault.skills_and_work || '';
  el.vaultLimits.value = state.vault.limits_and_health || '';
  el.vaultPersonality.value = state.vault.personality_reports || '';
  el.vaultCustomDoc.value = state.vault.custom_doc || '';
}

function updateHistoryUI() {
  el.historyCount.textContent = state.history.length;
}

// Calculate Question Set progress & status
function getQuestionSetProgress(wf) {
  const total = (wf.questions || []).length;
  if (total === 0) return { answered: 0, total: 0, remaining: 0, status: 'ready', label: 'Empty', pillText: 'Empty' };

  if (wf.responseStatus === 'Fully Answered') {
    return { answered: total, total, remaining: 0, status: 'complete', label: `✓ Complete (${total}/${total})`, pillText: 'Complete' };
  }

  const ansObj = state.answers[wf.id] || {};
  let answeredCount = 0;
  wf.questions.forEach(q => {
    const val = ansObj[q.id];
    if (val !== undefined && val !== null && val !== '') {
      if (Array.isArray(val) && val.length === 0) return;
      if (typeof val === 'object' && val.values && val.values.length === 0) return;
      answeredCount++;
    }
  });

  if (answeredCount === total) {
    return { answered: total, total, remaining: 0, status: 'complete', label: `✓ Complete (${total}/${total})`, pillText: 'Complete' };
  } else if (answeredCount > 0 || wf.responseStatus === 'Incomplete - Started') {
    const remaining = total - answeredCount;
    return {
      answered: answeredCount,
      total,
      remaining,
      status: 'in-progress',
      label: `⏳ ${remaining} left (${answeredCount}/${total})`,
      pillText: `${remaining} left`
    };
  } else {
    return {
      answered: 0,
      total,
      remaining: total,
      status: 'ready',
      label: `🔵 Ready • ${total} to answer`,
      pillText: `${total} to answer`
    };
  }
}

// Render Category Filter Chips
function renderCategoryChips() {
  if (!el.categoryChips) return;
  el.categoryChips.innerHTML = '';

  const categories = { 'All': 0 };
  Object.values(state.workflows).forEach(wf => {
    const cat = wf.badge || 'General';
    categories['All']++;
    categories[cat] = (categories[cat] || 0) + 1;
  });

  Object.entries(categories).forEach(([cat, count]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `category-chip-btn ${state.activeCategory === cat ? 'active' : ''}`;
    chip.innerHTML = `${escapeHtml(cat)} <span class="badge-pill" style="font-size:0.65rem; padding:1px 5px;">${count}</span>`;
    chip.addEventListener('click', () => {
      state.activeCategory = cat;
      renderCategoryChips();
      renderWorkflowTabs();
    });
    el.categoryChips.appendChild(chip);
  });
}

// Render Expandable Grouped Question Sets Directory Hub
function renderGroupedSetsHub() {
  if (!el.groupedCategoriesGrid) return;
  el.groupedCategoriesGrid.innerHTML = '';

  const grouped = {};
  Object.values(state.workflows).forEach(wf => {
    const cat = wf.badge || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(wf);
  });

  Object.entries(grouped).forEach(([cat, sets]) => {
    const col = document.createElement('div');
    col.className = 'grouped-category-column';

    const header = document.createElement('div');
    header.className = 'grouped-category-header';
    header.innerHTML = `
      <span>${escapeHtml(cat)}</span>
      <span class="badge-pill" style="font-size:0.7rem;">${sets.length} Sets</span>
    `;
    col.appendChild(header);

    sets.forEach(wf => {
      const progress = getQuestionSetProgress(wf);
      const card = document.createElement('div');
      card.className = `grouped-set-card ${wf.id === state.activeWorkflowId ? 'active' : ''}`;

      const statusPillClass = progress.status === 'complete' ? 'status-answered' :
                              (progress.status === 'in-progress' ? 'status-progress' : 'status-ready');

      card.innerHTML = `
        <div class="grouped-set-title-row">
          <div class="grouped-set-name">${wf.isNotion ? '<span style="color:#a78bfa; margin-right:3px;">❖</span>' : ''}${escapeHtml(wf.name)}</div>
          <span class="status-pill ${statusPillClass}" style="font-size:0.65rem; padding:1px 6px;">${progress.pillText}</span>
        </div>
        <div class="grouped-set-status-row">
          <span class="set-progress-text">${progress.label}</span>
          ${wf.isNotion && wf.notionUrl ? `<a href="${wf.notionUrl}" target="_blank" rel="noopener" class="text-xs" style="color:#a78bfa; text-decoration:none;" onclick="event.stopPropagation();">Notion ↗</a>` : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        switchWorkflow(wf.id);
        if (el.groupedSetsHub) el.groupedSetsHub.classList.add('hidden');
      });

      col.appendChild(card);
    });

    el.groupedCategoriesGrid.appendChild(col);
  });
}

// Render Workflow Switcher Tabs (filtered by active category)
function renderWorkflowTabs() {
  if (!el.workflowTabs) return;
  el.workflowTabs.innerHTML = '';
  const filteredWorkflows = Object.values(state.workflows).filter(wf => {
    if (state.activeCategory === 'All') return true;
    return (wf.badge || 'General') === state.activeCategory;
  });

  filteredWorkflows.forEach(wf => {
    const progress = getQuestionSetProgress(wf);
    const btn = document.createElement('button');
    btn.className = `workflow-tab-btn ${wf.id === state.activeWorkflowId ? 'active' : ''} ${wf.isNotion ? 'notion-tab-btn' : ''}`;

    const statusPillClass = progress.status === 'complete' ? 'status-answered' :
                            (progress.status === 'in-progress' ? 'status-progress' : 'status-ready');

    if (wf.isNotion) {
      btn.innerHTML = `<span style="font-size:0.75rem; color:#a78bfa; margin-right:4px;">❖</span> ${escapeHtml(wf.name)} <span class="status-pill ${statusPillClass}" style="font-size:0.65rem; margin-left:6px; padding:0 5px;">${progress.pillText}</span>`;
      btn.title = `Notion Question Set: ${escapeHtml(wf.fullName || wf.name)} (${progress.label})`;
    } else {
      btn.innerHTML = `${escapeHtml(wf.name)} <span class="status-pill ${statusPillClass}" style="font-size:0.65rem; margin-left:6px; padding:0 5px;">${progress.pillText}</span>`;
    }
    btn.addEventListener('click', () => switchWorkflow(wf.id));
    el.workflowTabs.appendChild(btn);
  });

  renderCategoryChips();
  renderGroupedSetsHub();
}

// Switch Active Workflow
function switchWorkflow(workflowId) {
  if (state.activeWorkflowId === workflowId) return;
  saveCurrentAnswer();
  state.activeWorkflowId = workflowId;
  state.currentIndex = 0;
  if (!state.answers[workflowId]) {
    state.answers[workflowId] = {};
  }

  // Update tabs UI
  document.querySelectorAll('.workflow-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === state.workflows[workflowId].name);
  });

  // Reset to questionnaire view
  el.questionnaireView.classList.remove('hidden');
  el.outputView.classList.add('hidden');

  renderCurrentQuestion();
}

// Current Workflow & Question Getters
function getCurrentWorkflow() {
  return state.workflows[state.activeWorkflowId];
}

function getCurrentQuestion() {
  const wf = getCurrentWorkflow();
  return wf.questions[state.currentIndex];
}

// Render Current Question Card
function renderCurrentQuestion() {
  const wf = getCurrentWorkflow();
  const q = getCurrentQuestion();
  const currentAnswers = state.answers[state.activeWorkflowId] || {};
  const currentVal = currentAnswers[q.id];

  // Header info
  el.currentWorkflowBadge.textContent = wf.badge;
  el.stepCounter.textContent = `Question ${state.currentIndex + 1} of ${wf.questions.length}`;

  const progressPercent = ((state.currentIndex + 1) / wf.questions.length) * 100;
  el.progressBarFill.style.width = `${progressPercent}%`;

  // Notion Context Banner
  if (wf.isNotion && el.notionContextBanner) {
    el.notionContextBanner.classList.remove('hidden');
    if (el.setNameBadge) el.setNameBadge.textContent = wf.fullName || wf.name;
    if (el.setStatusPill) {
      const status = wf.responseStatus || 'Ready for Responses';
      el.setStatusPill.textContent = status;
      el.setStatusPill.className = 'status-pill ' + (
        status === 'Fully Answered' ? 'status-answered' :
        (status === 'Incomplete - Started' ? 'status-progress' : 'status-ready')
      );
    }
    if (el.openNotionSetLink) {
      if (wf.notionUrl) {
        el.openNotionSetLink.href = wf.notionUrl;
        el.openNotionSetLink.classList.remove('hidden');
      } else {
        el.openNotionSetLink.classList.add('hidden');
      }
    }
    if (el.expandedFromBadge) {
      if (wf.parentSetTitle) {
        el.expandedFromBadge.classList.remove('hidden');
        if (el.parentSetName) el.parentSetName.textContent = wf.parentSetTitle;
      } else {
        el.expandedFromBadge.classList.add('hidden');
      }
    }
    if (el.addSimilarQuestionBtn) el.addSimilarQuestionBtn.classList.remove('hidden');
  } else if (el.notionContextBanner) {
    el.notionContextBanner.classList.add('hidden');
    if (el.addSimilarQuestionBtn) el.addSimilarQuestionBtn.classList.add('hidden');
  }

  // Update Workflow Progress Pill & Remaining Counter in active workflow view
  const progress = getQuestionSetProgress(wf);
  if (el.workflowProgressPill) {
    const statusPillClass = progress.status === 'complete' ? 'status-answered' :
                            (progress.status === 'in-progress' ? 'status-progress' : 'status-ready');
    el.workflowProgressPill.textContent = progress.pillText;
    el.workflowProgressPill.className = `status-pill ${statusPillClass}`;
  }
  if (el.remainingCounter) {
    if (progress.status === 'complete') {
      el.remainingCounter.textContent = '✓ All answered';
      el.remainingCounter.style.color = '#10b981';
    } else if (progress.status === 'in-progress') {
      el.remainingCounter.textContent = `⏳ ${progress.remaining} left to answer`;
      el.remainingCounter.style.color = '#fbbf24';
    } else {
      el.remainingCounter.textContent = `🔵 ${progress.total} to answer`;
      el.remainingCounter.style.color = '#94a3b8';
    }
  }

  el.questionLabel.textContent = q.label;
  el.questionHelp.textContent = q.helpText || '';

  // Notion Context Box
  if (el.questionContextBox && el.questionContextText) {
    if (q.contextHints) {
      el.questionContextText.textContent = q.contextHints;
      el.questionContextBox.classList.remove('hidden');
    } else {
      el.questionContextBox.classList.add('hidden');
    }
  }

  // Toggle hints button visibility: only if options exist
  if (el.generateHintsBtn) {
    if (q.options && q.options.length > 0) {
      el.generateHintsBtn.classList.remove('hidden');
    } else {
      el.generateHintsBtn.classList.add('hidden');
    }
  }

  // Render Input based on type
  el.inputContainer.innerHTML = '';

  // 1. QUESTIONS WITH OPTIONS (Supports toggling between Multi-Select and Ranked Priority)
  if (q.options && Array.isArray(q.options)) {
    renderFlexibleChoiceQuestion(q, currentVal);

  // 2. SUGGESTIONS WITH CUSTOM FIELD (15 Suggestions + Open Text Field)
  } else if (q.type === 'suggestions_with_custom') {
    renderSuggestionsWithCustomQuestion(q, currentVal);

  // 3. SHORT TEXT
  } else if (q.type === 'text') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.id = 'answer-input';
    input.placeholder = q.placeholder || 'Type your answer...';
    input.value = currentVal || '';
    el.inputContainer.appendChild(input);
    setTimeout(() => input.focus(), 50);

  // 4. TEXTAREA
  } else if (q.type === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.className = 'form-textarea';
    textarea.id = 'answer-input';
    textarea.rows = 4;
    textarea.placeholder = q.placeholder || 'Enter details...';
    textarea.value = currentVal || '';
    el.inputContainer.appendChild(textarea);
    setTimeout(() => textarea.focus(), 50);
  }

  // Navigation buttons
  el.prevBtn.disabled = state.currentIndex === 0;
  if (state.currentIndex === wf.questions.length - 1) {
    el.nextBtn.innerHTML = `Synthesize & Run Gemini <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  } else {
    el.nextBtn.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  }
}

// Render Flexible Choice Question (Supports toggling between Multi-Select and Ranked Priority)
function renderFlexibleChoiceQuestion(q, currentVal) {
  const container = document.createElement('div');
  container.className = 'flexible-choice-container';
  container.id = 'answer-input-container';

  // Determine initial mode: default to 'ranked' if question is ranked, otherwise 'multiselect'
  let currentMode = (currentVal && currentVal.mode) ? currentVal.mode : (q.type === 'ranked' ? 'ranked' : 'multiselect');
  let values = [];

  if (currentVal) {
    if (Array.isArray(currentVal)) {
      values = [...currentVal];
    } else if (currentVal.values && Array.isArray(currentVal.values)) {
      values = [...currentVal.values];
    } else if (typeof currentVal === 'string') {
      values = [currentVal];
    }
  }

  // Header Mode Switcher Bar
  const modeBar = document.createElement('div');
  modeBar.className = 'options-mode-bar';
  modeBar.innerHTML = `
    <span class="options-mode-label">Selection Mode:</span>
    <div class="mode-toggle-group">
      <button type="button" class="mode-toggle-btn ${currentMode === 'multiselect' ? 'active' : ''}" id="btn-mode-multi">
        ✓ Multi-Select
      </button>
      <button type="button" class="mode-toggle-btn ${currentMode === 'ranked' ? 'active' : ''}" id="btn-mode-ranked">
        # Ranked Priority
      </button>
    </div>
  `;
  container.appendChild(modeBar);

  const cardsContainer = document.createElement('div');
  cardsContainer.className = currentMode === 'ranked' ? 'ranked-container' : 'options-grid';
  container.appendChild(cardsContainer);

  function renderCards() {
    cardsContainer.className = currentMode === 'ranked' ? 'ranked-container' : 'options-grid';
    cardsContainer.innerHTML = '';

    q.options.forEach(opt => {
      const optInfo = (q.optionMap || []).find(o => o.text && o.text.trim().toLowerCase() === opt.trim().toLowerCase()) || {};
      const score = optInfo.confidenceScore;
      const fitClass = score >= 80 ? 'fit-high' : (score >= 50 ? 'fit-med' : 'fit-low');
      const fitBadge = score != null ? `<span class="option-fit-badge ${fitClass}">★ ${score}% Fit</span>` : '';
      const hasDetails = Boolean(optInfo.explanation || optInfo.examples || optInfo.workspaceAlignment);

      if (currentMode === 'ranked') {
        const rankIdx = values.indexOf(opt);
        const isRanked = rankIdx !== -1;
        const rankNumber = rankIdx + 1;

        const card = document.createElement('div');
        card.className = `ranked-card ${isRanked ? `is-ranked rank-${rankNumber}` : ''}`;

        let badgeHtml = '';
        if (isRanked) {
          if (rankNumber === 1) {
            badgeHtml = `<span class="rank-badge badge-1">#1 Top Pick</span>`;
          } else if (rankNumber === 2) {
            badgeHtml = `<span class="rank-badge badge-2">#2 Secondary</span>`;
          } else if (rankNumber === 3) {
            badgeHtml = `<span class="rank-badge badge-3">#3 Priority</span>`;
          } else {
            badgeHtml = `<span class="rank-badge badge-other">#${rankNumber} Choice</span>`;
          }
        } else {
          badgeHtml = `<span class="rank-badge">Click to Rank</span>`;
        }

        card.innerHTML = `
          <div class="ranked-left" style="width: 100%;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${badgeHtml}
                <span style="font-weight: 600;">${escapeHtml(opt)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${fitBadge}
                ${isRanked ? `<button class="rank-remove-btn" title="Remove rank">&times;</button>` : ''}
              </div>
            </div>
            ${hasDetails ? `
              <div style="width: 100%; margin-top: 0.35rem;">
                <button type="button" class="option-details-toggle" onclick="event.stopPropagation(); const body = this.parentElement.querySelector('.option-details-body'); body.classList.toggle('hidden');">
                  💡 Details & Workspace Rationale ▾
                </button>
                <div class="option-details-body ${optInfo.explanation ? '' : 'hidden'}">
                  ${optInfo.explanation ? `<div class="option-detail-section"><strong>Definition</strong> <div>${escapeHtml(optInfo.explanation)}</div></div>` : ''}
                  ${optInfo.examples ? `<div class="option-detail-section guiding-example"><strong>Self-Check</strong> <div>${escapeHtml(optInfo.examples)}</div></div>` : ''}
                  ${optInfo.workspaceEvidence ? `<div class="option-detail-section workspace-evidence"><strong>Notion Workspace Rationale</strong> <div>${escapeHtml(optInfo.workspaceEvidence)}</div></div>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        `;

        card.addEventListener('click', (e) => {
          if (e.target.closest('.rank-remove-btn')) {
            e.stopPropagation();
            values.splice(rankIdx, 1);
          } else if (e.target.closest('.option-details-toggle') || e.target.closest('.option-details-body')) {
            // Do not toggle selection when clicking details
            return;
          } else if (!isRanked) {
            values.push(opt);
          } else {
            values.splice(rankIdx, 1);
          }
          syncData();
          renderCards();
        });

        cardsContainer.appendChild(card);
      } else {
        // Multi-select mode
        const isSelected = values.includes(opt);
        const card = document.createElement('div');
        card.className = `option-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="option-checkbox" style="align-self: flex-start; margin-top: 3px;"></div>
          <div class="option-card-content">
            <div class="option-main-row">
              <span style="font-weight: 600; color: #f8fafc;">${escapeHtml(opt)}</span>
              ${fitBadge}
            </div>
            ${hasDetails ? `
              <button type="button" class="option-details-toggle" onclick="event.stopPropagation(); const body = this.parentElement.querySelector('.option-details-body'); body.classList.toggle('hidden');">
                💡 Details & Workspace Rationale ▾
              </button>
              <div class="option-details-body ${optInfo.explanation ? '' : 'hidden'}">
                ${optInfo.explanation ? `<div class="option-detail-section"><strong>Definition</strong> <div>${escapeHtml(optInfo.explanation)}</div></div>` : ''}
                ${optInfo.examples ? `<div class="option-detail-section guiding-example"><strong>Self-Check</strong> <div>${escapeHtml(optInfo.examples)}</div></div>` : ''}
                ${optInfo.workspaceEvidence ? `<div class="option-detail-section workspace-evidence"><strong>Notion Workspace Rationale</strong> <div>${escapeHtml(optInfo.workspaceEvidence)}</div></div>` : ''}
              </div>
            ` : ''}
          </div>
        `;

        card.addEventListener('click', (e) => {
          if (e.target.closest('.option-details-toggle') || e.target.closest('.option-details-body')) {
            // Do not toggle selection when clicking details
            return;
          }
          const idx = values.indexOf(opt);
          if (idx !== -1) {
            values.splice(idx, 1);
          } else {
            values.push(opt);
          }
          syncData();
          renderCards();
        });

        cardsContainer.appendChild(card);
      }
    });

    syncData();
  }

  function syncData() {
    container.dataset.choiceMode = currentMode;
    container.dataset.choiceJson = JSON.stringify({
      mode: currentMode,
      values: values
    });
  }

  // Mode button events
  modeBar.querySelector('#btn-mode-multi').addEventListener('click', () => {
    if (currentMode === 'multiselect') return;
    currentMode = 'multiselect';
    modeBar.querySelector('#btn-mode-multi').classList.add('active');
    modeBar.querySelector('#btn-mode-ranked').classList.remove('active');
    renderCards();
  });

  modeBar.querySelector('#btn-mode-ranked').addEventListener('click', () => {
    if (currentMode === 'ranked') return;
    currentMode = 'ranked';
    modeBar.querySelector('#btn-mode-ranked').classList.add('active');
    modeBar.querySelector('#btn-mode-multi').classList.remove('active');
    renderCards();
  });

  renderCards();
  el.inputContainer.appendChild(container);
}

// Render Suggestions with Custom Field Handler (15 suggestions + text box)
function renderSuggestionsWithCustomQuestion(q, currentVal) {
  const wrapper = document.createElement('div');
  wrapper.className = 'suggestions-wrapper';
  wrapper.id = 'answer-input-container';

  let selectedSuggestions = [];
  let customText = '';

  if (currentVal && typeof currentVal === 'object') {
    selectedSuggestions = Array.isArray(currentVal.suggestions) ? [...currentVal.suggestions] : [];
    customText = currentVal.custom || '';
  } else if (typeof currentVal === 'string') {
    customText = currentVal;
  }

  // Header with count badge
  const header = document.createElement('div');
  header.className = 'suggestions-header';
  header.innerHTML = `
    <span>Choose from common filters (click to toggle):</span>
    <span class="suggestions-count-badge" id="sugg-count">${selectedSuggestions.length} Selected</span>
  `;
  wrapper.appendChild(header);

  // Suggestions Grid
  const grid = document.createElement('div');
  grid.className = 'suggestions-grid';

  const suggestions = q.suggestions || [];
  suggestions.forEach(sugg => {
    const chip = document.createElement('div');
    const isSelected = selectedSuggestions.includes(sugg);
    chip.className = `suggestion-chip ${isSelected ? 'active' : ''}`;
    chip.innerHTML = `
      <span class="suggestion-indicator">${isSelected ? '✕' : '+'}</span>
      <span>${escapeHtml(sugg)}</span>
    `;

    chip.addEventListener('click', () => {
      const idx = selectedSuggestions.indexOf(sugg);
      if (idx !== -1) {
        selectedSuggestions.splice(idx, 1);
        chip.classList.remove('active');
        chip.querySelector('.suggestion-indicator').textContent = '+';
      } else {
        selectedSuggestions.push(sugg);
        chip.classList.add('active');
        chip.querySelector('.suggestion-indicator').textContent = '✕';
      }
      document.getElementById('sugg-count').textContent = `${selectedSuggestions.length} Selected`;
    });

    grid.appendChild(chip);
  });
  wrapper.appendChild(grid);

  // Custom text input section
  const customSection = document.createElement('div');
  customSection.className = 'custom-input-section';
  customSection.innerHTML = `
    <label class="form-label text-xs">Custom Additions, Personal Limitations & Health Notes:</label>
    <textarea id="custom-dealbreakers-input" class="form-textarea" rows="3" placeholder="${escapeHtml(q.customPlaceholder || 'Type any custom filters, notes, or non-negotiables...')}">${escapeHtml(customText)}</textarea>
  `;
  wrapper.appendChild(customSection);

  // Expose getters on the wrapper
  wrapper.getValue = () => {
    const customVal = document.getElementById('custom-dealbreakers-input')?.value.trim() || '';
    return {
      suggestions: selectedSuggestions,
      custom: customVal
    };
  };

  el.inputContainer.appendChild(wrapper);
}

// Save Current Question's Input into State
function saveCurrentAnswer() {
  const q = getCurrentQuestion();
  if (!q) return;

  if (!state.answers[state.activeWorkflowId]) {
    state.answers[state.activeWorkflowId] = {};
  }

  // Check flexible choice container (Options with Multi-Select or Ranked mode)
  const choiceContainer = document.getElementById('answer-input-container');
  if (choiceContainer && choiceContainer.dataset.choiceJson) {
    try {
      state.answers[state.activeWorkflowId][q.id] = JSON.parse(choiceContainer.dataset.choiceJson);
      return;
    } catch (e) {
      console.warn('Failed to parse choiceJson', e);
    }
  }

  if (q.type === 'suggestions_with_custom') {
    const wrapper = document.getElementById('answer-input-container');
    if (wrapper && typeof wrapper.getValue === 'function') {
      state.answers[state.activeWorkflowId][q.id] = wrapper.getValue();
    }
  } else if (q.type === 'text' || q.type === 'textarea') {
    const input = document.getElementById('answer-input');
    if (input) {
      state.answers[state.activeWorkflowId][q.id] = input.value.trim();
    }
  } else if (q.type === 'select') {
    const selected = el.inputContainer.querySelector('.option-card.selected');
    if (selected) {
      state.answers[state.activeWorkflowId][q.id] = selected.dataset.value || selected.querySelector('span').textContent;
    }
  } else if (q.type === 'multiselect') {
    const selectedCards = el.inputContainer.querySelectorAll('.option-card.selected');
    const values = Array.from(selectedCards).map(c => c.dataset.optionText);
    state.answers[state.activeWorkflowId][q.id] = values;
  }
}

// Next Question Handler
function handleNext() {
  saveCurrentAnswer();
  const wf = getCurrentWorkflow();
  const q = getCurrentQuestion();

  // Validate ranked question if minimum required
  const currentVal = state.answers[state.activeWorkflowId]?.[q.id];
  if (currentVal && currentVal.mode === 'ranked' && q.minRequired) {
    if ((currentVal.values || []).length < q.minRequired) {
      alert(`Please select at least your Top Pick (#1) and Secondary (#2) before advancing.`);
      return;
    }
  }

  if (state.currentIndex < wf.questions.length - 1) {
    // If Notion question set was 'Ready for Responses', mark as 'Incomplete - Started'
    if (wf.isNotion && wf.notionSetId && (!wf.responseStatus || wf.responseStatus === 'Ready for Responses')) {
      wf.responseStatus = 'Incomplete - Started';
      fetch('/api/notion/update-set-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionSetId: wf.notionSetId, status: 'Incomplete - Started' })
      }).catch(e => console.warn('Could not update status to Incomplete - Started:', e));
      renderWorkflowTabs();
    }

    state.currentIndex++;
    renderCurrentQuestion();
  } else {
    submitQuestionnaire();
  }
}

// Prev Question Handler
function handlePrev() {
  if (state.currentIndex > 0) {
    saveCurrentAnswer();
    state.currentIndex--;
    renderCurrentQuestion();
  }
}

// Assemble Master Prompt and Context
function buildPayload() {
  const wf = getCurrentWorkflow();
  const answers = state.answers[state.activeWorkflowId] || {};

  // Formatted Q&A pairs
  let qaText = `=== USER QUESTIONNAIRE RESPONSES (${wf.prettifiedTitle || wf.name}) ===\n`;
  if (wf.originalPrompt) {
    qaText += `ORIGINAL USER DIRECTIVE: "${wf.originalPrompt}"\n\n`;
  }

  wf.questions.forEach((q, idx) => {
    const val = answers[q.id];
    let formattedVal = 'Not specified';

    if (val && typeof val === 'object' && val.mode) {
      if (val.mode === 'ranked') {
        formattedVal = val.values && val.values.length
          ? val.values.map((item, i) => `${i + 1}. ${item}`).join('\n   ')
          : 'None ranked';
      } else {
        formattedVal = val.values && val.values.length ? val.values.join(', ') : 'None selected';
      }
    } else if (q.type === 'ranked' && Array.isArray(val)) {
      if (val.length === 0) {
        formattedVal = 'None ranked';
      } else {
        formattedVal = val.map((item, i) => `${i + 1}. ${item}`).join('\n   ');
      }
    } else if (q.type === 'suggestions_with_custom' && val) {
      const suggs = val.suggestions && val.suggestions.length ? val.suggestions.join('\n   - ') : 'None selected';
      const custom = val.custom ? val.custom : 'None provided';
      formattedVal = `Selected Filters:\n   - ${suggs}\n   Custom Notes & Limitations: ${custom}`;
    } else if (Array.isArray(val)) {
      formattedVal = val.length ? val.join(', ') : 'None selected';
    } else if (val) {
      formattedVal = val;
    }

    qaText += `\n[Q${idx + 1}] ${q.label}\nAnswer:\n   ${formattedVal}\n`;
  });

  // Formatted Master Profile Context
  const vaultText = `=== USER MASTER CONTEXT & BASELINE PROFILE ===
[WORKING PREFERENCES & SKILLS]
${state.vault.skills_and_work || 'None specified'}

[LIMITATIONS, HEALTH & STRICT BOUNDARIES]
${state.vault.limits_and_health || 'None specified'}

[PERSONALITY & COGNITIVE PROFILES]
${state.vault.personality_reports || 'None specified'}

[EXTERNAL / GOOGLE DOC CONTEXT]
${state.vault.custom_doc || 'None specified'}
`;

  const fullPrompt = `${qaText}\n\n${vaultText}\n\n=== DIRECTIVE ===
Using the baseline profiles, skills, limitations, and specific questionnaire answers provided above, fulfill your role and generate the comprehensive, personalized deliverable requested.`;

  return {
    workflowId: wf.id,
    workflowName: wf.name,
    prettifiedTitle: wf.prettifiedTitle || wf.name,
    originalPrompt: wf.originalPrompt || null,
    systemPrompt: wf.systemPrompt,
    prompt: fullPrompt,
    answers: answers,
    vault: state.vault,
    model: state.model,
    apiKey: state.apiKey
  };
}

// Generate Realistic Demo Content if API Key is not yet set
function generateDemoDeliverable(payload) {
  const answers = payload.answers;
  const isCerts = payload.workflowId === 'certifications';

  if (isCerts) {
    const topPriorities = answers.priority_ranking || ['High Hourly Rate', 'Lowest Barrier to Entry'];
    const earnings = answers.current_earnings_target || '$100+/hr';
    const hours = answers.weekly_time_commitment || '5-10 hours/week';
    const domains = Array.isArray(answers.target_domains) ? answers.target_domains.join(', ') : 'AI & Systems';
    const dealbreakers = answers.strict_must_nots?.suggestions || ['No mandatory live cohorts', 'No complex math'];

    return `## Strategic Career Roadmap: High-ROI Certifications (Demo Mode)

> **Notice:** Generated in Demo Mode based on your answers and Master Profile. Add your Gemini API Key in **API Config** to generate live model inference.

---

### Executive Summary & Alignment Analysis
Based on your Master Profile (INTJ systems thinker with a focus on asynchronous autonomy, deep blocks, and high leverage), you should avoid legacy technical debt certifications (e.g. rigid infrastructure or calculus-heavy engineering) and focus on **high-day-rate workflow and AI systems architecture**.

* **Target Milestone:** ${earnings}
* **Allocated Time:** ${hours}
* **Selected Domains:** ${domains}
* **Top Prioritized Filters:** ${dealbreakers.slice(0, 3).join(', ')}

---

### Top Recommended High-ROI Certifications

#### 1. Zapier & Make.com Automation Solutions Architect
* **Platform:** Zapier Certified Expert / Make Academy (Level 1-4)
* **Time & Cost:** 2-3 weeks (15-20 hours total) • Free / Under $50
* **Barrier Level:** Very Low (Pure logic flows, zero calculus or syntax debugging)
* **Earning Potential:** Freelance contract rates of **$95 - $150 / hour** auditing and building business automations.
* **Why It Fits You:** 100% self-paced, open-book practical testing, directly leverages your Notion and systems architecture skills.

#### 2. Notion Certified Consultant & Solutions Architect
* **Platform:** Notion Certified Academy
* **Time & Cost:** 3-4 weeks • Free Exam
* **Barrier Level:** Low-to-Medium (Requires demonstrable workspace build)
* **Earning Potential:** High retainer advisory ($3,000 - $7,500 per workspace rollout)
* **Why It Fits You:** Perfect fit for your existing database engineering strengths with zero synchronous video cohort requirements.

#### 3. AWS Certified Cloud Practitioner / AI Practitioner
* **Platform:** Amazon Web Services
* **Time & Cost:** 3 weeks (20 hours study) • $100 exam fee
* **Barrier Level:** Low (Foundational conceptual knowledge, multiple-choice online exam)
* **Earning Potential:** Unlocks enterprise consulting credibility and enterprise client budgets.
* **Why It Fits You:** 100% online from home, highly recognizable brand logo on resumes and proposals.

---

### Immediate Action Step for Today
1. Enroll in the free **Make.com Foundations & Zapier Expert** training modules.
2. Build 1 integrated workflow linking a Notion database to an email or webhook trigger as your portfolio artifact.`;
  }

  return `## Generated Deliverable: ${payload.workflowName} (Demo Mode)

> **Notice:** Generated in Demo Mode based on your responses. Set your Gemini API Key in **API Config** for full live inference.

### Core Strategic Synthesis
Your questionnaire responses have been cross-referenced with your Master Profile Vault. 

### Key Recommendations
1. **Leverage Asynchronous Autonomy**: Focus exclusively on asynchronous workflows that protect your uninterrupted deep blocks.
2. **Standardize Information Flow**: Consolidate scattered databases into a connected relational architecture.
3. **Target High-Margin Outcomes**: Prioritize outputs that provide immediate tangible proof of impact.`;
}

// Client-side Direct Gemini API Call (Direct from Browser to Google AI Studio)
async function callGeminiDirect(apiKey, model, systemPrompt, userContent) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const requestPayload = {
    contents: [{
      role: 'user',
      parts: [{ text: userContent }]
    }]
  };

  if (systemPrompt) {
    requestPayload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `Gemini API returned status ${res.status}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!text) {
    throw new Error('Gemini API returned an empty response. Try adjusting the prompt or model.');
  }
  return text;
}

// Client-side Direct Dynamic Questionnaire Generator
async function generateQuestionsDirect(apiKey, model, goal, numQuestions, masterContext) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemInstruction = `You are an expert diagnostic interviewer and requirements architect.
For the user's initiative: "${goal}", produce:
1. "title": A concise, clean, prettified title (3 to 6 words, e.g. "Micro-SaaS Discovery", "B2B Outreach Blueprint").
2. "questions": An array of ${numQuestions} structured clarifying questions.

Master background context available about user:
${masterContext || 'None provided'}

RULES:
1. Return ONLY a valid JSON object matching this schema (no markdown formatting, no backticks, no commentary):
{
  "title": "Clean Prettified Title",
  "questions": [
    {
      "id": "unique_id",
      "type": "select" | "multiselect" | "text" | "textarea" | "ranked" | "suggestions_with_custom",
      "label": "Question text",
      "helpText": "Explanation",
      "options": ["Opt 1", "Opt 2"],
      "suggestions": ["Sugg 1", "Sugg 2"],
      "placeholder": "Guidance"
    }
  ]
}`;

  const requestPayload = {
    contents: [{ role: 'user', parts: [{ text: `Generate diagnostic questionnaire for: ${goal}` }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || 'Question generation failed');
  }

  let raw = json.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '{}';
  raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return { title: goal.slice(0, 24) + '...', questions: parsed };
  }
  return {
    title: parsed.title || goal.slice(0, 24) + '...',
    questions: parsed.questions || []
  };
}

// Submit Questionnaire and Trigger Gemini Execution
async function submitQuestionnaire() {
  saveCurrentAnswer();
  const payload = buildPayload();

  // Switch to output view
  el.questionnaireView.classList.add('hidden');
  el.outputView.classList.remove('hidden');

  const activeKey = state.apiKey || localStorage.getItem('contextflow_api_key') || el.apiKeyInput.value.trim();

  el.outputTitle.textContent = `Generating with Gemini (${state.model})...`;
  el.outputSubtitle.textContent = `Synthesizing ${payload.prettifiedTitle || payload.workflowName} with your Master Context Vault`;
  el.outputStatusSpinner.classList.remove('hidden');
  el.outputContent.innerHTML = `<p class="placeholder-text">Connecting directly to Google AI Studio and processing your responses...</p>`;

  let responseText = '';

  try {
    if (activeKey) {
      // 1. DIRECT BROWSER CALL TO GOOGLE AI STUDIO (Bypasses local sandbox restrictions)
      console.log('Dispatching request directly to Gemini API from browser client...');
      responseText = await callGeminiDirect(activeKey, state.model, payload.systemPrompt, payload.prompt);
      el.outputTitle.textContent = `Deliverable Generated (${payload.prettifiedTitle || payload.workflowName})`;
      el.outputSubtitle.textContent = `Generated using ${state.model} live via Google AI Studio.`;
    } else {
      // 2. Try Server endpoint (which might use .env key)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Please enter your Gemini API Key in API Config');
      }
      responseText = data.text;
      el.outputTitle.textContent = `Deliverable Generated (${payload.prettifiedTitle || payload.workflowName})`;
      el.outputSubtitle.textContent = `Generated using ${payload.model} tailored to your profile.`;
    }

  } catch (err) {
    console.error('Gemini Execution Error:', err);
    el.outputStatusSpinner.classList.add('hidden');
    el.outputTitle.textContent = 'Gemini API Error';
    el.outputSubtitle.textContent = 'Could not generate deliverable with the provided key';

    el.outputContent.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 8px; padding: 1.25rem; color: #fca5a5; margin-bottom: 1.5rem;">
        <h4 style="color:#ef4444; font-weight:700; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          API Call Failed: ${escapeHtml(err.message)}
        </h4>
        <p style="font-size:0.85rem; color:#e2e8f0; margin-bottom:0.75rem;">
          Common fixes:
        </p>
        <ul style="font-size:0.85rem; color:#cbd5e1; padding-left:1.25rem; margin-bottom:1rem;">
          <li>Verify your API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color:#60a5fa; text-decoration:underline;">aistudio.google.com/app/apikey</a>.</li>
          <li>Make sure there are no accidental spaces before or after the key.</li>
          <li>Select <strong>Gemini 3.5 Flash Lite</strong> in API Config for the most reliable availability.</li>
        </ul>
        <button id="open-config-from-error" class="btn btn-primary text-xs">Open API Config</button>
      </div>

      <div style="opacity: 0.85;">
        <p class="text-xs text-muted mb-2">Showing offline preview based on your questionnaire responses:</p>
        ${renderMarkdownOutput(generateDemoDeliverable(payload))}
      </div>
    `;

    document.getElementById('open-config-from-error')?.addEventListener('click', () => {
      el.settingsModal.classList.remove('hidden');
    });

    return;
  } finally {
    el.outputStatusSpinner.classList.add('hidden');
  }

  // Build Answer Review HTML
  const reviewHtml = buildAnswerReviewAccordion(payload);

  // Auto-persist responses & deliverable to Notion if this is a Notion Question Set!
  let notionSyncCardHtml = '';
  const currentWf = state.workflows[payload.workflowId];
  if (currentWf && currentWf.isNotion && currentWf.notionSetId) {
    const roundKey = `round_${Date.now()}`;
    const answeredSummary = [];
    const responsesPayload = [];

    currentWf.questions.forEach(q => {
      const val = payload.answers[q.id];
      let selectedLabels = [];
      let textAns = null;
      let numAns = null;

      if (val && typeof val === 'object' && val.values) {
        selectedLabels = val.values;
      } else if (Array.isArray(val)) {
        selectedLabels = val;
      } else if (typeof val === 'string') {
        if (q.options && q.options.includes(val)) {
          selectedLabels = [val];
        } else {
          textAns = val;
        }
      } else if (typeof val === 'number') {
        numAns = val;
      }

      const selectedOptionIds = [];
      if (q.optionMap && Array.isArray(q.optionMap)) {
        selectedLabels.forEach(lbl => {
          const matched = q.optionMap.find(o => o.text.trim().toLowerCase() === lbl.trim().toLowerCase());
          if (matched) selectedOptionIds.push(matched.id);
        });
      }

      const displayAnswer = selectedLabels.length ? selectedLabels.join(', ') : (textAns || numAns || 'None');
      answeredSummary.push({ question: q.label, answer: displayAnswer });

      responsesPayload.push({
        questionId: q.id,
        questionTitle: q.label,
        selectedOptionIds: selectedOptionIds,
        selectedOptionLabels: selectedLabels,
        textAnswer: textAns,
        numberAnswer: numAns
      });
    });

    // Fire off async sync in parallel
    (async () => {
      try {
        await fetch('/api/notion/export-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundKey: roundKey,
            questionSetId: currentWf.notionSetId,
            responses: responsesPayload
          })
        });

        await fetch('/api/notion/append-deliverable-to-set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionSetId: currentWf.notionSetId,
            deliverable: responseText,
            roundKey: roundKey,
            answeredSummary: answeredSummary
          })
        });
        console.log('✓ Automatically persisted responses and deliverable into Notion Question Set!');
      } catch (e) {
        console.warn('Background Notion auto-persist error:', e);
      }
    })();

    currentWf.responseStatus = 'Fully Answered';
    renderWorkflowTabs();

    notionSyncCardHtml = `
      <div class="notion-sync-success-card" style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <div style="font-weight:700; color:#c4b5fd; display:flex; align-items:center; gap:0.5rem; font-size:0.95rem;">
            <span>❖</span> Persisted to Notion Question Set & Responses DB!
          </div>
          <div style="font-size:0.8rem; color:#cbd5e1; margin-top:0.25rem;">
            Responses recorded in <em>Responses | Draft Source</em> & deliverable appended directly into <strong>${escapeHtml(currentWf.name)}</strong> page body.
          </div>
        </div>
        ${currentWf.notionUrl ? `<a href="${currentWf.notionUrl}" target="_blank" rel="noopener" class="btn btn-secondary text-xs" style="border-color:#8b5cf6; color:#c4b5fd; text-decoration:none; white-space:nowrap;">Open Page in Notion ↗</a>` : ''}
      </div>
    `;
  }

  const deepDiveCardHtml = `
    <div class="deep-dive-card">
      <div class="deep-dive-header">
        <div class="deep-dive-icon">✨</div>
        <div>
          <div class="deep-dive-title">Expand Upon These Results With a Deep-Dive Quiz?</div>
          <div class="deep-dive-desc">
            Would you like Gemini to dynamically generate an additional questionnaire that expands upon your answers and drills down into the next layer of decisions?
          </div>
        </div>
      </div>
      <div class="deep-dive-footer">
        <button id="create-deep-dive-btn" class="btn btn-sparkle">
          <span id="deep-dive-spinner" class="spinner-sm hidden"></span>
          ✨ Generate Follow-Up Deep-Dive Quiz &rarr;
        </button>
      </div>
    </div>
  `;

  // Render combined view
  el.outputContent.innerHTML = `
    ${notionSyncCardHtml}
    ${reviewHtml}
    <div class="deliverable-text">
      ${renderMarkdownOutput(responseText)}
    </div>
    ${deepDiveCardHtml}
  `;

  // Save to history
  currentSessionRecord = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    workflowId: payload.workflowId,
    workflowName: payload.workflowName,
    prettifiedTitle: payload.prettifiedTitle || payload.workflowName,
    originalPrompt: payload.originalPrompt || null,
    answers: payload.answers,
    output: responseText
  };

  state.history.unshift(currentSessionRecord);
  if (state.history.length > 20) state.history.pop();
  localStorage.setItem('contextflow_history', JSON.stringify(state.history));
  updateHistoryUI();
  setupDeepDiveListener(payload, responseText);
}

// Setup Deep-Dive Quiz Expansion Button
function setupDeepDiveListener(parentPayload, deliverableText) {
  const deepDiveBtn = document.getElementById('create-deep-dive-btn');
  if (!deepDiveBtn) return;

  deepDiveBtn.addEventListener('click', async () => {
    deepDiveBtn.disabled = true;
    const spinner = document.getElementById('deep-dive-spinner');
    if (spinner) spinner.classList.remove('hidden');

    try {
      const activeKey = state.apiKey || localStorage.getItem('contextflow_api_key') || el.apiKeyInput.value.trim();
      const parentTitle = parentPayload.prettifiedTitle || parentPayload.workflowName;
      const goal = `Deep Dive Follow-Up for ${parentTitle}. User answers: ${JSON.stringify(parentPayload.answers)}. Deliverable summary: ${deliverableText.slice(0, 1000)}`;
      const masterContext = `${state.vault.skills_and_work}\n${state.vault.limits_and_health}\n${state.vault.custom_doc}`;

      const genResult = await generateQuestionsDirect(
        activeKey,
        state.model,
        goal,
        5,
        masterContext
      );

      const parentWf = state.workflows[parentPayload.workflowId];
      const deepDiveTitle = `Deep Dive: ${parentTitle.replace(/\|.*/, '').slice(0, 20)}`;

      await persistAndLaunchNotionQuestionSet({
        title: deepDiveTitle,
        description: `Follow-up diagnostic drilling into recommendations from ${parentTitle}`,
        category: parentWf?.badge || 'Personalized Workflows',
        questions: genResult.questions,
        parentSetId: parentWf?.notionSetId || null,
        parentSetTitle: parentTitle,
        originalPrompt: `Deep Dive Expansion on: ${parentTitle}`
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      alert(`Could not generate deep dive quiz: ${err.message}`);
    } finally {
      deepDiveBtn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
    }
  });
}

// Build Answer Review Accordion HTML
function buildAnswerReviewAccordion(payload) {
  const wf = state.workflows[payload.workflowId];
  if (!wf) return '';

  let provenanceHtml = '';
  if (wf.originalPrompt || payload.originalPrompt) {
    const rawPrompt = wf.originalPrompt || payload.originalPrompt;
    provenanceHtml = `
      <div class="prompt-provenance-box">
        <div class="provenance-label">Original Directive / Initial Goal</div>
        <div class="provenance-text">"${escapeHtml(rawPrompt)}"</div>
      </div>
    `;
  }

  let itemsHtml = '';
  wf.questions.forEach((q, idx) => {
    const val = payload.answers[q.id];
    let displayVal = '<em>Not answered</em>';

    if (val && typeof val === 'object' && val.mode) {
      if (val.mode === 'ranked') {
        displayVal = val.values && val.values.length
          ? val.values.map((item, i) => `<strong>#${i + 1}</strong>: ${escapeHtml(item)}`).join(' &nbsp;•&nbsp; ')
          : '<em>None ranked</em>';
      } else {
        displayVal = val.values && val.values.length
          ? val.values.map(v => `<span class="badge" style="margin:2px;">${escapeHtml(v)}</span>`).join(' ')
          : '<em>None selected</em>';
      }
    } else if (q.type === 'ranked' && Array.isArray(val)) {
      if (val.length === 0) {
        displayVal = 'None ranked';
      } else {
        displayVal = val.map((item, i) => `<strong>#${i + 1}</strong>: ${escapeHtml(item)}`).join(' &nbsp;•&nbsp; ');
      }
    } else if (q.type === 'suggestions_with_custom' && val) {
      const suggList = val.suggestions && val.suggestions.length
        ? val.suggestions.map(s => `<span class="badge" style="margin:2px;">${escapeHtml(s)}</span>`).join(' ')
        : '<em>None selected</em>';
      const customStr = val.custom ? `<div style="margin-top:4px;"><strong>Custom:</strong> ${escapeHtml(val.custom)}</div>` : '';
      displayVal = `${suggList}${customStr}`;
    } else if (Array.isArray(val)) {
      displayVal = val.map(v => `<span class="badge" style="margin:2px;">${escapeHtml(v)}</span>`).join(' ');
    } else if (val) {
      displayVal = escapeHtml(val);
    }

    itemsHtml += `
      <div class="answer-item">
        <div class="answer-q">Q${idx + 1}: ${escapeHtml(q.label)}</div>
        <div class="answer-a">${displayVal}</div>
      </div>
    `;
  });

  return `
    ${provenanceHtml}
    <div class="answers-review-panel">
      <div class="answers-review-header" id="toggle-answers-btn">
        <div class="answers-review-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Review Your Questionnaire Answers & Parameters
        </div>
        <span class="text-xs text-muted">Click to Expand/Collapse</span>
      </div>
      <div class="answers-review-body" id="answers-review-body">
        ${itemsHtml}
      </div>
    </div>
  `;
}

// Basic markdown to HTML renderer
function renderMarkdownOutput(md) {
  if (!md) return '<p class="placeholder-text">No content returned.</p>';

  let html = escapeHtml(md);

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid #3b82f6; padding-left: 1rem; color: #94a3b8; margin: 0.75rem 0;">$1</blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Bullet points
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  return html;
}

// Utility: HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export deliverable to Markdown file
function downloadMarkdownFile() {
  if (!currentSessionRecord) return;

  const wf = state.workflows[currentSessionRecord.workflowId];
  const title = currentSessionRecord.prettifiedTitle || currentSessionRecord.workflowName;
  const originalPrompt = currentSessionRecord.originalPrompt || (wf && wf.originalPrompt);

  let mdContent = `# ${title}\n\n`;
  if (originalPrompt) {
    mdContent += `> **Original Prompt / Directive:** "${originalPrompt}"\n\n`;
  }
  mdContent += `*Generated: ${currentSessionRecord.date}*\n\n`;

  mdContent += `## 📋 Questionnaire Answers\n\n`;
  if (wf) {
    wf.questions.forEach((q, idx) => {
      const val = currentSessionRecord.answers[q.id];
      let valText = 'Not answered';
      if (val && typeof val === 'object' && val.mode) {
        if (val.mode === 'ranked') {
          valText = val.values && val.values.length
            ? val.values.map((v, i) => `${i + 1}. ${v}`).join(', ')
            : 'None ranked';
        } else {
          valText = val.values && val.values.length ? val.values.join(', ') : 'None selected';
        }
      } else if (q.type === 'ranked' && Array.isArray(val)) {
        valText = val.map((v, i) => `${i + 1}. ${v}`).join(', ');
      } else if (q.type === 'suggestions_with_custom' && val) {
        valText = `Filters: ${val.suggestions ? val.suggestions.join(', ') : 'None'}; Notes: ${val.custom || 'None'}`;
      } else if (Array.isArray(val)) {
        valText = val.join(', ');
      } else if (val) {
        valText = val;
      }
      mdContent += `**Q${idx + 1}: ${q.label}**\n${valText}\n\n`;
    });
  }

  mdContent += `## 💡 Deliverable\n\n${currentSessionRecord.output}\n`;

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanFilename = (title || 'deliverable').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  a.download = `${cleanFilename}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// NOTION GROUNDING ARTIFACTS & MASTER VAULT BLOCKS
// ==========================================

async function loadVaultBlocks(tab = 'Working Style & Skills') {
  try {
    state.activeVaultTab = tab;
    const res = await fetch(`/api/notion/vault-blocks?tab=${encodeURIComponent(tab)}`);
    if (res.ok) {
      const data = await res.json();
      state.vaultBlocks = data.blocks || [];
      renderVaultBlocks();
      syncBlocksToText();
    }
  } catch (err) {
    console.warn('Could not load Notion vault blocks:', err);
  }
}

function syncBlocksToText() {
  if (!state.vaultBlocks.length) return;
  const groups = {};
  state.vaultBlocks.forEach(b => {
    const grp = b.headingGroup || 'General';
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(b.text);
  });

  let fullText = '';
  for (const [grpTitle, list] of Object.entries(groups)) {
    fullText += `### ${grpTitle}\n`;
    list.forEach(item => {
      fullText += `- ${item}\n`;
    });
    fullText += '\n';
  }

  if (el.vaultSkills && state.activeVaultTab === 'Working Style & Skills') {
    el.vaultSkills.value = fullText.trim();
    state.vault.skills_and_work = fullText.trim();
  }
}

function renderVaultBlocks() {
  if (!el.vaultBlocksOrganizer) return;
  el.vaultBlocksOrganizer.innerHTML = '';

  let filtered = [...state.vaultBlocks];
  if (state.vaultBlocksFilter === 'pinned') {
    filtered = filtered.filter(b => b.isPinned);
  } else if (state.vaultBlocksFilter === 'edited') {
    filtered = filtered.filter(b => b.status === 'Edited');
  } else if (state.vaultBlocksFilter === 'new') {
    filtered = filtered.filter(b => b.status === 'New');
  }

  const groups = {};
  filtered.forEach(b => {
    const grp = b.headingGroup || 'General';
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(b);
  });

  if (Object.keys(groups).length === 0) {
    if (state.vaultBlocks.length === 0) {
      el.vaultBlocksOrganizer.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: #94a3b8; background: rgba(15, 23, 42, 0.4); border-radius: 8px; border: 1px dashed rgba(148, 163, 184, 0.2);">
          <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">❖ Master Profile & Context Vault</div>
          <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 1rem auto; line-height: 1.5;">
            No context blocks loaded yet. Click <strong>"Select Notion Pages & Artifacts"</strong> above to extract structured context blocks from your Notion pages, or add section headers manually.
          </p>
          <button id="empty-add-section-btn" class="btn btn-secondary text-xs">+ Add First Section Header</button>
        </div>
      `;
      document.getElementById('empty-add-section-btn')?.addEventListener('click', addNewSectionHeader);
      return;
    } else {
      el.vaultBlocksOrganizer.innerHTML = `<p class="placeholder-text" style="padding: 1rem;">No blocks match the filter "${state.vaultBlocksFilter}".</p>`;
      return;
    }
  }

  for (const [groupName, blocksList] of Object.entries(groups)) {
    const groupEl = document.createElement('div');
    groupEl.className = 'vault-heading-group';
    groupEl.dataset.groupName = groupName;

    const headerEl = document.createElement('div');
    headerEl.className = 'vault-group-header';
    headerEl.innerHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.25rem;">
        <input type="text" class="vault-group-title-input" value="${escapeHtml(groupName)}" title="Click to rename section">
        <input type="text" class="vault-group-desc-input" placeholder="Optional description of what blocks belong here..." value="${escapeHtml(state.vaultHeadingGroups[groupName] || '')}">
      </div>
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <span class="badge" style="font-size: 0.65rem;">${blocksList.length} blocks</span>
      </div>
    `;

    const titleInput = headerEl.querySelector('.vault-group-title-input');
    titleInput.addEventListener('change', async (e) => {
      const newName = e.target.value.trim();
      if (!newName || newName === groupName) return;
      for (const b of blocksList) {
        b.headingGroup = newName;
        fetch('/api/notion/update-vault-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: b.id, action: 'move_group', updates: { headingGroup: newName } })
        }).catch(err => console.warn(err));
      }
      renderVaultBlocks();
      syncBlocksToText();
    });

    const descInput = headerEl.querySelector('.vault-group-desc-input');
    descInput.addEventListener('change', (e) => {
      state.vaultHeadingGroups[groupName] = e.target.value.trim();
    });

    groupEl.appendChild(headerEl);

    const listEl = document.createElement('div');
    listEl.className = 'vault-group-blocks-list';

    groupEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      groupEl.classList.add('drag-over');
    });

    groupEl.addEventListener('dragleave', (e) => {
      if (!groupEl.contains(e.relatedTarget)) {
        groupEl.classList.remove('drag-over');
      }
    });

    groupEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      groupEl.classList.remove('drag-over');
      const blockId = state.draggedBlockId || e.dataTransfer.getData('text/plain');
      if (!blockId) return;

      const targetBlock = state.vaultBlocks.find(b => b.id === blockId);
      if (targetBlock && targetBlock.headingGroup !== groupName) {
        targetBlock.headingGroup = groupName;
        renderVaultBlocks();
        syncBlocksToText();

        fetch('/api/notion/update-vault-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: targetBlock.id,
            action: 'move_group',
            updates: { headingGroup: groupName }
          })
        }).catch(err => console.warn(err));
      }
    });

    blocksList.forEach(block => {
      const card = document.createElement('div');
      card.className = `vault-block-card ${block.isPinned ? 'pinned' : ''} ${block.status === 'Edited' ? 'edited' : ''}`;
      card.draggable = true;
      card.dataset.blockId = block.id;

      let statusBadge = '';
      if (block.isPinned) {
        statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.62rem; padding: 1px 5px;">📌 Pinned</span>`;
      } else if (block.status === 'Edited') {
        statusBadge = `<span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.4); font-size: 0.62rem; padding: 1px 5px;" title="Original: ${escapeHtml(block.originalText || '')}">✏️ Edited</span>`;
      }

      card.innerHTML = `
        <div class="vault-block-left">
          <span class="vault-block-drag-handle" title="Drag to reorder or move between groups">⋮⋮</span>
          <span class="vault-block-text">${escapeHtml(block.text)}</span>
        </div>
        <div class="vault-block-actions">
          ${statusBadge}
          <button type="button" class="vault-action-btn btn-pin ${block.isPinned ? 'is-pinned' : ''}" title="${block.isPinned ? 'Unpin block' : 'Pin block (Protected from being overwritten)'}">
            ${block.isPinned ? '📌' : '📍'}
          </button>
          <button type="button" class="vault-action-btn btn-edit" title="Edit block">✏️</button>
          <button type="button" class="vault-action-btn btn-delete" title="Delete block (Archived in Notion)">🗑️</button>
        </div>
      `;

      card.addEventListener('dragstart', (e) => {
        state.draggedBlockId = block.id;
        e.dataTransfer.setData('text/plain', block.id);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        state.draggedBlockId = null;
      });

      card.querySelector('.btn-pin').addEventListener('click', async (e) => {
        e.stopPropagation();
        const willPin = !block.isPinned;
        block.isPinned = willPin;
        block.status = willPin ? 'Pinned' : 'New';
        renderVaultBlocks();
        syncBlocksToText();

        fetch('/api/notion/update-vault-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: block.id,
            action: willPin ? 'pin' : 'unpin'
          })
        }).catch(err => console.warn(err));
      });

      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        const origText = block.text;

        card.innerHTML = `
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.35rem; width: 100%;">
            <textarea class="form-textarea text-xs" rows="2" style="width: 100%;">${escapeHtml(origText)}</textarea>
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-ghost text-xs cancel-edit-btn">Cancel</button>
              <button class="btn btn-primary text-xs save-edit-btn">Save Revision</button>
            </div>
          </div>
        `;

        const textarea = card.querySelector('textarea');
        textarea.focus();

        card.querySelector('.cancel-edit-btn').addEventListener('click', (ev) => {
          ev.stopPropagation();
          renderVaultBlocks();
        });

        card.querySelector('.save-edit-btn').addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const newText = textarea.value.trim();
          if (!newText || newText === origText) {
            renderVaultBlocks();
            return;
          }

          block.originalText = origText;
          block.text = newText;
          block.status = 'Edited';
          renderVaultBlocks();
          syncBlocksToText();

          try {
            const res = await fetch('/api/notion/update-vault-block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pageId: block.id,
                action: 'edit',
                updates: {
                  text: newText,
                  originalText: origText,
                  parentTab: block.parentTab || state.activeVaultTab,
                  headingGroup: block.headingGroup,
                  isPinned: block.isPinned
                }
              })
            });
            const d = await res.json();
            if (d.newBlockId) block.id = d.newBlockId;
          } catch (err) {
            console.warn('Error updating block in Notion:', err);
          }
        });
      });

      card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Archive block "${block.text.slice(0, 40)}..." in Notion?`)) {
          state.vaultBlocks = state.vaultBlocks.filter(b => b.id !== block.id);
          renderVaultBlocks();
          syncBlocksToText();

          fetch('/api/notion/update-vault-block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId: block.id, action: 'delete' })
          }).catch(err => console.warn(err));
        }
      });

      listEl.appendChild(card);
    });

    groupEl.appendChild(listEl);

    const addRow = document.createElement('div');
    addRow.className = 'add-block-btn-row';
    addRow.innerHTML = `
      <button type="button" class="btn btn-ghost text-xs" style="color: #a78bfa; padding: 2px 6px;">
        + Add Block to "${escapeHtml(groupName)}"
      </button>
    `;
    addRow.querySelector('button').addEventListener('click', () => {
      addNewBlockToGroup(groupName);
    });
    groupEl.appendChild(addRow);

    el.vaultBlocksOrganizer.appendChild(groupEl);
  }
}

function addNewSectionHeader() {
  const name = prompt('Enter new section header title (e.g. "Core Skills", "Cognitive Architecture", "Operational Boundaries"):');
  if (!name || !name.trim()) return;
  const cleanName = name.trim();

  const tempId = `CTX-${Date.now()}`;
  const newBlock = {
    id: tempId,
    blockId: tempId,
    text: `Initialized section: ${cleanName}`,
    parentTab: state.activeVaultTab,
    headingGroup: cleanName,
    status: 'New',
    isPinned: false,
    dateGenerated: new Date().toISOString().split('T')[0]
  };

  state.vaultBlocks.push(newBlock);
  renderVaultBlocks();
  syncBlocksToText();
}

function addNewBlockToGroup(groupName) {
  const text = prompt(`Enter new context bullet for "${groupName}":`);
  if (!text || !text.trim()) return;

  const tempId = `CTX-${Date.now()}`;
  const newBlock = {
    id: tempId,
    blockId: tempId,
    text: text.trim(),
    parentTab: state.activeVaultTab,
    headingGroup: groupName,
    status: 'New',
    isPinned: false,
    dateGenerated: new Date().toISOString().split('T')[0]
  };

  state.vaultBlocks.push(newBlock);
  renderVaultBlocks();
  syncBlocksToText();

  fetch('/api/notion/generate-vault-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedSources: [{ id: 'manual', title: 'Manual Entry', object: 'page' }],
      parentTab: state.activeVaultTab,
      existingBlocks: [newBlock]
    })
  }).catch(err => console.warn(err));
}

async function searchNotionWorkspace(query) {
  if (!el.notionSearchResults) return;
  el.notionSearchResults.classList.remove('hidden');
  el.notionSearchResults.innerHTML = '<div style="padding: 10px; font-size: 0.75rem; color: #94a3b8;"><span class="spinner-sm"></span> Searching Notion workspace...</div>';

  try {
    const res = await fetch('/api/notion/search-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query || '' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');

    renderSearchResults(data.results || []);
  } catch (err) {
    el.notionSearchResults.innerHTML = `<div style="padding: 10px; font-size: 0.75rem; color: #ef4444;">Error: ${err.message}</div>`;
  }
}

function renderSearchResults(results) {
  if (!el.notionSearchResults) return;
  if (!results.length) {
    el.notionSearchResults.innerHTML = '<div style="padding: 10px; font-size: 0.75rem; color: #94a3b8;">No matching Notion pages or databases found.</div>';
    return;
  }

  el.notionSearchResults.innerHTML = '';
  results.forEach(item => {
    const isSelected = state.selectedNotionSources.some(s => s.id === item.id);
    const div = document.createElement('div');
    div.className = `notion-search-item ${isSelected ? 'selected' : ''}`;
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
        <span>${item.icon || (item.object === 'database' ? '🗄️' : '📄')}</span>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${escapeHtml(item.title)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
        <span class="badge" style="font-size: 0.6rem; text-transform: uppercase;">${item.object}</span>
        <span style="font-size: 0.75rem; color: ${isSelected ? '#a78bfa' : '#64748b'};">${isSelected ? '✓' : '+'}</span>
      </div>
    `;

    div.addEventListener('click', () => {
      const idx = state.selectedNotionSources.findIndex(s => s.id === item.id);
      if (idx !== -1) {
        state.selectedNotionSources.splice(idx, 1);
      } else {
        state.selectedNotionSources.push({
          id: item.id,
          title: item.title,
          object: item.object
        });
      }
      renderSelectedSources();
      renderSearchResults(results);
    });

    el.notionSearchResults.appendChild(div);
  });
}

function renderSelectedSources() {
  if (!el.selectedSourcesChips) return;
  el.selectedSourcesChips.innerHTML = '';

  if (el.selectedSourcesCount) {
    el.selectedSourcesCount.textContent = state.selectedNotionSources.length;
  }

  if (el.generateVaultBlocksBtn) {
    el.generateVaultBlocksBtn.disabled = state.selectedNotionSources.length === 0;
  }

  if (!state.selectedNotionSources.length) {
    el.selectedSourcesChips.innerHTML = '<span class="text-xs text-muted" id="no-sources-selected-text">No sources selected yet. Search above to pick pages or databases.</span>';
    return;
  }

  state.selectedNotionSources.forEach(src => {
    const chip = document.createElement('span');
    chip.className = 'source-chip';
    chip.innerHTML = `
      <span>${src.object === 'database' ? '🗄️' : '📄'}</span>
      <span>${escapeHtml(src.title)}</span>
      <button type="button" class="remove-chip-btn">&times;</button>
    `;
    chip.querySelector('.remove-chip-btn').addEventListener('click', () => {
      state.selectedNotionSources = state.selectedNotionSources.filter(s => s.id !== src.id);
      renderSelectedSources();
    });
    el.selectedSourcesChips.appendChild(chip);
  });
}

// Event Listeners
function setupEventListeners() {
  el.nextBtn.addEventListener('click', handleNext);
  el.prevBtn.addEventListener('click', handlePrev);

  // Grouped Categories Hub Toggle
  if (el.toggleGroupedHubBtn) {
    el.toggleGroupedHubBtn.addEventListener('click', () => {
      if (el.groupedSetsHub) {
        el.groupedSetsHub.classList.toggle('hidden');
        renderGroupedSetsHub();
      }
    });
  }

  if (el.closeGroupedHubBtn) {
    el.closeGroupedHubBtn.addEventListener('click', () => {
      if (el.groupedSetsHub) {
        el.groupedSetsHub.classList.add('hidden');
      }
    });
  }

  // Add Similar Question into active Notion Question Set
  if (el.addSimilarQuestionBtn) {
    el.addSimilarQuestionBtn.addEventListener('click', async () => {
      const wf = getCurrentWorkflow();
      if (!wf || !wf.notionSetId) {
        alert('This feature dynamically adds questions into Notion Question Sets.');
        return;
      }

      const currentQ = getCurrentQuestion();
      const origHtml = el.addSimilarQuestionBtn.innerHTML;
      el.addSimilarQuestionBtn.innerHTML = `<span class="spinner-sm"></span> Syncing to Notion...`;
      el.addSimilarQuestionBtn.disabled = true;

      try {
        const activeKey = state.apiKey || localStorage.getItem('contextflow_api_key') || el.apiKeyInput.value.trim();
        const res = await fetch('/api/notion/add-similar-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionSetId: wf.notionSetId,
            currentQuestion: {
              label: currentQ.label,
              type: currentQ.type,
              options: currentQ.options || []
            },
            theme: wf.name,
            apiKey: activeKey
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to add similar question to Notion');
        }

        const newQ = data.question;
        // Insert right after current question!
        wf.questions.splice(state.currentIndex + 1, 0, newQ);

        // Update step counter & progress
        el.stepCounter.textContent = `Question ${state.currentIndex + 1} of ${wf.questions.length}`;
        const progressPercent = ((state.currentIndex + 1) / wf.questions.length) * 100;
        el.progressBarFill.style.width = `${progressPercent}%`;

        el.addSimilarQuestionBtn.innerHTML = `✓ Queued as Q${state.currentIndex + 2}!`;
        setTimeout(() => {
          el.addSimilarQuestionBtn.innerHTML = origHtml;
          el.addSimilarQuestionBtn.disabled = false;
        }, 2500);

      } catch (err) {
        alert(`Error adding question: ${err.message}`);
        el.addSimilarQuestionBtn.innerHTML = origHtml;
        el.addSimilarQuestionBtn.disabled = false;
      }
    });
  }

  // Generate Notion AI Hints & Fit Scores
  if (el.generateHintsBtn) {
    el.generateHintsBtn.addEventListener('click', async () => {
      const wf = getCurrentWorkflow();
      const q = getCurrentQuestion();
      if (!q || !q.options || q.options.length === 0) {
        alert('This question has no choice options to generate hints for.');
        return;
      }

      const origHtml = el.generateHintsBtn.innerHTML;
      el.generateHintsBtn.innerHTML = `<span class="spinner-sm"></span> Analyzing Notion DB & Profile...`;
      el.generateHintsBtn.disabled = true;

      try {
        const activeKey = state.apiKey || localStorage.getItem('contextflow_api_key') || el.apiKeyInput?.value.trim();
        const optionsPayload = (q.optionMap && q.optionMap.length > 0)
          ? q.optionMap.map(o => ({ id: o.id, text: o.text }))
          : q.options.map((t, idx) => ({ id: `temp_${idx}`, text: t }));

        const res = await fetch('/api/notion/generate-option-hints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: q.id,
            questionTitle: q.label,
            questionSetTitle: wf.fullName || wf.name,
            questionSetId: wf.notionSetId || null,
            options: optionsPayload,
            apiKey: activeKey
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate hints');
        }

        if (data.questionContext) {
          q.contextHints = data.questionContext;
        }

        if (data.options && Array.isArray(data.options)) {
          if (!q.optionMap) q.optionMap = [];
          data.options.forEach(item => {
            let matched = q.optionMap.find(o => o.text.trim().toLowerCase() === item.text.trim().toLowerCase());
            if (!matched && item.id) {
              matched = q.optionMap.find(o => o.id === item.id);
            }
            if (matched) {
              matched.explanation = item.definition;
              matched.examples = item.guidingExample;
              matched.workspaceEvidence = item.workspaceEvidence;
              matched.confidenceScore = item.confidenceScore;
            } else {
              q.optionMap.push({
                id: item.id,
                text: item.text,
                explanation: item.definition,
                examples: item.guidingExample,
                workspaceEvidence: item.workspaceEvidence,
                confidenceScore: item.confidenceScore
              });
            }
          });
        }

        renderCurrentQuestion();

        el.generateHintsBtn.innerHTML = `✓ Synced Hints to Notion!`;
        setTimeout(() => {
          el.generateHintsBtn.innerHTML = origHtml;
          el.generateHintsBtn.disabled = false;
        }, 3000);

      } catch (err) {
        alert(`Error generating hints: ${err.message}`);
        el.generateHintsBtn.innerHTML = origHtml;
        el.generateHintsBtn.disabled = false;
      }
    });
  }

  // Return to edit answers
  el.restartBtn.addEventListener('click', () => {
    el.outputView.classList.add('hidden');
    el.questionnaireView.classList.remove('hidden');
    renderCurrentQuestion();
  });

  // Copy output with Prettified Quiz Name + Original Prompt
  el.copyOutputBtn.addEventListener('click', async () => {
    let textToCopy = '';
    const title = currentSessionRecord?.prettifiedTitle || currentSessionRecord?.workflowName || el.outputTitle.innerText;
    const originalPrompt = currentSessionRecord?.originalPrompt || (state.workflows[currentSessionRecord?.workflowId]?.originalPrompt);

    if (title) {
      textToCopy += `# ${title}\n\n`;
    }
    if (originalPrompt) {
      textToCopy += `> **Original Prompt / Directive:** "${originalPrompt}"\n\n`;
    }
    textToCopy += el.outputContent.innerText;

    await navigator.clipboard.writeText(textToCopy);
    const orig = el.copyOutputBtn.innerHTML;
    el.copyOutputBtn.innerHTML = `✓ Copied with Title & Directive!`;
    setTimeout(() => { el.copyOutputBtn.innerHTML = orig; }, 2500);
  });

  // Download Output .md
  el.downloadOutputBtn.addEventListener('click', downloadMarkdownFile);

  // Push to Notion Database
  el.pushNotionBtn.addEventListener('click', async () => {
    if (!currentSessionRecord) return;

    const token = state.notionToken || el.notionTokenInput.value.trim();
    const dbId = state.notionDatabaseId || el.notionDatabaseIdInput.value.trim();

    if (!token && !state.hasNotionToken) {
      alert('Please configure your Notion Integration Token in API Config (or set NOTION_TOKEN in .env).');
      el.settingsModal.classList.remove('hidden');
      return;
    }

    if (!dbId) {
      alert('Please provide your target Notion Database ID in API Config (or set NOTION_DATABASE_ID in .env).');
      el.settingsModal.classList.remove('hidden');
      return;
    }

    const origHtml = el.pushNotionBtn.innerHTML;
    el.pushNotionBtn.innerHTML = `<span class="spinner-sm"></span> Pushing...`;
    el.pushNotionBtn.disabled = true;

    try {
      const title = currentSessionRecord.prettifiedTitle || currentSessionRecord.workflowName;
      const originalPrompt = currentSessionRecord.originalPrompt || (state.workflows[currentSessionRecord.workflowId]?.originalPrompt);

      let fullContent = '';
      if (originalPrompt) {
        fullContent += `> Original Directive: "${originalPrompt}"\n\n`;
      }
      fullContent += currentSessionRecord.output;

      const res = await fetch('/api/notion/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notionToken: token,
          databaseId: dbId,
          title: `${title} (${currentSessionRecord.date})`,
          content: fullContent,
          workflowName: title
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to export to Notion');
      }

      el.pushNotionBtn.innerHTML = `✓ Pushed to Notion!`;
      if (data.pageUrl) {
        window.open(data.pageUrl, '_blank');
      }
      setTimeout(() => {
        el.pushNotionBtn.innerHTML = origHtml;
        el.pushNotionBtn.disabled = false;
      }, 3500);

    } catch (err) {
      alert(`Notion Export Error: ${err.message}\nMake sure your Notion integration has been invited/connected to your database (Click '•••' > 'Connect to' in Notion).`);
      el.pushNotionBtn.innerHTML = origHtml;
      el.pushNotionBtn.disabled = false;
    }
  });

  // Export structured answers directly to Notion Responses Database (Draft Source)
  if (el.exportNotionResponsesBtn) {
    el.exportNotionResponsesBtn.addEventListener('click', async () => {
      if (!currentSessionRecord) return;
      const wf = state.workflows[currentSessionRecord.workflowId];
      if (!wf) return;

      const origHtml = el.exportNotionResponsesBtn.innerHTML;
      el.exportNotionResponsesBtn.innerHTML = `<span class="spinner-sm"></span> Exporting to Notion DB...`;
      el.exportNotionResponsesBtn.disabled = true;

      try {
        const responsesPayload = [];
        const roundKey = `round_${Date.now()}`;

        wf.questions.forEach(q => {
          const val = currentSessionRecord.answers[q.id];
          let selectedLabels = [];
          let textAns = null;
          let numAns = null;

          if (val && typeof val === 'object' && val.values) {
            selectedLabels = val.values;
          } else if (Array.isArray(val)) {
            selectedLabels = val;
          } else if (typeof val === 'string') {
            if (q.options && q.options.includes(val)) {
              selectedLabels = [val];
            } else {
              textAns = val;
            }
          } else if (typeof val === 'number') {
            numAns = val;
          }

          // Match option IDs from optionMap
          const selectedOptionIds = [];
          if (q.optionMap && Array.isArray(q.optionMap)) {
            selectedLabels.forEach(lbl => {
              const matched = q.optionMap.find(o => o.text.trim().toLowerCase() === lbl.trim().toLowerCase());
              if (matched) selectedOptionIds.push(matched.id);
            });
          }

          responsesPayload.push({
            questionId: q.id,
            questionTitle: q.label,
            selectedOptionIds: selectedOptionIds,
            selectedOptionLabels: selectedLabels,
            textAnswer: textAns,
            numberAnswer: numAns
          });
        });

        const res = await fetch('/api/notion/export-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundKey: roundKey,
            questionSetId: wf.notionSetId || null,
            responses: responsesPayload
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to export responses to Notion');
        }

        el.exportNotionResponsesBtn.innerHTML = `✓ Exported ${data.createdCount} Responses to Notion DB!`;
        setTimeout(() => {
          el.exportNotionResponsesBtn.innerHTML = origHtml;
          el.exportNotionResponsesBtn.disabled = false;
        }, 4000);

      } catch (err) {
        alert(`Notion Database Export Error: ${err.message}`);
        el.exportNotionResponsesBtn.innerHTML = origHtml;
        el.exportNotionResponsesBtn.disabled = false;
      }
    });
  }

  // Toggle Accordion in Output view
  document.addEventListener('click', (e) => {
    if (e.target.closest('#toggle-answers-btn')) {
      const body = document.getElementById('answers-review-body');
      if (body) {
        body.classList.toggle('hidden');
      }
    }
  });

  // History Modal
  el.historyBtn.addEventListener('click', () => {
    renderHistoryModal();
    el.historyModal.classList.remove('hidden');
  });

  el.closeHistoryModal.addEventListener('click', () => {
    el.historyModal.classList.add('hidden');
  });

  el.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all past session history?')) {
      state.history = [];
      localStorage.removeItem('contextflow_history');
      updateHistoryUI();
      renderHistoryModal();
    }
  });

  // Custom AI Generator Modal
  el.customGeneratorBtn.addEventListener('click', () => {
    el.generatorModal.classList.remove('hidden');
  });

  el.closeGeneratorModal.addEventListener('click', () => {
    el.generatorModal.classList.add('hidden');
  });

// Pre-persist new Question Set and its Questions & Options into Notion before starting
async function persistAndLaunchNotionQuestionSet({ title, description, category, questions, parentSetId, parentSetTitle, originalPrompt }) {
  if (el.notionSyncOverlay) {
    el.notionSyncOverlay.classList.remove('hidden');
    if (el.syncOverlayTitle) el.syncOverlayTitle.textContent = `Persisting "${title}" to Notion...`;
    if (el.syncOverlayDesc) el.syncOverlayDesc.textContent = 'Creating relational database pages & options before questionnaire begins';
  }

  const step1 = document.getElementById('sync-step-1');
  const step2 = document.getElementById('sync-step-2');
  const step3 = document.getElementById('sync-step-3');
  const step4 = document.getElementById('sync-step-4');

  function updateSteps(activeStep) {
    [step1, step2, step3, step4].forEach((s, idx) => {
      if (!s) return;
      const num = idx + 1;
      const badge = s.querySelector('.sync-step-badge');
      if (num < activeStep) {
        s.style.color = '#38bdf8';
        if (badge) { badge.style.background = '#10b981'; badge.textContent = '✓'; }
      } else if (num === activeStep) {
        s.style.color = '#f1f5f9';
        if (badge) { badge.style.background = '#3b82f6'; badge.textContent = String(num); }
      } else {
        s.style.color = '#64748b';
        if (badge) { badge.style.background = '#334155'; badge.textContent = String(num); }
      }
    });
  }

  updateSteps(2);

  let secondsLeft = Math.max(5, Math.ceil((questions || []).length * 1.5));
  if (el.syncCountdownTimer) el.syncCountdownTimer.textContent = `~${secondsLeft}s`;
  const timerInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft >= 0 && el.syncCountdownTimer) {
      el.syncCountdownTimer.textContent = `~${secondsLeft}s`;
    }
  }, 1000);

  try {
    updateSteps(3);

    const res = await fetch('/api/notion/create-question-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        description: description,
        category: category || 'Personalized Workflows',
        parentSetId: parentSetId || null,
        parentSetTitle: parentSetTitle || null,
        questions: questions
      })
    });

    updateSteps(4);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create question set in Notion');
    }

    const workflow = data.workflow;
    if (originalPrompt) {
      workflow.originalPrompt = originalPrompt;
    }

    state.workflows[workflow.id] = workflow;
    renderWorkflowTabs();
    switchWorkflow(workflow.id);

  } finally {
    clearInterval(timerInterval);
    setTimeout(() => {
      if (el.notionSyncOverlay) el.notionSyncOverlay.classList.add('hidden');
    }, 400);
  }
}

  el.runGeneratorBtn.addEventListener('click', async () => {
    const goal = el.generatorGoalInput.value.trim();
    if (!goal) {
      alert('Please enter a goal or task description.');
      return;
    }

    const numQuestions = parseInt(el.generatorNumQuestions.value, 10) || 8;
    el.genSpinner.classList.remove('hidden');
    el.runGeneratorBtn.disabled = true;

    try {
      const masterContext = `${state.vault.skills_and_work}\n${state.vault.limits_and_health}\n${state.vault.custom_doc}`;
      const activeKey = state.apiKey || localStorage.getItem('contextflow_api_key') || el.apiKeyInput.value.trim();

      let genResult;
      if (activeKey) {
        // Direct browser call to Google AI Studio
        genResult = await generateQuestionsDirect(activeKey, state.model, goal, numQuestions, masterContext);
      } else {
        // Server proxy call
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: goal,
            numQuestions: numQuestions,
            masterContext: masterContext,
            apiKey: state.apiKey,
            model: state.model
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate questions');
        }
        genResult = {
          title: data.title || goal.slice(0, 24) + '...',
          questions: data.questions || []
        };
      }

      const prettifiedTitle = genResult.title || (goal.slice(0, 24) + '...');
      el.generatorModal.classList.add('hidden');
      el.generatorGoalInput.value = '';

      // Persist directly to Notion before display so IDs and relational links are locked in
      await persistAndLaunchNotionQuestionSet({
        title: prettifiedTitle,
        description: goal,
        category: 'Personalized Workflows',
        questions: genResult.questions,
        originalPrompt: goal
      });

    } catch (err) {
      alert(`Could not generate questions: ${err.message}. (Ensure API key is configured).`);
    } finally {
      el.genSpinner.classList.add('hidden');
      el.runGeneratorBtn.disabled = false;
    }
  });

  // Inspect Payload
  el.inspectBtn.addEventListener('click', () => {
    saveCurrentAnswer();
    const payload = buildPayload();
    el.payloadPreview.textContent = JSON.stringify(payload, null, 2);
    el.payloadModal.classList.remove('hidden');
  });

  el.closePayloadModal.addEventListener('click', () => {
    el.payloadModal.classList.add('hidden');
  });

  // Vault Modal
  el.vaultBtn.addEventListener('click', () => {
    el.vaultModal.classList.remove('hidden');
    loadVaultBlocks('Working Style & Skills');
  });

  el.closeVaultModal.addEventListener('click', () => {
    el.vaultModal.classList.add('hidden');
  });

  // Vault subtabs
  document.querySelectorAll('.vault-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.vault-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.vault-panel').forEach(p => p.classList.add('hidden'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.vaultTab}`;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.remove('hidden');

      loadVaultBlocks(tab.textContent.trim());
    });
  });

  // Notion Sources & Artifacts Picker Controls
  if (el.toggleSourcesPickerBtn) {
    el.toggleSourcesPickerBtn.addEventListener('click', () => {
      if (el.notionSourcesPanel) {
        el.notionSourcesPanel.classList.toggle('hidden');
        if (!el.notionSourcesPanel.classList.contains('hidden') && (!el.notionSearchResults.children || el.notionSearchResults.children.length === 0)) {
          searchNotionWorkspace('');
        }
      }
    });
  }

  if (el.closeSourcesPanelBtn) {
    el.closeSourcesPanelBtn.addEventListener('click', () => {
      if (el.notionSourcesPanel) el.notionSourcesPanel.classList.add('hidden');
    });
  }

  if (el.notionSearchBtn) {
    el.notionSearchBtn.addEventListener('click', () => {
      const q = el.notionSourceSearchInput ? el.notionSourceSearchInput.value.trim() : '';
      searchNotionWorkspace(q);
    });
  }

  if (el.notionSourceSearchInput) {
    el.notionSourceSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchNotionWorkspace(el.notionSourceSearchInput.value.trim());
      }
    });
  }

  if (el.generateVaultBlocksBtn) {
    el.generateVaultBlocksBtn.addEventListener('click', async () => {
      if (!state.selectedNotionSources.length) {
        alert('Please select at least one Notion page or database first.');
        return;
      }

      const origHtml = el.generateVaultBlocksBtn.innerHTML;
      el.generateVaultBlocksBtn.innerHTML = `<span class="spinner-sm"></span> Extracting & Synthesizing Blocks into Notion DB...`;
      el.generateVaultBlocksBtn.disabled = true;

      try {
        const activeKey = state.apiKey || localStorage.getItem('contextflow_api_key') || el.apiKeyInput?.value.trim();
        const res = await fetch('/api/notion/generate-vault-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedSources: state.selectedNotionSources,
            parentTab: state.activeVaultTab,
            existingBlocks: state.vaultBlocks,
            apiKey: activeKey
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate context blocks');

        state.vaultBlocks = data.blocks || [];
        renderVaultBlocks();
        syncBlocksToText();

        el.generateVaultBlocksBtn.innerHTML = `✓ Generated ${data.blocks.length} Blocks into Notion DB!`;
        setTimeout(() => {
          el.generateVaultBlocksBtn.innerHTML = origHtml;
          el.generateVaultBlocksBtn.disabled = false;
          if (el.notionSourcesPanel) el.notionSourcesPanel.classList.add('hidden');
        }, 2500);

      } catch (err) {
        alert(`Error generating vault blocks: ${err.message}`);
        el.generateVaultBlocksBtn.innerHTML = origHtml;
        el.generateVaultBlocksBtn.disabled = false;
      }
    });
  }

  if (el.vaultBlocksFilter) {
    el.vaultBlocksFilter.addEventListener('change', (e) => {
      state.vaultBlocksFilter = e.target.value;
      renderVaultBlocks();
    });
  }

  if (el.toggleVaultViewModeBtn) {
    el.toggleVaultViewModeBtn.addEventListener('click', () => {
      state.vaultViewMode = state.vaultViewMode === 'blocks' ? 'raw' : 'blocks';
      if (state.vaultViewMode === 'raw') {
        el.vaultBlocksOrganizer?.classList.add('hidden');
        el.vaultSkills?.classList.remove('hidden');
        el.toggleVaultViewModeBtn.innerHTML = 'View: <strong>Raw Text</strong>';
      } else {
        el.vaultBlocksOrganizer?.classList.remove('hidden');
        el.vaultSkills?.classList.add('hidden');
        el.toggleVaultViewModeBtn.innerHTML = 'View: <strong>Blocks</strong>';
        syncBlocksToText();
        renderVaultBlocks();
      }
    });
  }

  if (el.addVaultHeadingBtn) {
    el.addVaultHeadingBtn.addEventListener('click', addNewSectionHeader);
  }

  // File Upload / Dropzone into Master Vault
  el.dropZone.addEventListener('click', () => {
    el.vaultFileInput.click();
  });

  el.vaultFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      el.vaultCustomDoc.value += `\n\n=== INGESTED FILE: ${file.name} ===\n${text}`;
      alert(`File "${file.name}" appended into "Google Doc / Custom Context" tab.`);
    };
    reader.readAsText(file);
  });

  // Save Vault
  el.saveVaultBtn.addEventListener('click', () => {
    state.vault.skills_and_work = el.vaultSkills.value;
    state.vault.limits_and_health = el.vaultLimits.value;
    state.vault.personality_reports = el.vaultPersonality.value;
    state.vault.custom_doc = el.vaultCustomDoc.value;

    localStorage.setItem('contextflow_vault', JSON.stringify(state.vault));

    el.saveVaultBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      el.saveVaultBtn.textContent = 'Save to Vault';
      el.vaultModal.classList.add('hidden');
    }, 800);
  });

  // Load Sample Profile
  el.loadSampleVaultBtn.addEventListener('click', () => {
    el.vaultSkills.value = DEFAULT_VAULT.skills_and_work;
    el.vaultLimits.value = DEFAULT_VAULT.limits_and_health;
    el.vaultPersonality.value = DEFAULT_VAULT.personality_reports;
    el.vaultCustomDoc.value = DEFAULT_VAULT.custom_doc;
  });

  // Compile Master Vault dynamically from Notion
  if (el.compileVaultNotionBtn) {
    el.compileVaultNotionBtn.addEventListener('click', async () => {
      const origHtml = el.compileVaultNotionBtn.innerHTML;
      el.compileVaultNotionBtn.innerHTML = `<span class="spinner-sm"></span> Compiling from Notion...`;
      el.compileVaultNotionBtn.disabled = true;

      try {
        const res = await fetch('/api/vault/compile-from-notion');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to compile vault from Notion');
        }

        state.vault = { ...data.vault };
        el.vaultSkills.value = state.vault.skills_and_work || '';
        el.vaultLimits.value = state.vault.limits_and_health || '';
        el.vaultPersonality.value = state.vault.personality_reports || '';
        el.vaultCustomDoc.value = state.vault.custom_doc || '';
        localStorage.setItem('contextflow_vault', JSON.stringify(state.vault));

        if (el.vaultNotionStatus) {
          el.vaultNotionStatus.textContent = `Analyzed ${data.stats.totalSets} sets & ${data.stats.totalResponses} responses (${new Date().toLocaleTimeString()})`;
        }

        el.compileVaultNotionBtn.innerHTML = `✓ Compiled ${data.stats.totalResponses} Responses!`;
        setTimeout(() => {
          el.compileVaultNotionBtn.innerHTML = origHtml;
          el.compileVaultNotionBtn.disabled = false;
        }, 3000);

      } catch (err) {
        alert(`Error compiling vault: ${err.message}`);
        el.compileVaultNotionBtn.innerHTML = origHtml;
        el.compileVaultNotionBtn.disabled = false;
      }
    });
  }

  // Settings Modal
  el.settingsBtn.addEventListener('click', () => {
    el.settingsModal.classList.remove('hidden');
  });

  el.closeSettingsModal.addEventListener('click', () => {
    el.settingsModal.classList.add('hidden');
  });

  el.saveSettingsBtn.addEventListener('click', () => {
    state.apiKey = el.apiKeyInput.value.trim();
    state.model = el.modelSelect.value;
    state.notionToken = el.notionTokenInput.value.trim();
    state.notionDatabaseId = el.notionDatabaseIdInput.value.trim();

    localStorage.setItem('contextflow_api_key', state.apiKey);
    localStorage.setItem('contextflow_model', state.model);
    localStorage.setItem('contextflow_notion_token', state.notionToken);
    localStorage.setItem('contextflow_notion_db_id', state.notionDatabaseId);

    el.saveSettingsBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      el.saveSettingsBtn.textContent = 'Save Settings';
      el.settingsModal.classList.add('hidden');
    }, 800);
  });
}

// Render History Modal List
function renderHistoryModal() {
  if (!state.history.length) {
    el.historyList.innerHTML = '<p class="placeholder-text">No past deliverables saved yet. Complete a questionnaire to see it here.</p>';
    return;
  }

  el.historyList.innerHTML = '';
  state.history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-card-left">
        <div class="history-card-title">${escapeHtml(item.workflowName)}</div>
        <div class="history-card-date">${escapeHtml(item.date)}</div>
      </div>
      <div class="history-card-actions">
        <button class="btn btn-secondary text-xs view-hist-btn">View</button>
      </div>
    `;

    card.querySelector('.view-hist-btn').addEventListener('click', () => {
      currentSessionRecord = item;
      el.historyModal.classList.add('hidden');
      el.questionnaireView.classList.add('hidden');
      el.outputView.classList.remove('hidden');

      el.outputTitle.textContent = `Historical Deliverable: ${item.workflowName}`;
      el.outputSubtitle.textContent = `Generated on ${item.date}`;
      el.outputStatusSpinner.classList.add('hidden');

      const reviewHtml = buildAnswerReviewAccordion({
        workflowId: item.workflowId,
        answers: item.answers
      });

      el.outputContent.innerHTML = `
        ${reviewHtml}
        <div class="deliverable-text">
          ${renderMarkdownOutput(item.output)}
        </div>
      `;
    });

    el.historyList.appendChild(card);
  });
}

// Kick off app
init();
