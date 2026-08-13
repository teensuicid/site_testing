import { WalletManager } from './wallet.js';
import { SwapManager } from './swap.js';
import { PaperTrading } from './paper-trading.js';
import { Dashboard } from './dashboard.js';

class CryptoSwapApp {
    constructor() {
        this.wallet = new WalletManager();
        this.swap = new SwapManager(this.wallet);
        this.paper = new PaperTrading();
        this.dashboard = new Dashboard();
        this.currentTab = 'swap';
        this.transactions = [];
        
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupWalletConnection();
        this.setupSwapEvents();
        this.setupPaperTrading();
        this.setupDashboard();
        this.loadGasPrice();
        
        // Auto refresh gas every 30 seconds
        setInterval(() => this.loadGasPrice(), 30000);
    }

    setupTabs() {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tab);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const tabElement = document.getElementById(`${tab}Tab`);
        if (tabElement) {
            tabElement.classList.remove('hidden');
        }
        
        if (tab === 'dashboard') {
            this.dashboard.update();
        }
        
        if (tab === 'history') {
            this.renderHistory();
        }
    }

    setupWalletConnection() {
        const connectBtn = document.getElementById('connectWallet');
        const disconnectBtn = document.getElementById('disconnectWallet');
        
        connectBtn.addEventListener('click', async () => {
            try {
                await this.wallet.connect();
                this.updateWalletUI();
            } catch (error) {
                console.error('Wallet connection failed:', error);
                this.showStatus('Failed to connect wallet. Please try again.', 'error');
            }
        });
        
        disconnectBtn.addEventListener('click', () => {
            this.wallet.disconnect();
            this.updateWalletUI();
        });
        
        if (this.wallet.isConnected()) {
            this.updateWalletUI();
        }
    }

    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        
        if (this.wallet.isConnected()) {
            const address = this.wallet.getAddress();
            const balance = this.wallet.getBalance();
            
            connectBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            document.getElementById('walletAddress').textContent = 
                `${address.slice(0, 6)}...${address.slice(-4)}`;
            document.getElementById('walletBalance').textContent = 
                `${balance} ETH`;
                
            this.swap.updateBalances();
        } else {
            connectBtn.classList.remove('hidden');
            walletInfo.classList.add('hidden');
        }
    }

    setupSwapEvents() {
        document.getElementById('swapTokens').addEventListener('click', () => {
            this.swap.swapTokens();
        });
        
        document.getElementById('useMax').addEventListener('click', () => {
            this.swap.useMax();
        });
        
        document.querySelectorAll('.slippage-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.slippage-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('customSlippage').value = '';
            });
        });
        
        document.getElementById('customSlippage').addEventListener('input', (e) => {
            if (e.target.value) {
                document.querySelectorAll('.slippage-btn').forEach(b => b.classList.remove('active'));
            }
        });
        
        document.getElementById('fromAmount').addEventListener('input', () => {
            this.swap.calculateOutput();
        });
        
        document.getElementById('fromToken').addEventListener('change', () => {
            this.swap.updateBalances();
            this.swap.calculateOutput();
        });
        
        document.getElementById('toToken').addEventListener('change', () => {
            this.swap.updateBalances();
            this.swap.calculateOutput();
        });
        
        document.getElementById('swapForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.executeSwap();
        });
    }

    async executeSwap() {
        const swapButton = document.getElementById('swapButton');
        const buttonText = document.getElementById('swapButtonText');
        
        try {
            swapButton.disabled = true;
            buttonText.textContent = '⏳ Swapping...';
            this.showStatus('Processing swap...', 'loading');
            
            const result = await this.swap.executeSwap();
            
            if (result.success) {
                this.showStatus(`✅ Swap successful! Received ${result.amountOut} tokens`, 'success');
                this.addTransaction({
                    type: 'swap',
                    from: result.fromAmount,
                    to: result.toAmount,
                    hash: result.hash,
                    timestamp: Date.now()
                });
                this.renderHistory();
                this.dashboard.update();
            } else {
                this.showStatus(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Swap failed:', error);
            this.showStatus(`❌ ${error.message || 'Swap failed. Please try again.'}`, 'error');
        } finally {
            swapButton.disabled = false;
            buttonText.textContent = 'Swap';
        }
    }

    setupPaperTrading() {
        const executeBtn = document.getElementById('executePaperTrade');
        const resetBtn = document.getElementById('resetPaper');
        
        document.querySelectorAll('.trade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.trade-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        executeBtn.addEventListener('click', () => {
            const type = document.querySelector('.trade-btn.active').dataset.type;
            const asset = document.getElementById('paperAsset').value;
            const amount = parseFloat(document.getElementById('paperAmount').value);
            const price = parseFloat(document.getElementById('paperPrice').value) || 0;
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            const result = this.paper.executeTrade(type, asset, amount, price);
            
            if (result.success) {
                this.showStatus(`✅ Paper trade executed: ${type} ${amount} ${asset}`, 'success');
                this.updatePaperUI();
                this.dashboard.update();
            } else {
                this.showStatus(`❌ ${result.error}`, 'error');
            }
        });
        
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset your paper trading balance?')) {
                this.paper.resetBalance();
                this.updatePaperUI();
                this.showStatus('✅ Paper balance reset', 'success');
            }
        });
        
        this.updatePaperUI();
    }

    updatePaperUI() {
        const balance = this.paper.getBalance();
        document.getElementById('paperBalance').textContent = `$${balance.toFixed(2)}`;
        this.renderPaperPositions();
    }

    renderPaperPositions() {
        const container = document.getElementById('paperPositions');
        const positions = this.paper.getPositions();
        
        if (positions.length === 0) {
            container.innerHTML = '<p class="empty-state">No open positions</p>';
            return;
        }
        
        container.innerHTML = positions.map(pos => `
            <div class="position-item">
                <span>${pos.asset}</span>
                <span>${pos.type === 'buy' ? '🟢 Long' : '🔴 Short'} ${pos.amount}</span>
                <span class="${pos.pnl >= 0 ? 'positive' : 'negative'}">
                    ${pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}%
                </span>
            </div>
        `).join('');
    }

    setupDashboard() {
        setInterval(() => this.dashboard.update(), 5000);
    }

    addTransaction(tx) {
        this.transactions.unshift(tx);
        if (this.transactions.length > 50) {
            this.transactions = this.transactions.slice(0, 50);
        }
    }

    renderHistory() {
        const container = document.getElementById('transactionHistory');
        
        if (this.transactions.length === 0) {
            container.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }
        
        container.innerHTML = this.transactions.map(tx => `
            <div class="info-row">
                <span>${tx.type === 'swap' ? '💱 Swap' : '📈 Trade'}</span>
                <span>${tx.from || tx.amount || ''}</span>
                <span>${tx.to || ''}</span>
                <span>${new Date(tx.timestamp).toLocaleString()}</span>
                ${tx.hash ? `<a href="https://etherscan.io/tx/${tx.hash}" target="_blank">🔗 View</a>` : ''}
            </div>
        `).join('');
    }

    async loadGasPrice() {
        try {
            const provider = this.wallet.provider;
            if (provider) {
                const gasPrice = await provider.getGasPrice();
                const gwei = parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
                document.getElementById('gasPrice').textContent = gwei.toFixed(2);
                
                const status = document.getElementById('gasStatus');
                if (gwei < 20) {
                    status.textContent = '✅ Low';
                    status.style.color = 'var(--success)';
                } else if (gwei < 40) {
                    status.textContent = '🟡 Normal';
                    status.style.color = 'var(--warning)';
                } else {
                    status.textContent = '🔴 High';
                    status.style.color = 'var(--danger)';
                }
            }
        } catch (error) {
            console.error('Failed to load gas price:', error);
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('swapStatus');
        statusEl.textContent = message;
        statusEl.className = `swap-status ${type}`;
        statusEl.classList.remove('hidden');
        
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 8000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoSwapApp();
});