export class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.balance = '0';
        this.connected = false;
    }

    async connect() {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask!');
        }

        try {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            await this.provider.send('eth_requestAccounts', []);
            this.signer = this.provider.getSigner();
            this.address = await this.signer.getAddress();
            this.balance = await this.getBalance();
            this.connected = true;
            
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.address = accounts[0];
                    this.getBalance();
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.balance = '0';
        this.connected = false;
        
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        connectBtn.classList.remove('hidden');
        walletInfo.classList.add('hidden');
    }

    isConnected() {
        return this.connected && this.address !== null;
    }

    getAddress() {
        return this.address;
    }

    async getBalance() {
        if (!this.provider || !this.address) return '0';
        try {
            const balance = await this.provider.getBalance(this.address);
            this.balance = ethers.utils.formatEther(balance);
            return this.balance;
        } catch (error) {
            console.error('Failed to get balance:', error);
            return '0';
        }
    }

    getSigner() {
        return this.signer;
    }

    getProvider() {
        return this.provider;
    }
}
