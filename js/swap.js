import { CONTRACT_ADDRESS, CONTRACT_ABI, NATIVE_ADDRESS } from './config.js';

export class SwapManager {
    constructor(wallet) {
        this.wallet = wallet;
        this.contract = null;
        this.fromToken = 'native';
        this.toToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        this.slippage = 0.5;
        this.deadline = 15;
    }

    async initContract() {
        if (!this.wallet.isConnected()) {
            throw new Error('Wallet not connected');
        }
        
        const signer = this.wallet.getSigner();
        this.contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );
        return this.contract;
    }

    getSlippageBps() {
        const custom = document.getElementById('customSlippage').value;
        if (custom) {
            return parseFloat(custom) * 100;
        }
        const active = document.querySelector('.slippage-btn.active');
        return parseFloat(active.dataset.value) * 100;
    }

    getDeadline() {
        const minutes = parseInt(document.getElementById('deadline').value);
        return Math.floor(Date.now() / 1000) + (minutes * 60);
    }

    async getTokenBalances() {
        if (!this.wallet.isConnected()) return;
        
        const fromSelect = document.getElementById('fromToken');
        const toSelect = document.getElementById('toToken');
        const provider = this.wallet.getProvider();
        const address = this.wallet.getAddress();
        
        let fromBalance = '0';
        const fromToken = fromSelect.value;
        if (fromToken === 'native') {
            const balance = await provider.getBalance(address);
            fromBalance = ethers.utils.formatEther(balance);
        } else {
            const token = new ethers.Contract(fromToken, ERC20_ABI, provider);
            const balance = await token.balanceOf(address);
            fromBalance = ethers.utils.formatUnits(balance, 18);
        }
        document.getElementById('fromBalance').textContent = parseFloat(fromBalance).toFixed(4);
        
        let toBalance = '0';
        const toToken = toSelect.value;
        if (toToken === 'native') {
            const balance = await provider.getBalance(address);
            toBalance = ethers.utils.formatEther(balance);
        } else {
            const token = new ethers.Contract(toToken, ERC20_ABI, provider);
            const balance = await token.balanceOf(address);
            toBalance = ethers.utils.formatUnits(balance, 18);
        }
        document.getElementById('toBalance').textContent = parseFloat(toBalance).toFixed(4);
    }

    async updateBalances() {
        await this.getTokenBalances();
    }

    swapTokens() {
        const fromSelect = document.getElementById('fromToken');
        const toSelect = document.getElementById('toToken');
        const fromAmount = document.getElementById('fromAmount');
        const toAmount = document.getElementById('toAmount');
        
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        
        fromAmount.value = '';
        toAmount.value = '';
        
        this.updateBalances();
    }

    useMax() {
        const balance = document.getElementById('fromBalance').textContent;
        if (balance && balance !== '--') {
            document.getElementById('fromAmount').value = parseFloat(balance) * 0.95;
            this.calculateOutput();
        }
    }

    async calculateOutput() {
        const fromAmount = document.getElementById('fromAmount').value;
        if (!fromAmount || parseFloat(fromAmount) === 0) {
            document.getElementById('toAmount').value = '';
            return;
        }
        
        const estimatedOutput = parseFloat(fromAmount) * 0.995;
        document.getElementById('toAmount').value = estimatedOutput.toFixed(6);
    }

    async executeSwap() {
        try {
            await this.initContract();
            
            const fromAmount = document.getElementById('fromAmount').value;
            const fromToken = document.getElementById('fromToken').value;
            const toToken = document.getElementById('toToken').value;
            
            if (!fromAmount || parseFloat(fromAmount) === 0) {
                throw new Error('Please enter an amount');
            }
            
            const amountIn = ethers.utils.parseEther(fromAmount);
            const slippageBps = this.getSlippageBps();
            const deadline = this.getDeadline();
            
            const isEthIn = fromToken === 'native';
            const isEthOut = toToken === 'native';
            
            const tokenIn = isEthIn ? NATIVE_ADDRESS : fromToken;
            const tokenOut = isEthOut ? NATIVE_ADDRESS : toToken;
            
            if (!isEthIn) {
                await this.approveToken(fromToken, amountIn);
            }
            
            const swapOptions = {
                value: isEthIn ? amountIn : 0,
                gasLimit: 500000
            };
            
            const tx = await this.contract.swapExactInputSingle(
                tokenIn,
                tokenOut,
                3000,
                amountIn,
                slippageBps,
                deadline,
                swapOptions
            );
            
            const receipt = await tx.wait();
            
            const swapEvent = receipt.events.find(e => e.event === 'Swapped');
            const amountOut = swapEvent ? 
                ethers.utils.formatEther(swapEvent.args.amountOut) : 
                '0';
            
            return {
                success: true,
                hash: tx.hash,
                fromAmount: fromAmount,
                toAmount: amountOut
            };
            
        } catch (error) {
            console.error('Swap error:', error);
            return {
                success: false,
                error: error.message || 'Swap failed'
            };
        }
    }

    async approveToken(tokenAddress, amount) {
        const signer = this.wallet.getSigner();
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        
        const allowance = await token.allowance(
            this.wallet.getAddress(),
            CONTRACT_ADDRESS
        );
        
        if (allowance.lt(amount)) {
            const tx = await token.approve(CONTRACT_ADDRESS, amount);
            await tx.wait();
        }
    }
}

const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)'
];
