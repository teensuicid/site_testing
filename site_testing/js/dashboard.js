export class Dashboard {
    constructor() {
        this.chart = null;
        this.data = [];
        this.paper = null;
        
        setTimeout(() => {
            this.paper = window.app?.paper;
        }, 1000);
    }

    update() {
        this.updateStats();
        this.updateChart();
    }

    updateStats() {
        const totalValue = this.getTotalValue();
        const dailyChange = this.getDailyChange();
        const totalTrades = this.getTotalTrades();
        const profitLoss = this.getProfitLoss();
        
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('dailyChange').textContent = `${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%`;
        document.getElementById('dailyChange').style.color = dailyChange >= 0 ? 'var(--success)' : 'var(--danger)';
        document.getElementById('totalTrades').textContent = totalTrades;
        document.getElementById('profitLoss').textContent = `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`;
        document.getElementById('profitLoss').style.color = profitLoss >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    getTotalValue() {
        if (!this.paper) return 0;
        const balance = this.paper.getBalance();
        const positions = this.paper.getPositions();
        
        let positionValue = 0;
        positions.forEach(pos => {
            positionValue += pos.amount * pos.currentPrice;
        });
        
        return balance + positionValue;
    }

    getDailyChange() {
        return (Math.random() - 0.5) * 5;
    }

    getTotalTrades() {
        if (!this.paper) return 0;
        return this.paper.getHistory().length;
    }

    getProfitLoss() {
        if (!this.paper) return 0;
        const history = this.paper.getHistory();
        let pnl = 0;
        history.forEach(trade => {
            if (trade.pnl) pnl += trade.pnl;
        });
        return pnl;
    }

    updateChart() {
        const now = Date.now();
        const data = [];
        let value = 100;
        
        for (let i = 30; i >= 0; i--) {
            value *= (1 + (Math.random() - 0.5) * 0.05);
            data.push({
                time: new Date(now - i * 3600000).toLocaleTimeString(),
                value: value
            });
        }
        
        this.data = data;
        this.renderChart();
    }

    renderChart() {
        const canvas = document.getElementById('priceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 40 || 800;
        canvas.height = 360;
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 20, bottom: 30, left: 20, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        ctx.clearRect(0, 0, width, height);
        
        if (this.data.length === 0) {
            ctx.fillStyle = '#8A8BB5';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data yet', width / 2, height / 2);
            return;
        }
        
        const values = this.data.map(d => d.value);
        const min = Math.min(...values) * 0.98;
        const max = Math.max(...values) * 1.02;
        const range = max - min;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding.top + (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
        
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(108, 59, 245, 0.8)');
        gradient.addColorStop(1, 'rgba(108, 59, 245, 0.1)');
        
        ctx.beginPath();
        this.data.forEach((d, i) => {
            const x = padding.left + (i / (this.data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((d.value - min) / range) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.strokeStyle = '#6C3BF5';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        const lastPoint = this.data[this.data.length - 1];
        const lastX = padding.left + chartWidth;
        const lastY = padding.top + chartHeight - ((lastPoint.value - min) / range) * chartHeight;
        
        ctx.lineTo(lastX, height - padding.bottom);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        const currentValue = this.data[this.data.length - 1].value;
        ctx.fillStyle = '#6C3BF5';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`$${currentValue.toFixed(2)}`, width - padding.right, padding.top + 30);
        
        ctx.fillStyle = '#8A8BB5';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        const step = Math.floor(this.data.length / 6);
        this.data.forEach((d, i) => {
            if (i % step === 0 || i === this.data.length - 1) {
                const x = padding.left + (i / (this.data.length - 1)) * chartWidth;
                ctx.fillText(d.time, x, height - 5);
            }
        });
    }
}