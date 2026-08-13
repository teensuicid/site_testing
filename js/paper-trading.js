export class PaperTrading {
    constructor() {
        this.balance = 10000;
        this.positions = [];
        this.trades = [];
        this.history = [];
        
        this.loadState();
    }

    loadState() {
        try {
            const saved = localStorage.getItem('paperTradingState');
            if (saved) {
                const state = JSON.parse(saved);
                this.balance = state.balance || 10000;
                this.positions = state.positions || [];
                this.history = state.history || [];
            }
        } catch (error) {
            console.error('Failed to load paper trading state:', error);
        }
    }

    saveState() {
        try {
            localStorage.setItem('paperTradingState', JSON.stringify({
                balance: this.balance,
                positions: this.positions,
                history: this.history
            }));
        } catch (error) {
            console.error('Failed to save paper trading state:', error);
        }
    }

    getBalance() {
        return this.balance;
    }

    getPositions() {
        return this.positions;
    }

    getHistory() {
        return this.history;
    }

    resetBalance() {
        this.balance = 10000;
        this.positions = [];
        this.history = [];
        this.saveState();
        return { success: true };
    }

    executeTrade(type, asset, amount, price) {
        if (!amount || amount <= 0) {
            return { success: false, error: 'Invalid amount' };
        }
        
        const currentPrice = price || this.getPrice(asset);
        const cost = amount * currentPrice;
        
        if (type === 'buy') {
            if (cost > this.balance) {
                return { success: false, error: `Insufficient paper balance. Need $${cost.toFixed(2)}, have $${this.balance.toFixed(2)}` };
            }
            
            this.balance -= cost;
            const position = {
                id: Date.now(),
                asset,
                type: 'buy',
                amount,
                entryPrice: currentPrice,
                currentPrice: currentPrice,
                pnl: 0,
                timestamp: Date.now()
            };
            this.positions.push(position);
            this.history.push({
                type: 'buy',
                asset,
                amount,
                price: currentPrice,
                timestamp: Date.now()
            });
            
        } else if (type === 'sell') {
            const positionIndex = this.positions.findIndex(p => p.asset === asset && p.type === 'buy');
            if (positionIndex === -1) {
                return { success: false, error: `No ${asset} position to sell` };
            }
            
            const position = this.positions[positionIndex];
            const pnl = (currentPrice - position.entryPrice) * position.amount;
            
            this.balance += cost;
            this.history.push({
                type: 'sell',
                asset,
                amount,
                price: currentPrice,
                pnl: pnl,
                timestamp: Date.now()
            });
            
            this.positions.splice(positionIndex, 1);
        }
        
        this.saveState();
        return { 
            success: true, 
            balance: this.balance,
            position: type === 'buy' ? this.positions[this.positions.length - 1] : null
        };
    }

    getPrice(asset) {
        const prices = {
            ETH: 3500 + (Math.random() - 0.5) * 200,
            BTC: 45000 + (Math.random() - 0.5) * 2000,
            SOL: 150 + (Math.random() - 0.5) * 10,
            MATIC: 0.80 + (Math.random() - 0.5) * 0.1
        };
        return prices[asset] || 100;
    }

    updatePrices() {
        this.positions.forEach(pos => {
            const currentPrice = this.getPrice(pos.asset);
            pos.currentPrice = currentPrice;
            pos.pnl = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
        });
        this.saveState();
    }
}
