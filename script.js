const app = document.getElementById('app');
let data = JSON.parse(localStorage.getItem('levels')||'[]');
let selectedDate = new Date().toISOString().slice(0,10);

// Trading pairs - default options plus custom
const defaultPairs = ['NQ', 'BTC', 'ETH'];
let customPairs = JSON.parse(localStorage.getItem('customPairs')||'[]');

// Enhanced error handling for localStorage operations
function saveData(){
  try {
    localStorage.setItem('levels', JSON.stringify(data));
    localStorage.setItem('customPairs', JSON.stringify(customPairs));
  } catch (error) {
    console.error('Failed to save data:', error);
    toast('Failed to save data');
  }
}

// Enhanced error handling for loading data
function loadData(){
  try {
    data = JSON.parse(localStorage.getItem('levels')||'[]');
    customPairs = JSON.parse(localStorage.getItem('customPairs')||'[]');
  } catch (error) {
    console.error('Failed to load data:', error);
    data = [];
    customPairs = [];
    toast('Failed to load saved data');
  }
}

// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility function to validate file types
function isValidImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
}

// Utility function to validate price
function isValidPrice(price) {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num < 10000000; // Reasonable price range
}

// Utility function to validate trading pair
function isValidPair(pair) {
  return /^[A-Z0-9]{1,10}$/.test(pair.trim().toUpperCase());
}

function toast(msg){
  const t=document.getElementById('toast');
  if (t) {
    t.textContent=escapeHtml(msg);
    t.style.display='block';
    setTimeout(()=>t.style.display='none',3000);
  }
}

function renderStats(){
  const total=data.length;
  const hits=data.filter(l=>getStatus(l)==='hit').length;
  const misses=total-hits;
  const hitRate=total?((hits/total*100).toFixed(1)):'0.0';
  
  return `
    <div class="stats">
      <div class="stats-header">
        <div class="logo">TOPTICK</div>
        <div class="title">Trading Performance</div>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total Levels</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #22c55e;">${hits}</div>
          <div class="stat-label">Hits</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #ef4444;">${misses}</div>
          <div class="stat-label">Misses</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${hitRate}%</div>
          <div class="stat-label">Hit Rate</div>
        </div>
      </div>
    </div>`;
}

function getStatus(level){
  return level.statusHistory[level.statusHistory.length-1].status;
}

function toggleStatus(id){
  const level=data.find(l=>l.id===id);
  if (!level) return;
  const cur=getStatus(level);
  const next=cur==='hit'?'no-hit':'hit';
  level.statusHistory.push({status:next,time:new Date().toISOString()});
  saveData();
  render();
  toast(next === 'hit' ? 'Level marked as Hit!' : 'Level marked as Miss');
}

function renderLevels(){
  const list=data.filter(l=>l.date===selectedDate);
  if(!list.length) {
    return `
      <div class="levels">
        <div class="empty-state">
          <h3>No levels for this date</h3>
          <p>Add your first trading level by tapping the + button below</p>
        </div>
      </div>`;
  }
  
  return `<div class="levels">
    ${list.map(l=>{
      const status=getStatus(l)==='hit'?'Hit':'Miss';
      const statusClass=getStatus(l)==='hit'?'hit':'miss';
      const timeAdded = new Date(l.statusHistory[0].time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div class="level-item ${l.color}">
          <div class="level-pair">${escapeHtml(l.pair || 'N/A')}</div>
          <div class="level-price">$${escapeHtml(l.price.toLocaleString())}</div>
          <div class="level-status">
            Status: <button class="toggle-status ${statusClass}" data-id="${l.id}">${status}</button>
          </div>
          ${l.note?`<div style="margin:0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 8px;">Note: ${escapeHtml(l.note)}</div>`:''}
          ${l.img?`<img class="thumb" src="${l.img}" alt="Level chart" loading="lazy"/>`:''}
          <div style="margin-top: 1rem; font-size: 0.8rem; color: #888; text-align: right;">Added at ${timeAdded}</div>
        </div>`;
    }).join('')}
  </div>`;
}

function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}

function renderCalendar(){
  const d=new Date(selectedDate);
  const y=d.getFullYear(), m=d.getMonth();
  
  let html=`
    <div class="calendar">
      <div class="calendar-header">
        <button class="nav-btn" onclick="navigateMonth(-1)">← Prev</button>
        <div class="calendar-title">${d.toLocaleString('default',{month:'long',year:'numeric'})}</div>
        <button class="nav-btn" onclick="navigateMonth(1)">Next →</button>
      </div>
      <div class="calendar-actions">
        <button class="view-all-btn" onclick="showAllLevels()">View All Levels</button>
      </div>
      <div class="calendar-grid">`;
  
  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    html += `<div class="day-header">${day}</div>`;
  });
  
  const first=new Date(y,m,1).getDay();
  for(let i=0;i<first;i++) html+='<div class="calendar-cell empty"></div>';
  
  const days=daysInMonth(y,m);
  for(let day=1;day<=days;day++){
    const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const sel=date===selectedDate?'selected':'';
    const hasData = data.some(l => l.date === date);
    const dataClass = hasData ? 'has-data' : '';
    html+=`<div class="calendar-cell ${sel} ${dataClass}" data-date="${date}">${day}</div>`;
  }
  html+='</div></div>';
  return html;
}

function selectDate(date){
  selectedDate=date;
  render();
  toast(`Switched to ${new Date(date).toLocaleDateString()}`);
}

// Get all available pairs (default + custom)
function getAllPairs() {
  return [...defaultPairs, ...customPairs];
}

// Add custom pair
function addCustomPair(pair) {
  const cleanPair = pair.trim().toUpperCase();
  if (!isValidPair(cleanPair)) {
    toast('Invalid pair format (use letters/numbers only)');
    return false;
  }
  if (getAllPairs().includes(cleanPair)) {
    toast('Pair already exists');
    return false;
  }
  customPairs.push(cleanPair);
  saveData();
  return true;
}

// Fixed: Create modal only once to improve performance
let modalCreated = false;
function createModal() {
  if (modalCreated) return;
  document.body.insertAdjacentHTML('beforeend',`
    <div id="modal" class="modal">
      <div class="modal-content">
        <h3>Add Trading Level</h3>
        <form id="levelForm">
          <div class="pair-selector">
            <input name="customPair" type="text" placeholder="Add Custom Pair (e.g. SPY)" style="display: none;">
          </div>
          <div class="pair-buttons" id="pairButtons">
            ${getAllPairs().map(pair => 
              `<button type="button" class="pair-btn" data-pair="${pair}">${pair}</button>`
            ).join('')}
            <button type="button" class="pair-btn" id="addPairBtn">+</button>
          </div>
          <input name="price" type="number" placeholder="Price (e.g. 4250.00)" step="0.01" required>
          <select name="color" required>
            <option value="">Select Level Type</option>
            <option value="red">Red Level</option>
            <option value="orange">Orange Level</option>
          </select>
          <textarea name="note" placeholder="Notes (optional)" maxlength="500" rows="3"></textarea>
          <input name="image" type="file" accept="image/*">
          <div style="text-align:center;margin-top:1rem;">
            <button type="submit">Save Level</button>
            <button type="button" id="cancelBtn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `);
  modalCreated = true;
  
  // Add event listeners
  document.getElementById('levelForm').addEventListener('submit', addLevel);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  
  // Pair selection logic
  let selectedPair = '';
  let showingCustomInput = false;
  
  function updatePairButtons() {
    const pairButtons = document.getElementById('pairButtons');
    pairButtons.innerHTML = getAllPairs().map(pair => 
      `<button type="button" class="pair-btn ${selectedPair === pair ? 'active' : ''}" data-pair="${pair}">${pair}</button>`
    ).join('') + '<button type="button" class="pair-btn" id="addPairBtn">➕</button>';
    
    // Re-attach event listeners
    attachPairListeners();
  }
  
  function attachPairListeners() {
    document.querySelectorAll('.pair-btn[data-pair]').forEach(btn => {
      btn.onclick = () => {
        selectedPair = btn.dataset.pair;
        document.querySelectorAll('.pair-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        hideCustomInput();
      };
    });
    
    const addBtn = document.getElementById('addPairBtn');
    if (addBtn) {
      addBtn.onclick = () => {
        if (showingCustomInput) {
          const input = document.querySelector('input[name="customPair"]');
          const newPair = input.value.trim();
          if (newPair && addCustomPair(newPair)) {
            selectedPair = newPair.toUpperCase();
            updatePairButtons();
            hideCustomInput();
            toast('Custom pair added!');
          }
        } else {
          showCustomInput();
        }
      };
    }
  }
  
  function showCustomInput() {
    const input = document.querySelector('input[name="customPair"]');
    input.style.display = 'block';
    input.focus();
    document.getElementById('addPairBtn').textContent = '✓';
    showingCustomInput = true;
  }
  
  function hideCustomInput() {
    const input = document.querySelector('input[name="customPair"]');
    input.style.display = 'none';
    input.value = '';
    document.getElementById('addPairBtn').textContent = '+';
    showingCustomInput = false;
  }
  
  // Initialize
  attachPairListeners();
  
  // Store selectedPair globally for form submission
  window.getSelectedPair = () => selectedPair;
}

function render(){
  app.innerHTML = renderStats() + renderPerformanceCharts() + renderCalendar() + renderLevels() + `
    <button class="add-btn" id="addBtn" title="Add new level">+</button>
    <div id="toast" class="toast"></div>
    <div class="footer">
      <div class="footer-credit">Created by Strife</div>
    </div>
  `;
  
  // Add event listeners using event delegation
  app.addEventListener('click', handleAppClick);
}

// Event delegation handler for better performance and security
function handleAppClick(e) {
  if (e.target.classList.contains('toggle-status')) {
    const id = parseInt(e.target.dataset.id);
    toggleStatus(id);
  } else if (e.target.classList.contains('calendar-cell') && e.target.dataset.date && !e.target.classList.contains('empty')) {
    selectDate(e.target.dataset.date);
  } else if (e.target.id === 'addBtn') {
    openModal();
  }
}

function openModal(){
  createModal();
  document.getElementById('modal').style.display='flex';
  // Focus on first input for better UX
  setTimeout(() => {
    const firstPair = document.querySelector('.pair-btn[data-pair]');
    if (firstPair) firstPair.click();
  }, 100);
}

function closeModal(){
  document.getElementById('modal').style.display='none';
  document.getElementById('levelForm').reset();
  // Reset pair selection
  if (window.getSelectedPair) {
    document.querySelectorAll('.pair-btn').forEach(b => b.classList.remove('active'));
  }
}

function addLevel(e){
  e.preventDefault();
  const form=e.target;
  const price=form.price.value;
  const color=form.color.value;
  const note=form.note.value;
  const file=form.image.files[0];
  const pair = window.getSelectedPair ? window.getSelectedPair() : '';
  
  // Enhanced input validation
  if (!pair) {
    toast('Please select a trading pair');
    return;
  }
  
  if(!isValidPrice(price)) {
    toast('Please enter a valid price');
    return;
  }
  
  if(!color) {
    toast('Please select a level type');
    return;
  }
  
  if(file && !isValidImageFile(file)) {
    toast('Please select a valid image file (JPEG, PNG, GIF, WebP)');
    return;
  }
  
  if(file && file.size > 5 * 1024 * 1024) { // 5MB limit
    toast('Image file too large (max 5MB)');
    return;
  }
  
  const reader=file?new FileReader():null;
  const id=Date.now();
  
  const finish=(img)=>{
    data.push({
      id,
      pair,
      price: parseFloat(price),
      color,
      note: note.trim(),
      img,
      date:selectedDate,
      statusHistory:[{status:'no-hit',time:new Date().toISOString()}]
    });
    saveData();
    closeModal();
    toast('Level saved successfully!');
    render();
  };
  
  if(reader){
    reader.onerror = () => {
      toast('Failed to read image file');
    };
    reader.onload=()=>finish(reader.result);
    reader.readAsDataURL(file);
  } else {
    finish('');
  }
}

// Fixed: Proper cleanup and error handling for export
function exportData(format){
  try {
    const zip=new JSZip();
    const levels=data.map(l=>({...l,img:''})); // Remove img data for JSON/CSV
    
    if(format==='json'){
      zip.file('toptick-levels.json',JSON.stringify(levels,null,2));
      toast('Preparing JSON export...');
    } else {
      const csv=['id,pair,price,color,note,date,status,created'];
      levels.forEach(l=>{
        const escapedNote = (l.note||'').replace(/"/g,'""').replace(/,/g,';');
        const created = l.statusHistory[0]?.time || '';
        csv.push(`${l.id},${l.pair||''},${l.price},${l.color},"${escapedNote}",${l.date},${getStatus(l)},${created}`);
      });
      zip.file('toptick-levels.csv',csv.join('\n'));
      toast('Preparing CSV export...');
    }
    
    // Add images to zip
    let imageCount = 0;
    data.forEach(l=>{
      if(l.img && l.img.startsWith('data:image/')){
        const base=l.img.split(',')[1];
        if(base) {
          const extension = l.img.includes('jpeg') || l.img.includes('jpg') ? 'jpg' : 'png';
          zip.file(`charts/level_${l.id}_${l.pair||'unknown'}_${l.price}.${extension}`,base,{base64:true});
          imageCount++;
        }
      }
    });
    
    zip.generateAsync({type:'blob'}).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toptick-export-${new Date().toISOString().slice(0,10)}.zip`;
      a.click();
      
      toast(`Export complete! ${levels.length} levels, ${imageCount} charts`);
      // Fixed: Clean up object URL to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }).catch(error => {
      console.error('Export failed:', error);
      toast('Export failed');
    });
  } catch (error) {
    console.error('Export failed:', error);
    toast('Export failed');
  }
}

// Navigation functions
function navigateMonth(direction) {
  const d = new Date(selectedDate);
  d.setMonth(d.getMonth() + direction);
  selectedDate = d.toISOString().slice(0,10);
  render();
}

// Show all levels view
function showAllLevels() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  const sortedLevels = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  modal.innerHTML = `
    <div class="modal-content all-levels-modal">
      <div class="modal-header">
        <h3>All Trading Levels</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div class="all-levels-content">
        ${sortedLevels.length ? sortedLevels.map(level => {
          const status = getStatus(level);
          const statusClass = status === 'hit' ? 'hit' : 'miss';
          const timeAdded = new Date(level.statusHistory[0].time).toLocaleString();
          
          return `
            <div class="level-summary ${level.color}">
              <div class="level-summary-header">
                <span class="level-pair">${escapeHtml(level.pair || 'N/A')}</span>
                <span class="level-date">${new Date(level.date).toLocaleDateString()}</span>
                <span class="level-status-badge ${statusClass}">${status === 'hit' ? 'Hit' : 'Miss'}</span>
              </div>
              <div class="level-summary-price">$${escapeHtml(level.price.toLocaleString())}</div>
              ${level.note ? `<div class="level-summary-note">Note: ${escapeHtml(level.note)}</div>` : ''}
              <div class="level-summary-time">Added: ${timeAdded}</div>
            </div>
          `;
        }).join('') : '<div class="empty-state"><p>No levels found</p></div>'}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Render performance charts
function renderPerformanceCharts() {
  const chartData = getPerformanceChartData();
  
  return `
    <div class="charts-section">
      <h3>Performance Charts</h3>
      <div class="charts-container">
        <div class="chart">
          <h4>Hit Rate Over Time</h4>
          <div class="chart-bars">
            ${chartData.map(item => `
              <div class="chart-bar-container">
                <div class="chart-bar hit-rate" style="height: ${item.hitRate}%"></div>
                <div class="chart-label">${item.label}</div>
                <div class="chart-value">${item.hitRate.toFixed(1)}%</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chart">
          <h4>Total Levels Over Time</h4>
          <div class="chart-bars">
            ${chartData.map(item => {
              const maxTotal = Math.max(...chartData.map(d => d.total));
              const height = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
              return `
                <div class="chart-bar-container">
                  <div class="chart-bar total-levels" style="height: ${height}%"></div>
                  <div class="chart-label">${item.label}</div>
                  <div class="chart-value">${item.total}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Get performance chart data (weekly for last 8 weeks)
function getPerformanceChartData() {
  const weeks = [];
  const now = new Date();
  
  // Get last 8 weeks
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekData = data.filter(level => {
      const levelDate = new Date(level.date);
      return levelDate >= weekStart && levelDate <= weekEnd;
    });
    
    const hits = weekData.filter(l => getStatus(l) === 'hit').length;
    const total = weekData.length;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    weeks.push({
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      total,
      hits,
      hitRate
    });
  }
  
  return weeks;
}

// Initialize
loadData();

// Add export buttons with new styling
document.body.insertAdjacentHTML('beforeend',`
  <div class="export-buttons">
    <button onclick="exportData('json')" title="Export as JSON">JSON</button>
    <button onclick="exportData('csv')" title="Export as CSV">CSV</button>
  </div>
`);

render();

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installBtn = document.createElement('button');
  installBtn.textContent = '📱 Install App';
  installBtn.style.cssText = 'position:fixed;top:calc(0.5rem + env(safe-area-inset-top));left:0.5rem;background:linear-gradient(135deg, #1e90ff 0%, #0066cc 100%);color:#fff;border:none;padding:8px 12px;border-radius:10px;font-size:12px;z-index:1000;font-weight:600;border:1px solid rgba(255,255,255,0.1);';
  installBtn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.remove();
      toast(outcome === 'accepted' ? '✅ App installed!' : '❌ Install cancelled');
    }
  };
  document.body.appendChild(installBtn);
});

// Prevent accidental refresh on mobile
let touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', e => {
  const touchY = e.touches[0].clientY;
  const touchDiff = touchY - touchStartY;
  
  // Prevent pull-to-refresh
  if (touchDiff > 0 && window.scrollY === 0) {
    e.preventDefault();
  }
}, { passive: false });

// Enhanced keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    openModal();
  }
});

// Update manifest theme color dynamically
document.querySelector('meta[name="theme-color"]').content = '#000000';
