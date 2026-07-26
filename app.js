const SUPABASE_URL = 'https://fgomaujsdblpzxhnnqrg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i';

const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const connectionStatus = document.getElementById('connectionStatus');
const authShell = document.getElementById('authShell');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authDescription = document.getElementById('authDescription');
const authSubmit = document.getElementById('authSubmit');
const authModeButton = document.getElementById('authModeButton');
const authMessage = document.getElementById('authMessage');
const email = document.getElementById('email');
const password = document.getElementById('password');
const appShell = document.getElementById('appShell');
const accountControls = document.getElementById('accountControls');
const userEmail = document.getElementById('userEmail');
const signOutButton = document.getElementById('signOutButton');
const newRootButton = document.getElementById('newRootButton');
const rootForm = document.getElementById('rootForm');
const rootName = document.getElementById('rootName');
const cancelRootButton = document.getElementById('cancelRootButton');
const tree = document.getElementById('tree');
const emptyTree = document.getElementById('emptyTree');
const welcome = document.getElementById('welcome');
const nodeView = document.getElementById('nodeView');
const nodeLevel = document.getElementById('nodeLevel');
const nodeTitle = document.getElementById('nodeTitle');
const nodeActionsButton = document.getElementById('nodeActionsButton');
const nodeContentForm = document.getElementById('nodeContentForm');
const nodeContent = document.getElementById('nodeContent');
const nodeContentEditor = document.getElementById('nodeContentEditor');
const nodeContentMessage = document.getElementById('nodeContentMessage');
const logView = document.getElementById('logView');
const logTitle = document.getElementById('logTitle');
const logActionsButton = document.getElementById('logActionsButton');
const logForm = document.getElementById('logForm');
const logEntry = document.getElementById('logEntry');
const logEntryEditor = document.getElementById('logEntryEditor');
const logMessage = document.getElementById('logMessage');
const entries = document.getElementById('entries');
const entryCount = document.getElementById('entryCount');
const linksView = document.getElementById('linksView');
const linksTitle = document.getElementById('linksTitle');
const linkForm = document.getElementById('linkForm');
const linkLabel = document.getElementById('linkLabel');
const linkUrl = document.getElementById('linkUrl');
const linkMessage = document.getElementById('linkMessage');
const linksList = document.getElementById('linksList');
const linkCount = document.getElementById('linkCount');
const embedView = document.getElementById('embedView');
const embedTitle = document.getElementById('embedTitle');
const embedFrame = document.getElementById('embedFrame');
const embedExternalLink = document.getElementById('embedExternalLink');
const embedActionsButton = document.getElementById('embedActionsButton');
const embedDialog = document.getElementById('embedDialog');
const embedForm = document.getElementById('embedForm');
const embedLocation = document.getElementById('embedLocation');
const embedName = document.getElementById('embedName');
const embedUrl = document.getElementById('embedUrl');
const embedMessage = document.getElementById('embedMessage');
const cancelEmbedButton = document.getElementById('cancelEmbedButton');
const nodeMenu = document.getElementById('nodeMenu');
const addChildAction = document.getElementById('addChildAction');
const addLogAction = document.getElementById('addLogAction');
const addLinksAction = document.getElementById('addLinksAction');
const addEmbedAction = document.getElementById('addEmbedAction');
const editNodeAction = document.getElementById('editNodeAction');
const deleteNodeAction = document.getElementById('deleteNodeAction');
const createGoogleWorkspaceAction = document.getElementById('createGoogleWorkspaceAction');
const googleWorkspaceDialog = document.getElementById('googleWorkspaceDialog');
const googleWorkspaceForm = document.getElementById('googleWorkspaceForm');
const googleWorkspaceLocation = document.getElementById('googleWorkspaceLocation');
const googleWorkspaceName = document.getElementById('googleWorkspaceName');
const googleWorkspaceFullTitle = document.getElementById('googleWorkspaceFullTitle');
const googleWorkspaceTemplate = document.getElementById('googleWorkspaceTemplate');
const googleWorkspaceStarterDocs = document.getElementById('googleWorkspaceStarterDocs');
const googleWorkspaceMessage = document.getElementById('googleWorkspaceMessage');
const cancelGoogleWorkspaceButton = document.getElementById('cancelGoogleWorkspaceButton');

let authMode = 'signin';
let currentUser = null;
let nodes = [];
let selectedNodeId = null;
let menuNodeId = null;
let promotedRootId = null;
let embedParentId = null;
let googleWorkspaceParentId = null;
let googleAccessToken = null;
const expandedNodeIds = new Set();

const GOOGLE_WORKSPACE_TEMPLATES = {
  presentation: {
    folders: ['Research', 'Slides', 'Images', 'Handouts', 'Room', 'Final'],
    documents: [
      ['', 'Project Checklist', [
        'Brainstorm goals and ideas',
        'Define the purpose, audience, and main message',
        'Research the topic and identify useful sources',
        'Record research notes and source links',
        'Draft the presentation outline',
        'Reserve the room',
        'Plan the room layout and equipment',
        'Decide on snacks and check dietary needs',
        'Develop the slides',
        'Select images and record their sources',
        'Draft the handout',
        'Review the content and one-hour timing',
        'Rehearse the complete presentation',
        'Revise the slides, handout, and activities',
        'Confirm the room and equipment',
        'Purchase or prepare snacks and materials',
        'Complete the final rehearsal',
        'Deliver the presentation'
      ], 'checklist'],
      ['Research', 'Research Notes', 'Research Notes\n\nSource:\nAuthor:\nLink:\nDate reviewed:\n\nMain point:\nWhy it matters:\nUseful example:\nPossible slide:\nQuestions or concerns:\n'],
      ['Slides', 'Presentation Outline', 'Presentation Outline\n\nPurpose:\nAudience:\nMain message:\n\nOpening\n\nKey points\n\nActivity or discussion\n\nSummary and questions\n'],
      ['Images', 'Image Sources', 'Image Sources\n\nImage:\nSource:\nPermission or license:\nIntended slide:\n'],
      ['Handouts', 'Handout Draft', 'Handout Draft\n\nTitle:\nMain ideas:\nReflection questions:\nResources:\n'],
      ['Room', 'Room and Snacks Checklist', 'Room and Snacks Checklist\n\nRoom reserved: ☐\nDate and time confirmed: ☐\nSeating layout selected: ☐\nProjector checked: ☐\nAudio checked: ☐\nAccessibility checked: ☐\nSnacks selected: ☐\nDietary needs checked: ☐\nCleanup arranged: ☐\n'],
      ['Final', 'Final Run Sheet', 'Final Run Sheet\n\nArrival time:\nRoom setup:\nEquipment check:\nMaterials:\nPresentation timing:\nCleanup:\n']
    ]
  },
  research: {
    folders: ['Sources', 'Notes', 'Data', 'Drafts', 'Images', 'Final'],
    documents: [['Notes', 'Research Notes', 'Research Notes\n\nQuestion:\nSource:\nFinding:\nSignificance:\nFollow-up:\n'], ['Drafts', 'Working Draft', 'Working Draft\n\nPurpose:\nEvidence:\nAnalysis:\nConclusion:\n']]
  },
  event: {
    folders: ['Planning', 'Venue', 'Guests', 'Food', 'Materials', 'Final'],
    documents: [['Planning', 'Event Plan', 'Event Plan\n\nPurpose:\nDate and time:\nAudience:\nBudget:\nSchedule:\n'], ['Venue', 'Venue Checklist', 'Venue Checklist\n\nReserved: ☐\nLayout: ☐\nEquipment: ☐\nAccessibility: ☐\n'], ['Final', 'Event Run Sheet', 'Event Run Sheet\n\nBefore event:\nDuring event:\nAfter event:\n']]
  },
  blank: { folders: [], documents: [] }
};

function getWorkspaceStateKey() {
  return currentUser ? `mymain-workspace-${currentUser.id}` : null;
}

function saveWorkspaceState() {
  const key = getWorkspaceStateKey();
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify({
      selectedNodeId,
      expandedNodeIds: [...expandedNodeIds]
    }));
  } catch {
    // The app still works when browser storage is unavailable.
  }
}

function restoreWorkspaceState() {
  const key = getWorkspaceStateKey();
  if (!key) return;

  let state;
  try {
    state = JSON.parse(localStorage.getItem(key));
  } catch {
    return;
  }

  if (!state || typeof state !== 'object') return;

  const availableIds = new Set(nodes.map(node => node.id));
  expandedNodeIds.clear();
  if (Array.isArray(state.expandedNodeIds)) {
    state.expandedNodeIds.forEach(id => {
      if (availableIds.has(id)) expandedNodeIds.add(id);
    });
  }

  if (availableIds.has(state.selectedNodeId)) {
    let ancestor = nodes.find(node => node.id === state.selectedNodeId);
    while (ancestor?.parent_id) {
      expandedNodeIds.add(ancestor.parent_id);
      ancestor = nodes.find(node => node.id === ancestor.parent_id);
    }
    selectNode(state.selectedNodeId);
  } else {
    showWelcome();
  }
}

function setStatus(message, state) {
  connectionStatus.textContent = message;
  connectionStatus.dataset.state = state;
}

function setMessage(element, message, state = '') {
  element.textContent = message;
  element.dataset.state = state;
}

const RICH_TEXT_PREFIX = '<!--mymain-rich-->';
const editorSelections = new WeakMap();

function sanitizeRichText(value) {
  const template = document.createElement('template');
  template.innerHTML = String(value || '').replace(RICH_TEXT_PREFIX, '');
  const allowedTags = new Set(['B', 'STRONG', 'U', 'BR', 'DIV', 'P', 'SPAN', 'INPUT', 'FONT', 'UL', 'LI']);
  const allowedSizes = new Set(['font-small', 'font-large', 'font-x-large']);

  [...template.content.querySelectorAll('*')].forEach(element => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (element.tagName === 'INPUT') {
      if (element.type !== 'checkbox') return element.remove();
      const checked = element.checked || element.hasAttribute('checked');
      [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
      element.type = 'checkbox';
      if (checked) element.setAttribute('checked', '');
      return;
    }
    if (element.tagName === 'FONT') {
      const sizeClass = { '1': 'font-small', '2': 'font-small', '5': 'font-large', '6': 'font-x-large', '7': 'font-x-large' }[element.getAttribute('size')];
      const span = document.createElement('span');
      if (sizeClass) span.className = sizeClass;
      span.append(...element.childNodes);
      element.replaceWith(span);
      return;
    }
    const sizeClass = [...element.classList].find(name => allowedSizes.has(name));
    const isChecklistItem = element.tagName === 'DIV' && element.classList.contains('checklist-item');
    [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
    if (element.tagName === 'SPAN' && sizeClass) element.className = sizeClass;
    if (isChecklistItem) element.className = 'checklist-item';
  });
  return template.innerHTML;
}

function setEditorContent(editor, value) {
  editor.classList.remove('checklist-item');
  if (String(value || '').startsWith(RICH_TEXT_PREFIX)) editor.innerHTML = sanitizeRichText(value);
  else editor.textContent = value || '';
}

function serializeEditor(editor) {
  editor.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.toggleAttribute('checked', checkbox.checked);
  });
  return `${RICH_TEXT_PREFIX}${sanitizeRichText(editor.innerHTML)}`;
}

function renderRichText(element, value) {
  element.className = 'entry-rich-text';
  if (String(value || '').startsWith(RICH_TEXT_PREFIX)) element.innerHTML = sanitizeRichText(value);
  else element.textContent = value || '';
  element.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.disabled = true);
}

function rememberEditorSelection(editor) {
  const selection = window.getSelection();
  if (selection.rangeCount && editor.contains(selection.anchorNode)) {
    editorSelections.set(editor, selection.getRangeAt(0).cloneRange());
  }
}

function restoreEditorSelection(editor) {
  const scrollPosition = { x: window.scrollX, y: window.scrollY };
  try {
    editor.focus({ preventScroll: true });
  } catch {
    editor.focus();
  }
  window.scrollTo(scrollPosition.x, scrollPosition.y);
  const range = editorSelections.get(editor);
  if (!range || !editor.contains(range.commonAncestorContainer)) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function restorePageScroll(position) {
  if (!position) return;
  window.scrollTo(position.x, position.y);
  requestAnimationFrame(() => {
    window.scrollTo(position.x, position.y);
    requestAnimationFrame(() => window.scrollTo(position.x, position.y));
  });
}

function getCurrentBlock(editor) {
  const selection = window.getSelection();
  let element = selection.rangeCount ? selection.anchorNode : null;
  if (element?.nodeType === Node.TEXT_NODE) element = element.parentElement;
  const block = element?.closest?.('.checklist-item, div, p, li');
  return block && block !== editor && editor.contains(block) ? block : null;
}

function setCaret(element, atStart = false) {
  const range = document.createRange();
  if (!atStart && element.lastChild?.nodeName === 'BR') {
    range.setStartBefore(element.lastChild);
    range.collapse(true);
  } else {
    range.selectNodeContents(element);
    range.collapse(atStart);
  }
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function toggleCheckbox(editor) {
  editor.classList.remove('checklist-item');
  let block = getCurrentBlock(editor);
  if (block?.classList.contains('checklist-item')) {
    block.querySelector(':scope > input[type="checkbox"]')?.remove();
    if (block.firstChild?.nodeType === Node.TEXT_NODE) block.firstChild.textContent = block.firstChild.textContent.replace(/^\u00a0/, '');
    block.classList.remove('checklist-item');
    return;
  }
  if (!block || block.tagName === 'LI') {
    document.execCommand('formatBlock', false, 'div');
    block = getCurrentBlock(editor);
  }
  if (!block) {
    block = document.createElement('div');
    block.append(document.createElement('br'));
    editor.append(block);
  }
  block.classList.add('checklist-item');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  block.prepend(checkbox, document.createTextNode('\u00a0'));
  setCaret(block);
}

function updateToolbarState(editor) {
  const toolbar = document.querySelector(`.edit-toolbar[data-editor="${editor.id}"]`);
  if (!toolbar) return;
  toolbar.querySelector('[data-command="bold"]')?.setAttribute('aria-pressed', String(document.queryCommandState('bold')));
  toolbar.querySelector('[data-command="underline"]')?.setAttribute('aria-pressed', String(document.queryCommandState('underline')));
  toolbar.querySelector('[data-command="insertUnorderedList"]')?.setAttribute('aria-pressed', String(document.queryCommandState('insertUnorderedList')));
  toolbar.querySelector('[data-command="checkbox"]')?.setAttribute('aria-pressed', String(Boolean(getCurrentBlock(editor)?.classList.contains('checklist-item'))));
}

function applyInlineCommand(editor, command) {
  const selection = window.getSelection();
  const formattedSelection = selection.rangeCount && !selection.getRangeAt(0).collapsed;
  document.execCommand(command, false);

  // Mobile browsers often leave the typing state inside the formatted element.
  // After formatting selected text, move beyond it and return future typing to plain text.
  if (formattedSelection) {
    selection.collapseToEnd();
    if (document.queryCommandState(command)) document.execCommand(command, false);
  }
  rememberEditorSelection(editor);
}

document.querySelectorAll('.rich-editor').forEach(editor => {
  ['keyup', 'mouseup', 'input'].forEach(type => editor.addEventListener(type, () => {
    rememberEditorSelection(editor);
    updateToolbarState(editor);
  }));
  editor.addEventListener('keydown', event => {
    if (event.key === 'Enter' && document.queryCommandState('underline')) {
      setTimeout(() => {
        if (document.queryCommandState('underline')) document.execCommand('underline', false);
        rememberEditorSelection(editor);
        updateToolbarState(editor);
      }, 0);
    }
    if (event.key !== 'Enter') return;
    const block = getCurrentBlock(editor);
    if (!block?.classList.contains('checklist-item')) return;
    event.preventDefault();
    const nextItem = document.createElement('div');
    nextItem.className = 'checklist-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    nextItem.append(checkbox, document.createTextNode('\u00a0'), document.createElement('br'));
    block.after(nextItem);
    setCaret(nextItem);
    rememberEditorSelection(editor);
    updateToolbarState(editor);
  });
});

document.querySelectorAll('.edit-toolbar').forEach(toolbar => {
  const editor = document.getElementById(toolbar.dataset.editor);
  let toolbarScrollPosition;
  toolbar.addEventListener('pointerdown', () => {
    toolbarScrollPosition = { x: window.scrollX, y: window.scrollY };
  });
  toolbar.querySelectorAll('button').forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.onclick = () => {
      restoreEditorSelection(editor);
      if (button.dataset.command === 'checkbox') {
        toggleCheckbox(editor);
      } else if (button.dataset.command === 'bold' || button.dataset.command === 'underline') {
        applyInlineCommand(editor, button.dataset.command);
      } else {
        document.execCommand(button.dataset.command, false);
      }
      rememberEditorSelection(editor);
      updateToolbarState(editor);
      restorePageScroll(toolbarScrollPosition);
    };
  });
  const sizeSelect = toolbar.querySelector('select[data-command="fontSize"]');
  sizeSelect.onchange = () => {
    restoreEditorSelection(editor);
    const size = { small: '2', normal: '3', large: '5', 'x-large': '7' }[sizeSelect.value];
    document.execCommand('fontSize', false, size);
    rememberEditorSelection(editor);
    sizeSelect.value = 'normal';
    restorePageScroll(toolbarScrollPosition);
  };
});

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function sortByName(items) {
  return [...items].sort((first, second) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
  );
}

function getChildren(parentId) {
  return sortByName(nodes.filter(node => node.parent_id === parentId));
}

function isDescendant(candidateId, ancestorId) {
  let candidate = nodes.find(node => node.id === candidateId);
  while (candidate?.parent_id) {
    if (candidate.parent_id === ancestorId) return true;
    candidate = nodes.find(node => node.id === candidate.parent_id);
  }
  return false;
}

function renderTree() {
  tree.replaceChildren();
  const roots = getChildren(null);
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches && promotedRootId) {
    const promotedIndex = roots.findIndex(root => root.id === promotedRootId);
    if (promotedIndex > 0) roots.unshift(...roots.splice(promotedIndex, 1));
  }
  emptyTree.hidden = roots.length > 0;
  roots.forEach(root => appendNode(root, tree));
}

function appendNode(node, container) {
  const children = getChildren(node.id);
  const nodeGroup = document.createElement('div');
  nodeGroup.className = 'tree-node';
  if (children.length) nodeGroup.classList.add('has-children');

  const row = document.createElement('div');
  row.className = 'tree-row';

  const itemButton = document.createElement('button');
  itemButton.type = 'button';
  itemButton.className = 'tree-item';
  itemButton.title = node.name;
  itemButton.setAttribute('aria-current', String(node.id === selectedNodeId));
  if (children.length) {
    itemButton.setAttribute('aria-haspopup', 'menu');
  }

  const chevron = document.createElement('span');
  chevron.className = 'tree-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = children.length ? '>' : '';

  const label = document.createElement('span');
  label.textContent = node.name;
  itemButton.append(chevron);
  itemButton.append(label);
  itemButton.onclick = event => {
    const usesTouchMenus = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (usesTouchMenus && node.depth === 1) {
      promotedRootId = node.id;
      tree.prepend(nodeGroup);
    }
    if (usesTouchMenus && children.length && !nodeGroup.classList.contains('touch-open')) {
      event.preventDefault();
      tree.querySelectorAll('.tree-node.touch-open').forEach(openNode => {
        if (!openNode.contains(nodeGroup)) openNode.classList.remove('touch-open');
      });
      nodeGroup.classList.add('touch-open');
      itemButton.setAttribute('aria-expanded', 'true');
      return;
    }
    selectNode(node.id);
  };
  itemButton.oncontextmenu = event => {
    event.preventDefault();
    openNodeMenu(node.id, event.currentTarget);
  };

  const actionsButton = document.createElement('button');
  actionsButton.type = 'button';
  actionsButton.className = 'tree-actions';
  actionsButton.textContent = '⋮';
  actionsButton.setAttribute('aria-label', `Actions for ${node.name}`);
  actionsButton.onclick = event => openNodeMenu(node.id, event.currentTarget);

  row.append(itemButton, actionsButton);
  nodeGroup.append(row);
  container.append(nodeGroup);

  if (children.length) {
    const childList = document.createElement('div');
    childList.className = 'tree-children';
    childList.setAttribute('role', 'menu');
    nodeGroup.append(childList);
    children.forEach(child => appendNode(child, childList));
  }
}

function selectNode(id, toggleChildren = false) {
  const node = nodes.find(item => item.id === id);
  if (!node) return;

  selectedNodeId = id;
  const children = getChildren(id);
  if (toggleChildren && children.length) {
    if (expandedNodeIds.has(id)) expandedNodeIds.delete(id);
    else expandedNodeIds.add(id);
  }

  welcome.hidden = true;
  if (node.node_type === 'log') {
    nodeView.hidden = true;
    linksView.hidden = true;
    embedView.hidden = true;
    logView.hidden = false;
    logTitle.textContent = node.name;
    loadLogEntries(node.id);
  } else if (node.node_type === 'links') {
    nodeView.hidden = true;
    logView.hidden = true;
    embedView.hidden = true;
    linksView.hidden = false;
    const parent = nodes.find(item => item.id === node.parent_id);
    linksTitle.textContent = parent ? parent.name : 'Links';
    loadLinks(node.id);
  } else if (node.node_type === 'embed') {
    nodeView.hidden = true;
    logView.hidden = true;
    linksView.hidden = true;
    embedView.hidden = false;
    embedTitle.textContent = node.name;
    embedFrame.title = node.name;
    embedFrame.src = node.content;
    embedExternalLink.href = node.content.includes('docs.google.com/document/') && node.content.endsWith('/preview')
      ? node.content.replace(/\/preview$/, '/edit')
      : node.content;
  } else {
    logView.hidden = true;
    linksView.hidden = true;
    embedView.hidden = true;
    nodeView.hidden = false;
    nodeLevel.textContent = `Level ${node.depth}`;
    nodeTitle.textContent = node.name;
    setEditorContent(nodeContentEditor, node.content);
    setMessage(nodeContentMessage, '');
  }
  saveWorkspaceState();
  renderTree();
}

function showWelcome() {
  selectedNodeId = null;
  nodeView.hidden = true;
  logView.hidden = true;
  linksView.hidden = true;
  embedView.hidden = true;
  embedFrame.removeAttribute('src');
  welcome.hidden = false;
  saveWorkspaceState();
  renderTree();
}

async function loadNodes() {
  const { data, error } = await db
    .from('mymain_nodes')
    .select('id, parent_id, name, node_type, depth, content, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    setStatus('Database setup needed', 'error');
    emptyTree.hidden = false;
    emptyTree.textContent = error.message;
    return;
  }

  nodes = data;
  setStatus('Connected', 'ready');
  renderTree();
}

async function loadLinks(nodeId) {
  linksList.innerHTML = '<p class="no-entries">Loading links...</p>';
  const { data, error } = await db
    .from('mymain_links')
    .select('id, label, url, created_at')
    .eq('node_id', nodeId)
    .order('created_at', { ascending: true });

  if (selectedNodeId !== nodeId) return;
  if (error) {
    linksList.replaceChildren();
    const message = document.createElement('p');
    message.className = 'no-entries';
    message.textContent = error.message;
    linksList.append(message);
    return;
  }
  renderLinks(data, nodeId);
}

function renderLinks(items, nodeId) {
  linksList.replaceChildren();
  linkCount.textContent = `${items.length} ${items.length === 1 ? 'link' : 'links'}`;
  if (!items.length) {
    const message = document.createElement('p');
    message.className = 'no-entries';
    message.textContent = 'No links yet. Add the first friendly link above.';
    linksList.append(message);
    return;
  }

  [...items]
    .sort((first, second) => first.label.localeCompare(second.label, undefined, { sensitivity: 'base' }))
    .forEach(item => {
    const row = document.createElement('div');
    row.className = 'link-item';
    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = item.label;
    anchor.title = item.url;
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-link';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${item.label}`);
    deleteButton.onclick = () => deleteLink(item, nodeId);
    row.append(anchor, deleteButton);
    linksList.append(row);
    });
}

async function deleteLink(item, nodeId) {
  if (!confirm(`Delete the link ${item.label}?`)) return;
  const { error } = await db.from('mymain_links').delete().eq('id', item.id);
  if (error) return alert(error.message);
  await loadLinks(nodeId);
}

async function loadLogEntries(nodeId) {
  entries.innerHTML = '<p class="no-entries">Loading entries...</p>';
  const { data, error } = await db
    .from('mymain_log_entries')
    .select('id, body, created_at')
    .eq('node_id', nodeId)
    .order('created_at', { ascending: false });

  if (selectedNodeId !== nodeId) return;
  if (error) {
    entries.innerHTML = '';
    const message = document.createElement('p');
    message.className = 'no-entries';
    message.textContent = error.message;
    entries.append(message);
    return;
  }
  renderEntries(data);
}

function renderEntries(items) {
  entries.replaceChildren();
  entryCount.textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
  if (!items.length) {
    const message = document.createElement('p');
    message.className = 'no-entries';
    message.textContent = 'No entries yet. Add the first update above.';
    entries.append(message);
    return;
  }

  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'entry';
    const time = document.createElement('time');
    time.dateTime = item.created_at;
    time.textContent = formatDate(item.created_at);
    const body = document.createElement('div');
    renderRichText(body, item.body);
    article.append(time, body);
    entries.append(article);
  });
}

function openNodeMenu(id, anchor) {
  const node = nodes.find(item => item.id === id);
  if (!node) return;
  menuNodeId = id;
  const isRegularNode = node.node_type === 'node';
  const children = getChildren(node.id);
  addChildAction.hidden = !isRegularNode || node.depth >= 4;
  addLogAction.hidden = !isRegularNode || children.some(child => child.node_type === 'log');
  addLinksAction.hidden = !isRegularNode || children.some(child => child.node_type === 'links');
  addEmbedAction.hidden = !isRegularNode || node.depth >= 5;
  createGoogleWorkspaceAction.hidden = !isRegularNode || node.depth >= 4;
  nodeMenu.hidden = false;

  const rect = anchor.getBoundingClientRect();
  const menuWidth = 180;
  const visibleActions = [...nodeMenu.querySelectorAll('button')].filter(button => !button.hidden);
  const menuHeight = visibleActions.length * 40 + 12;
  nodeMenu.style.left = `${Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))}px`;
  nodeMenu.style.top = `${Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - menuHeight - 8))}px`;
  visibleActions[0]?.focus();
}

function closeNodeMenu() {
  nodeMenu.hidden = true;
  menuNodeId = null;
}

async function addChild(node) {
  if (node.depth >= 4 || node.node_type !== 'node') return;
  const value = prompt(`Name the child beneath ${node.name}:`);
  if (value === null) return;
  const name = value.trim();
  if (!name) return alert('Enter a node name.');

  const { error } = await db.rpc('mymain_create_child', {
    parent_node_id: node.id,
    child_name: name
  });
  if (error) return alert(error.message);

  expandedNodeIds.add(node.id);
  saveWorkspaceState();
  await loadNodes();
}

async function addSpecialNode(node, nodeType) {
  if (node.node_type !== 'node') return;
  const { error } = await db.rpc('mymain_create_special_node', {
    parent_node_id: node.id,
    special_node_type: nodeType
  });
  if (error) return alert(error.message);

  expandedNodeIds.add(node.id);
  saveWorkspaceState();
  await loadNodes();
}

function openGoogleWorkspaceDialog(node) {
  if (node.node_type !== 'node' || node.depth >= 4) return;
  googleWorkspaceParentId = node.id;
  googleWorkspaceForm.reset();
  googleWorkspaceName.value = node.name.length <= 12 ? node.name : '';
  googleWorkspaceTemplate.value = 'presentation';
  googleWorkspaceStarterDocs.checked = true;
  googleWorkspaceLocation.textContent = `Drive links will be saved beneath “${node.name}”.`;
  setMessage(googleWorkspaceMessage, 'MyMain will request permission to create and manage only the Drive files it creates.');
  googleWorkspaceDialog.showModal();
  googleWorkspaceName.focus();
}

function requestGoogleDriveToken() {
  return new Promise((resolve, reject) => {
    const clientId = window.MYMAIN_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) return reject(new Error('Add your Google OAuth client ID to google-config.js first.'));
    if (!window.google?.accounts?.oauth2) return reject(new Error('Google authorization is still loading. Check your connection and try again.'));
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: response => {
        if (response.error) reject(new Error(response.error_description || response.error));
        else { googleAccessToken = response.access_token; resolve(googleAccessToken); }
      },
      error_callback: error => reject(new Error(error.message || error.type || 'Google authorization did not complete.'))
    });
    tokenClient.requestAccessToken({ prompt: googleAccessToken ? '' : 'consent' });
  });
}

async function callGoogleApi(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Google request failed (${response.status}).`);
  return data;
}

async function createDriveResource(name, mimeType, parentId) {
  const requestBody = { name, mimeType };
  if (parentId) requestBody.parents = [parentId];
  return callGoogleApi('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', { method: 'POST', body: JSON.stringify(requestBody) });
}

async function populateGoogleDocument(documentId, content) {
  if (!content) return;
  await callGoogleApi(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST', body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: content } }] })
  });
}

async function populateGoogleChecklist(documentId, fullTitle, items) {
  const prefix = `${fullTitle ? `${fullTitle}\n\n` : ''}Project Checklist\n\n`;
  const text = `${prefix}${items.join('\n\n')}\n`;
  let itemStartIndex = 1 + prefix.length;
  const checkboxRequests = items.map(item => {
    const request = { createParagraphBullets: {
      range: { startIndex: itemStartIndex, endIndex: itemStartIndex + item.length + 1 },
      bulletPreset: 'BULLET_CHECKBOX'
    } };
    itemStartIndex += item.length + 2;
    return request;
  });
  await callGoogleApi(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: [
      { insertText: { location: { index: 1 }, text } },
      ...checkboxRequests
    ] })
  });
}

async function ensureLinksNode(parent) {
  const existing = nodes.find(node => node.parent_id === parent.id && node.node_type === 'links');
  if (existing) return existing;
  const { data, error } = await db.rpc('mymain_create_special_node', { parent_node_id: parent.id, special_node_type: 'links' });
  if (error) throw error;
  return data;
}

async function saveGoogleWorkspaceLinks(parent, resources) {
  const linksNode = await ensureLinksNode(parent);
  const rows = resources.map(resource => ({
    node_id: linksNode.id,
    label: resource.label,
    url: resource.webViewLink || (resource.mimeType === 'application/vnd.google-apps.folder'
      ? `https://drive.google.com/drive/folders/${resource.id}`
      : `https://docs.google.com/document/d/${resource.id}/edit`)
  }));
  const { error } = await db.from('mymain_links').insert(rows);
  if (error) throw error;
  const checklist = resources.find(resource => resource.isChecklist);
  let checklistNodeId = null;
  if (checklist) {
    const { data, error: embedError } = await db.from('mymain_nodes').insert({
      parent_id: parent.id,
      name: 'Project Checklist',
      node_type: 'embed',
      depth: parent.depth + 1,
      content: `https://docs.google.com/document/d/${checklist.id}/preview`
    }).select('id').single();
    if (embedError) throw new Error(`Drive links were saved, but the checklist preview could not be created: ${embedError.message}`);
    checklistNodeId = data.id;
  }
  await loadNodes();
  expandedNodeIds.add(parent.id);
  selectNode(checklistNodeId || linksNode.id);
}

async function createGoogleWorkspace(parent, settings) {
  await requestGoogleDriveToken();
  const template = GOOGLE_WORKSPACE_TEMPLATES[settings.template] || GOOGLE_WORKSPACE_TEMPLATES.blank;
  const root = await createDriveResource(settings.name, 'application/vnd.google-apps.folder');
  const resources = [{ ...root, label: `${settings.name} — Drive folder` }];
  const folderIds = new Map();
  for (const folderName of template.folders) {
    setMessage(googleWorkspaceMessage, `Creating ${folderName} folder...`);
    const folder = await createDriveResource(folderName, 'application/vnd.google-apps.folder', root.id);
    folderIds.set(folderName, folder.id);
    resources.push({ ...folder, label: `${settings.name} — ${folderName}` });
  }
  if (settings.starterDocs) {
    for (const [folderName, documentName, starterContent, documentType] of template.documents) {
      setMessage(googleWorkspaceMessage, `Creating ${documentName}...`);
      const document = await createDriveResource(documentName, 'application/vnd.google-apps.document', folderIds.get(folderName) || root.id);
      if (documentType === 'checklist') await populateGoogleChecklist(document.id, settings.fullTitle, starterContent);
      else await populateGoogleDocument(document.id, (settings.fullTitle ? `${settings.fullTitle}\n\n` : '') + starterContent);
      resources.push({ ...document, label: `${settings.name} — ${documentName}`, isChecklist: documentType === 'checklist' });
    }
  }
  setMessage(googleWorkspaceMessage, 'Saving Drive links in MyMain...');
  await saveGoogleWorkspaceLinks(parent, resources);
  return root;
}

function openEmbedDialog(node) {
  if (node.node_type !== 'node' || node.depth >= 5) return;
  embedParentId = node.id;
  embedForm.reset();
  embedLocation.textContent = `Save beneath “${node.name}”. The URL is stored when this page is created.`;
  setMessage(embedMessage, 'Some websites do not permit embedding.');
  embedDialog.showModal();
  embedName.focus();
}

async function renameNode(node) {
  const value = prompt('Enter the new name:', node.name);
  if (value === null) return;
  const name = value.trim();
  if (!name || name === node.name) return;

  const { error } = await db.from('mymain_nodes').update({ name }).eq('id', node.id);
  if (error) return alert(error.message);
  await loadNodes();
  selectNode(node.id);
}

async function deleteNode(node) {
  const childCount = nodes.filter(item => item.parent_id === node.id || isDescendant(item.id, node.id)).length;
  const detail = childCount ? ` and ${childCount} item${childCount === 1 ? '' : 's'} beneath it` : '';
  if (!confirm(`Delete ${node.name}${detail}? This cannot be undone.`)) return;

  const { error } = await db.from('mymain_nodes').delete().eq('id', node.id);
  if (error) return alert(error.message);

  expandedNodeIds.delete(node.id);
  showWelcome();
  await loadNodes();
}

async function handleSession(session) {
  currentUser = session?.user ?? null;
  if (!currentUser) {
    nodes = [];
    selectedNodeId = null;
    expandedNodeIds.clear();
    appShell.hidden = true;
    accountControls.hidden = true;
    authShell.hidden = false;
    setStatus('Sign in required', 'loading');
    return;
  }

  userEmail.textContent = currentUser.email;
  accountControls.hidden = false;
  authShell.hidden = true;
  appShell.hidden = false;
  setStatus('Connecting...', 'loading');
  await loadNodes();
  restoreWorkspaceState();
}

function setAuthMode(mode) {
  authMode = mode;
  const signingUp = mode === 'signup';
  authTitle.textContent = signingUp ? 'Create your account' : 'Sign in to your workspace';
  authDescription.textContent = signingUp
    ? 'Use your email to create a private MyMain workspace.'
    : 'Your nodes and log entries are private to your account.';
  authSubmit.textContent = signingUp ? 'Create account' : 'Sign in';
  authModeButton.textContent = signingUp ? 'Already have an account? Sign in' : 'Create an account';
  password.autocomplete = signingUp ? 'new-password' : 'current-password';
  setMessage(authMessage, '');
}

authModeButton.onclick = () => setAuthMode(authMode === 'signin' ? 'signup' : 'signin');

authForm.onsubmit = async event => {
  event.preventDefault();
  authSubmit.disabled = true;
  setMessage(authMessage, authMode === 'signup' ? 'Creating account...' : 'Signing in...');

  const credentials = { email: email.value.trim(), password: password.value };
  let result;
  if (authMode === 'signup') {
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    result = await db.auth.signUp({
      ...credentials,
      options: { emailRedirectTo: redirectUrl }
    });
  } else {
    result = await db.auth.signInWithPassword(credentials);
  }

  authSubmit.disabled = false;
  if (result.error) {
    setMessage(authMessage, result.error.message, 'error');
    return;
  }

  if (authMode === 'signup' && !result.data.session) {
    setMessage(authMessage, 'Check your email to confirm your account, then sign in.');
    return;
  }
  authForm.reset();
};

signOutButton.onclick = async () => {
  const { error } = await db.auth.signOut();
  if (error) alert(error.message);
};

newRootButton.onclick = () => {
  rootForm.hidden = false;
  rootName.focus();
};

cancelRootButton.onclick = () => {
  rootForm.reset();
  rootForm.hidden = true;
  newRootButton.focus();
};

rootForm.onsubmit = async event => {
  event.preventDefault();
  const name = rootName.value.trim();
  if (!name) return;
  const submitButton = rootForm.querySelector('[type="submit"]');
  submitButton.disabled = true;

  const { error } = await db.rpc('mymain_create_root', { root_name: name });
  submitButton.disabled = false;
  if (error) return alert(error.message);

  rootForm.reset();
  rootForm.hidden = true;
  await loadNodes();
};

cancelEmbedButton.onclick = () => embedDialog.close();
embedDialog.addEventListener('close', () => {
  embedParentId = null;
  embedForm.reset();
  setMessage(embedMessage, '');
});

embedForm.onsubmit = async event => {
  event.preventDefault();
  const parent = nodes.find(node => node.id === embedParentId && node.node_type === 'node');
  if (!parent) return embedDialog.close();

  let url;
  try {
    url = new URL(embedUrl.value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    return setMessage(embedMessage, 'Enter a complete address beginning with http:// or https://.', 'error');
  }

  const name = embedName.value.trim();
  if (!name) return;
  const submitButton = embedForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  setMessage(embedMessage, 'Creating page...');
  const { data, error } = await db
    .from('mymain_nodes')
    .insert({
      parent_id: parent.id,
      name,
      node_type: 'embed',
      depth: parent.depth + 1,
      content: url.href
    })
    .select('id')
    .single();
  submitButton.disabled = false;

  if (error) {
    const schemaOutdated = error.message.includes('mymain_nodes_node_type_check');
    const message = schemaOutdated
      ? 'Database update required: run the latest supabase-schema.sql in the Supabase SQL Editor, then try again.'
      : error.message;
    return setMessage(embedMessage, message, 'error');
  }
  embedDialog.close();
  await loadNodes();
  selectNode(data.id);
};

cancelGoogleWorkspaceButton.onclick = () => googleWorkspaceDialog.close();
googleWorkspaceDialog.addEventListener('close', () => {
  googleWorkspaceParentId = null;
  googleWorkspaceForm.reset();
  setMessage(googleWorkspaceMessage, '');
});
googleWorkspaceForm.onsubmit = async event => {
  event.preventDefault();
  const parent = nodes.find(node => node.id === googleWorkspaceParentId && node.node_type === 'node');
  if (!parent) return googleWorkspaceDialog.close();
  const settings = {
    name: googleWorkspaceName.value.trim(),
    fullTitle: googleWorkspaceFullTitle.value.trim(),
    template: googleWorkspaceTemplate.value,
    starterDocs: googleWorkspaceStarterDocs.checked
  };
  if (!settings.name) return;
  const submitButton = googleWorkspaceForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  setMessage(googleWorkspaceMessage, 'Connecting to Google Drive...');
  try {
    const root = await createGoogleWorkspace(parent, settings);
    googleWorkspaceDialog.close();
    alert(`${root.name} was created in Google Drive and linked in MyMain.`);
  } catch (error) {
    setMessage(googleWorkspaceMessage, error.message || 'The Google workspace could not be created.', 'error');
  } finally {
    submitButton.disabled = false;
  }
};

nodeContentForm.onsubmit = async event => {
  event.preventDefault();
  const node = nodes.find(item => item.id === selectedNodeId && item.node_type !== 'log');
  if (!node) return;

  if (nodeContentEditor.textContent.length > 10000) return setMessage(nodeContentMessage, 'Notes must be 10,000 characters or fewer.', 'error');
  nodeContent.value = serializeEditor(nodeContentEditor);
  const submitButton = nodeContentForm.querySelector('.log-actions [type="submit"]');
  submitButton.disabled = true;
  setMessage(nodeContentMessage, 'Saving...');
  const { data, error } = await db
    .from('mymain_nodes')
    .update({ content: nodeContent.value })
    .eq('id', node.id)
    .select('content')
    .single();
  submitButton.disabled = false;

  if (error) return setMessage(nodeContentMessage, error.message, 'error');
  node.content = data.content;
  setMessage(nodeContentMessage, 'Saved');
};

linkForm.onsubmit = async event => {
  event.preventDefault();
  const node = nodes.find(item => item.id === selectedNodeId && item.node_type === 'links');
  if (!node) return;

  let url;
  try {
    url = new URL(linkUrl.value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    return setMessage(linkMessage, 'Enter a complete address beginning with http:// or https://.', 'error');
  }

  const submitButton = linkForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  setMessage(linkMessage, 'Saving...');
  const { error } = await db.from('mymain_links').insert({
    node_id: node.id,
    label: linkLabel.value.trim(),
    url: url.href
  });
  submitButton.disabled = false;
  if (error) return setMessage(linkMessage, error.message, 'error');

  linkForm.reset();
  setMessage(linkMessage, 'Saved');
  await loadLinks(node.id);
  linkLabel.focus();
};

logForm.onsubmit = async event => {
  event.preventDefault();
  const node = nodes.find(item => item.id === selectedNodeId && item.node_type === 'log');
  const plainBody = logEntryEditor.textContent.trim();
  const hasCheckbox = Boolean(logEntryEditor.querySelector('input[type="checkbox"]'));
  if (plainBody.length > 5000) return setMessage(logMessage, 'Log entries must be 5,000 characters or fewer.', 'error');
  const body = serializeEditor(logEntryEditor);
  if (!node || (!plainBody && !hasCheckbox)) return;

  const submitButton = logForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  setMessage(logMessage, 'Saving...');
  const { error } = await db.from('mymain_log_entries').insert({ node_id: node.id, body });
  submitButton.disabled = false;
  if (error) return setMessage(logMessage, error.message, 'error');

  logForm.reset();
  logEntryEditor.replaceChildren();
  setMessage(logMessage, 'Saved');
  await loadLogEntries(node.id);
  logEntryEditor.focus();
};

nodeActionsButton.onclick = event => {
  if (selectedNodeId) openNodeMenu(selectedNodeId, event.currentTarget);
};
logActionsButton.onclick = event => {
  if (selectedNodeId) openNodeMenu(selectedNodeId, event.currentTarget);
};
embedActionsButton.onclick = event => {
  if (selectedNodeId) openNodeMenu(selectedNodeId, event.currentTarget);
};

addChildAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) addChild(node);
};
addLogAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) addSpecialNode(node, 'log');
};
addLinksAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) addSpecialNode(node, 'links');
};
addEmbedAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) openEmbedDialog(node);
};
createGoogleWorkspaceAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) openGoogleWorkspaceDialog(node);
};
editNodeAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) renameNode(node);
};
deleteNodeAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) deleteNode(node);
};

document.addEventListener('click', event => {
  if (!tree.contains(event.target)) {
    tree.querySelectorAll('.tree-node.touch-open').forEach(node => node.classList.remove('touch-open'));
  }
  if (!nodeMenu.hidden && !nodeMenu.contains(event.target) && !event.target.closest('.tree-actions, .secondary-button')) {
    closeNodeMenu();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeNodeMenu();
    tree.querySelectorAll('.tree-node.touch-open').forEach(node => node.classList.remove('touch-open'));
  }
});
window.addEventListener('blur', closeNodeMenu);

async function initialize() {
  if (!db) {
    setStatus('Supabase unavailable', 'error');
    setMessage(authMessage, 'The Supabase library could not be loaded.', 'error');
    return;
  }

  const { data, error } = await db.auth.getSession();
  if (error) {
    setStatus('Authentication error', 'error');
    setMessage(authMessage, error.message, 'error');
    return;
  }
  await handleSession(data.session);
  db.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => handleSession(session), 0);
  });
}

initialize();
