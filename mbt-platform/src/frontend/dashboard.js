// MBT Dashboard JavaScript

// Global variables
let performanceChart;
let compositionChart;
let sipPerformanceChart;
let currentUser = null;
let userPortfolio = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadUserData();
    initializeCharts();
    setupEventListeners();
    checkAuthentication();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('mbt_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    // In production, validate token with backend
    currentUser = { name: 'Demo User', email: 'demo@mbt.tokens' };
    document.getElementById('user-name').textContent = currentUser.name;
}

// Initialize dashboard
function initializeDashboard() {
    // Set default section based on URL hash
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(`${hash}-section`)) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }
    
    // Set default date for SIP creation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('sip-start-date').value = tomorrow.toISOString().split('T')[0];
    
    // Initialize amount change listeners
    const amountInput = document.getElementById('investment-amount');
    if (amountInput) {
        amountInput.addEventListener('input', updateAllocationPreview);
    }
}

// Load user data
async function loadUserData() {
    try {
        // Show loading state
        document.querySelectorAll('#total-investment, #current-value, #mbt-tokens, #total-gain-loss').forEach(el => {
            el.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        });
        
        // Simulate API call (replace with actual API)
        const portfolioData = await fetchPortfolioData();
        updateDashboardData(portfolioData);
        
        // Load transactions
        await loadTransactions();
        
        // Load SIPs
        await loadSIPs();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load dashboard data');
    }
}

// Fetch portfolio data (simulated)
async function fetchPortfolioData() {
    // In production, this would call: GET /api/mbt/portfolio
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalInvested: 50000,
                currentValue: 52450,
                mbtTokens: 8.98,
                totalGainLoss: 2450,
                totalGainLossPercentage: 4.9,
                metalValues: {
                    gold: { value: 26225, gain: 1225 },
                    silver: { value: 15735, gain: 735 },
                    platinum: { value: 10490, gain: 490 }
                }
            });
        }, 1000);
    });
}

// Update dashboard with portfolio data
function updateDashboardData(data) {
    document.getElementById('total-investment').textContent = formatCurrency(data.totalInvested);
    document.getElementById('current-value').textContent = formatCurrency(data.currentValue);
    document.getElementById('mbt-tokens').textContent = data.mbtTokens.toFixed(2);
    
    const gainLossElement = document.getElementById('total-gain-loss');
    const gainLossPercentage = data.totalGainLossPercentage;
    
    gainLossElement.innerHTML = `${formatCurrency(data.totalGainLoss)} (${gainLossPercentage > 0 ? '+' : ''}${gainLossPercentage.toFixed(1)}%)`;
    gainLossElement.className = gainLossPercentage >= 0 ? 'text-success' : 'text-danger';
    
    // Update individual metal values
    document.getElementById('gold-value').textContent = formatCurrency(data.metalValues.gold.value);
    document.getElementById('silver-value').textContent = formatCurrency(data.metalValues.silver.value);
    document.getElementById('platinum-value').textContent = formatCurrency(data.metalValues.platinum.value);
    
    document.getElementById('gold-gain').textContent = `${formatCurrency(data.metalValues.gold.gain)} (${(data.metalValues.gold.gain / data.metalValues.gold.value * 100).toFixed(1)}%)`;
    document.getElementById('silver-gain').textContent = `${formatCurrency(data.metalValues.silver.gain)} (${(data.metalValues.silver.gain / data.metalValues.silver.value * 100).toFixed(1)}%)`;
    document.getElementById('platinum-gain').textContent = `${formatCurrency(data.metalValues.platinum.gain)} (${(data.metalValues.platinum.gain / data.metalValues.platinum.value * 100).toFixed(1)}%)`;
}

// Initialize charts
function initializeCharts() {
    initPerformanceChart();
    initCompositionChart();
    initSIPPerformanceChart();
}

// Initialize performance chart
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    const chartData = generatePerformanceData(30); // 30 days of data
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Portfolio Value',
                data: chartData.values,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Initialize composition chart
function initCompositionChart() {
    const ctx = document.getElementById('compositionChart');
    if (!ctx) return;

    compositionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gold (50%)', 'Silver (30%)', 'Platinum (20%)'],
            datasets: [{
                data: [50, 30, 20],
                backgroundColor: [
                    '#ffd700',  // Gold
                    '#c0c0c0',  // Silver
                    '#e5e4e2'   // Platinum
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize SIP performance chart
function initSIPPerformanceChart() {
    const ctx = document.getElementById('sipPerformanceChart');
    if (!ctx) return;

    // Placeholder for empty SIP data
    const ctx2d = ctx.getContext('2d');
    ctx2d.fillStyle = '#6c757d';
    ctx2d.font = '16px Arial';
    ctx2d.textAlign = 'center';
    ctx2d.fillText('No SIP data available', ctx.width / 2, ctx.height / 2);
}

// Generate performance data
function generatePerformanceData(days) {
    const labels = [];
    const values = [];
    const baseValue = 50000;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        
        // Simulate portfolio growth with some volatility
        const volatility = (Math.random() - 0.5) * 1000;
        const growth = i * 50; // Linear growth over time
        values.push(baseValue + growth + volatility);
    }
    
    return { labels, values };
}

// Update performance chart
function updateChart(period) {
    if (!performanceChart) return;
    
    const days = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
    };
    
    const chartData = generatePerformanceData(days[period] || 30);
    performanceChart.data.labels = chartData.labels;
    performanceChart.data.datasets[0].data = chartData.values;
    performanceChart.update();
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to corresponding nav link
    const activeLink = document.querySelector(`[href="#${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update URL hash
    window.location.hash = sectionName;
    
    // Load section-specific data
    loadSectionData(sectionName);
}

// Load data for specific section
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            // Dashboard data is already loaded
            break;
        case 'sip':
            loadSIPData();
            break;
        case 'portfolio':
            // Portfolio data is already loaded
            break;
        case 'transactions':
            loadTransactionData();
            break;
        default:
            break;
    }
}

// Update allocation preview
function updateAllocationPreview() {
    const amount = parseFloat(document.getElementById('investment-amount').value) || 0;
    
    document.getElementById('gold-amount').textContent = formatCurrency(amount * 0.50);
    document.getElementById('silver-amount').textContent = formatCurrency(amount * 0.30);
    document.getElementById('platinum-amount').textContent = formatCurrency(amount * 0.20);
}

// Setup quick amount buttons
function setQuickAmount(amount) {
    document.getElementById('investment-amount').value = amount;
    updateAllocationPreview();
}

// Load transactions
async function loadTransactions() {
    try {
        // Simulate API call
        const transactions = await fetchTransactions();
        updateTransactionsTable(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Fetch transactions (simulated)
async function fetchTransactions() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: 'TXN001',
                    date: new Date().toISOString().split('T')[0],
                    type: 'BUY',
                    amount: '₹5,000',
                    status: 'COMPLETED'
                },
                {
                    id: 'TXN002',
                    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                    type: 'SIP',
                    amount: '₹2,000',
                    status: 'COMPLETED'
                },
                {
                    id: 'TXN003',
                    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                    type: 'BUY',
                    amount: '₹3,000',
                    status: 'PENDING'
                }
            ]);
        }, 500);
    });
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No transactions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td>
                <span class="badge ${tx.type === 'BUY' ? 'bg-success' : tx.type === 'SELL' ? 'bg-danger' : 'bg-info'}">
                    ${tx.type}
                </span>
            </td>
            <td>${tx.amount}</td>
            <td>
                <span class="status-badge status-${tx.status.toLowerCase()}">${tx.status}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${tx.id}')">
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

// Load SIPs
async function loadSIPs() {
    try {
        const sips = await fetchSIPs();
        updateSIPDisplay(sips);
    } catch (error) {
        console.error('Error loading SIPs:', error);
    }
}

// Fetch SIPs (simulated)
async function fetchSIPs() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: 'SIP001',
                    amount: 2000,
                    frequency: 'MONTHLY',
                    nextDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    status: 'ACTIVE',
                    totalInvested: 10000
                }
            ]);
        }, 300);
    });
}

// Update SIP display
function updateSIPDisplay(sips) {
    const container = document.getElementById('active-sips');
    if (!container) return;
    
    if (sips.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-alt fa-3x mb-3"></i>
                <p>No active SIPs found</p>
                <button class="btn btn-primary" onclick="showCreateSIPModal()">
                    Create Your First SIP
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sips.map(sip => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <strong>₹${sip.amount.toLocaleString()}</strong><br>
                        <small class="text-muted">${sip.frequency}</small>
                    </div>
                    <div class="col-md-3">
                        <strong>Next Date</strong><br>
                        <small>${sip.nextDate}</small>
                    </div>
                    <div class="col-md-3">
                        <strong>Total Invested</strong><br>
                        <small>${formatCurrency(sip.totalInvested)}</small>
                    </div>
                    <div class="col-md-3 text-end">
                        <span class="badge bg-success">${sip.status}</span><br>
                        <button class="btn btn-sm btn-outline-danger mt-2" onclick="cancelSIP('${sip.id}')">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load SIP data for SIP section
function loadSIPData() {
    document.getElementById('sip-total-invested').textContent = '₹10,000';
    document.getElementById('sip-running-count').textContent = '1';
    document.getElementById('next-sip-date').textContent = new Date(Date.now() + 86400000).toLocaleDateString();
}

// Handle buy form submission
document.addEventListener('DOMContentLoaded', function() {
    const buyForm = document.getElementById('buy-form');
    if (buyForm) {
        buyForm.addEventListener('submit', handleBuySubmission);
    }
});

// Handle buy submission
async function handleBuySubmission(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('investment-amount').value);
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (!amount || amount < 1000) {
        showError('Minimum investment amount is ₹1,000');
        return;
    }
    
    if (!paymentMethod) {
        showError('Please select a payment method');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('#buy-form button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        
        // Simulate API call
        const result = await processMBTPurchase(amount, paymentMethod);
        
        if (result.success) {
            showSuccess('MBT tokens purchased successfully!');
            document.getElementById('buy-form').reset();
            updateAllocationPreview();
            loadUserData(); // Refresh dashboard data
        } else {
            showError(result.error || 'Purchase failed');
        }
        
    } catch (error) {
        console.error('Purchase error:', error);
        showError('Failed to process purchase');
    } finally {
        // Reset button
        const submitBtn = document.querySelector('#buy-form button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-shopping-cart me-2"></i>Buy MBT Tokens';
    }
}

// Process MBT purchase (simulated)
async function processMBTPurchase(amount, paymentMethod) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 95% success rate
            if (Math.random() > 0.05) {
                resolve({
                    success: true,
                    transactionId: `MBT-TXN-${Date.now()}`,
                    mbtAmount: amount
                });
            } else {
                resolve({
                    success: false,
                    error: 'Payment processing failed'
                });
            }
        }, 2000);
    });
}

// Create SIP
function createSIP() {
    const amount = parseFloat(document.getElementById('sip-amount').value);
    const frequency = document.getElementById('sip-frequency').value;
    const startDate = document.getElementById('sip-start-date').value;
    
    if (!amount || amount < 1000) {
        showError('Minimum SIP amount is ₹1,000');
        return;
    }
    
    if (!startDate) {
        showError('Please select a start date');
        return;
    }
    
    // Simulate SIP creation
    const sipData = {
        id: `SIP${Date.now()}`,
        amount,
        frequency,
        startDate,
        status: 'ACTIVE'
    };
    
    showSuccess('SIP created successfully!');
    document.getElementById('createSIPModal').querySelector('.btn-close').click();
    
    // Refresh SIP data
    loadSIPs();
    loadSectionData('sip');
}

// Cancel SIP
function cancelSIP(sipId) {
    if (confirm('Are you sure you want to cancel this SIP?')) {
        // Simulate SIP cancellation
        showSuccess('SIP cancelled successfully');
        loadSIPs();
    }
}

// View transaction details
function viewTransaction(transactionId) {
    // Simulate opening transaction details
    showInfo(`Viewing transaction ${transactionId}`);
}

// View metal details
function viewMetalDetails(metal) {
    const metalNames = {
        gold: 'Gold (BGT)',
        silver: 'Silver (BST)',
        platinum: 'Platinum (BPT)'
    };
    
    showInfo(`Viewing ${metalNames[metal]} details`);
}

// Export portfolio
function exportPortfolio() {
    // Simulate portfolio export
    showSuccess('Portfolio exported successfully!');
}

// Show create SIP modal
function showCreateSIPModal() {
    const modal = new bootstrap.Modal(document.getElementById('createSIPModal'));
    modal.show();
}

// Setup event listeners
function setupEventListeners() {
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            showSection(hash);
        }
    });
    
    // Handle amount input changes
    const amountInput = document.getElementById('investment-amount');
    if (amountInput) {
        amountInput.addEventListener('input', updateAllocationPreview);
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showInfo(message) {
    showToast(message, 'info');
}

function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Logout function
function logout() {
    localStorage.removeItem('mbt_token');
    localStorage.removeItem('mbt_user');
    window.location.href = 'index.html';
}

// Load transaction data for transactions section
function loadTransactionData() {
    // Transactions are already loaded in loadTransactions()
}

// Load section data for portfolio section
function loadSectionData(section) {
    switch (section) {
        case 'sip':
            loadSIPData();
            break;
        case 'transactions':
            loadTransactionData();
            break;
        default:
            break;
    }
}

// Simulate live NAV updates
setInterval(() => {
    const navElement = document.getElementById('current-nav');
    if (navElement) {
        const currentNav = parseFloat(navElement.textContent.replace(/[₹,]/g, ''));
        const change = (Math.random() - 0.5) * 50;
        const newNav = Math.max(currentNav + change, 5500);
        
        navElement.textContent = `₹${Math.round(newNav).toLocaleString()}`;
        
        const changeElement = navElement.parentNode.querySelector('.change-indicator');
        const changePercent = ((newNav - currentNav) / currentNav * 100).toFixed(2);
        changeElement.innerHTML = `${changePercent > 0 ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>'} ${changePercent > 0 ? '+' : ''}${changePercent}% today`;
        changeElement.className = `change-indicator ${changePercent > 0 ? 'positive' : 'negative'}`;
    }
}, 10000); // Update every 10 seconds