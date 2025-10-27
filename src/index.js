import { generateStockTools, STOCK_TOOLS } from './tools/stock_tools.js';
import { generateFundTools, FUND_TOOLS } from './tools/fund_tools.js';
import { generateEconomicTools, ECONOMIC_TOOLS } from './tools/economic_tools.js';
import { generateFuturesTools, FUTURES_TOOLS } from './tools/futures_tools.js';

// 导出所有工具生成器
export {
  generateStockTools,
  generateFundTools,
  generateEconomicTools,
  generateFuturesTools,
  STOCK_TOOLS,
  FUND_TOOLS,
  ECONOMIC_TOOLS,
  FUTURES_TOOLS
};

// 生成所有可用工具
export function generateAllTools() {
  return [
    ...generateStockTools(),
    ...generateFundTools(),
    ...generateEconomicTools(),
    ...generateFuturesTools()
  ];
}

// 按类别分组工具
export function getToolsByCategory() {
  return {
    stock: generateStockTools(),
    fund: generateFundTools(),
    economic: generateEconomicTools(),
    futures: generateFuturesTools()
  };
}