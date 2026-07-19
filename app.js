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
const nodeMenu = document.getElementById('nodeMenu');
const addChildAction = document.getElementById('addChildAction');
const editNodeAction = document.getElementById('editNodeAction');
const deleteNodeAction = document.getElementById('deleteNodeAction');

let authMode = 'signin';
let currentUser = null;
let nodes = [];
let selectedNodeId = null;
let menuNodeId = null;
const expandedNodeIds = new Set();

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
  editor.focus();
  const range = editorSelections.get(editor);
  if (!range || !editor.contains(range.commonAncestorContainer)) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
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
    };
  });
  const sizeSelect = toolbar.querySelector('select[data-command="fontSize"]');
  sizeSelect.onchange = () => {
    restoreEditorSelection(editor);
    const size = { small: '2', normal: '3', large: '5', 'x-large': '7' }[sizeSelect.value];
    document.execCommand('fontSize', false, size);
    rememberEditorSelection(editor);
    sizeSelect.value = 'normal';
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
  emptyTree.hidden = roots.length > 0;
  roots.forEach(root => appendNode(root));
}

function appendNode(node) {
  const children = getChildren(node.id);
  const row = document.createElement('div');
  row.className = 'tree-row';
  row.style.setProperty('--indent', `${(node.depth - 1) * 20}px`);

  const itemButton = document.createElement('button');
  itemButton.type = 'button';
  itemButton.className = 'tree-item';
  itemButton.title = node.name;
  itemButton.setAttribute('aria-current', String(node.id === selectedNodeId));
  if (children.length) {
    itemButton.setAttribute('aria-expanded', String(expandedNodeIds.has(node.id)));
  }

  const chevron = document.createElement('span');
  chevron.className = 'tree-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = children.length ? '>' : '';

  const label = document.createElement('span');
  label.textContent = node.name;
  itemButton.append(chevron);
  if (node.node_type !== 'log') {
    const icon = document.createElement('span');
    icon.className = 'node-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '•';
    itemButton.append(icon);
  }
  itemButton.append(label);
  itemButton.onclick = () => selectNode(node.id, true);

  const actionsButton = document.createElement('button');
  actionsButton.type = 'button';
  actionsButton.className = 'tree-actions';
  actionsButton.textContent = '⋮';
  actionsButton.setAttribute('aria-label', `Actions for ${node.name}`);
  actionsButton.onclick = event => openNodeMenu(node.id, event.currentTarget);
  actionsButton.hidden = node.node_type === 'links';

  row.append(itemButton, actionsButton);
  tree.append(row);

  if (expandedNodeIds.has(node.id)) {
    children.forEach(child => appendNode(child));
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
    logView.hidden = false;
    logTitle.textContent = node.name;
    loadLogEntries(node.id);
  } else if (node.node_type === 'links') {
    nodeView.hidden = true;
    logView.hidden = true;
    linksView.hidden = false;
    const parent = nodes.find(item => item.id === node.parent_id);
    linksTitle.textContent = parent ? parent.name : 'Links';
    loadLinks(node.id);
  } else {
    logView.hidden = true;
    linksView.hidden = true;
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
  welcome.hidden = false;
  saveWorkspaceState();
  renderTree();
}

async function loadNodes() {
  const { error: ensureError } = await db.rpc('mymain_ensure_links');
  if (ensureError) {
    setStatus('Database update needed', 'error');
    emptyTree.hidden = false;
    emptyTree.textContent = ensureError.message;
    return;
  }

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
  addChildAction.hidden = node.depth >= 3 || node.node_type === 'links';
  nodeMenu.hidden = false;

  const rect = anchor.getBoundingClientRect();
  const menuWidth = 180;
  const menuHeight = !addChildAction.hidden ? 136 : 96;
  nodeMenu.style.left = `${Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))}px`;
  nodeMenu.style.top = `${Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - menuHeight - 8))}px`;
  (!addChildAction.hidden ? addChildAction : editNodeAction).focus();
}

function closeNodeMenu() {
  nodeMenu.hidden = true;
  menuNodeId = null;
}

async function addChild(node) {
  if (node.depth >= 3 || node.node_type === 'links') return;
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
    authShell.hidden = false;
    setStatus('Sign in required', 'loading');
    return;
  }

  userEmail.textContent = currentUser.email;
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

addChildAction.onclick = () => {
  const node = nodes.find(item => item.id === menuNodeId);
  closeNodeMenu();
  if (node) addChild(node);
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
  if (!nodeMenu.hidden && !nodeMenu.contains(event.target) && !event.target.closest('.tree-actions, .secondary-button')) {
    closeNodeMenu();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeNodeMenu();
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
