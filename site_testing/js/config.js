// Contract Configuration
export const CONTRACT_ADDRESS = '0x7BB4A6b35331d8e3d729171fc8d8be7c0cbE3435';

export const CONTRACT_ABI = [
    "function swapExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint256 slippageBps, uint256 deadline) external payable returns (uint256)",
    "function swapExactInputSingleFor(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint256 slippageBps, uint256 deadline, address recipient) external payable returns (uint256)",
    "function swapExactInputMultihop(bytes calldata path, uint256 amountIn, uint256 slippageBps, uint256 deadline) external payable returns (uint256)",
    "function swapExactInputMultihopFor(bytes calldata path, uint256 amountIn, uint256 slippageBps, uint256 deadline, address recipient) external payable returns (uint256)",
    "function encodePath(address[] calldata tokens, uint24[] calldata fees) external pure returns (bytes memory)",
    "function rescueTokens(address token) external",
    "event Swapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 effectiveSlippage, uint24 fee)"
];

// Token Addresses (Mainnet)
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const TOKEN_ADDRESSES = {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
};

// Uniswap V3 Router
export const ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

// Token Decimals
export const TOKEN_DECIMALS = {
    'native': 18,
    'USDC': 6,
    'DAI': 18,
    'WBTC': 8,
    'WETH': 18,
    'USDT': 6
};

// Fee Tiers
export const FEE_TIERS = {
    '0.05%': 500,
    '0.3%': 3000,
    '1%': 10000
};