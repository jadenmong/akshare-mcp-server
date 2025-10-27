import { z } from 'zod';
import { generateToolsDefinition } from '../utils/toolHelpers.js';

// 股票工具 schemas
export const StockHistoricalSchema = z.object({
  symbol: z.string().describe('股票代码，如 "000001"'),
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily').describe('数据周期'),
  start_date: z.string().optional().describe('开始日期，格式 YYYYMMDD'),
  end_date: z.string().optional().describe('结束日期，格式 YYYYMMDD'),
  adjust: z.enum(['', 'qfq', 'hfq']).optional().default('').describe('复权类型')
});

export const StockRealtimeSchema = z.object({
  symbol: z.string().describe('股票代码，如 "000001"')
});

export const StockInfoSchema = z.object({
  symbol: z.string().describe('股票代码，如 "000001"'),
  market: z.enum(['sh', 'sz']).optional().describe('市场代码')
});

export const StockListSchema = z.object({
  market: z.enum(['sh', 'sz', 'all']).optional().default('all').describe('市场：sh=上海，sz=深圳，all=全部')
});

export const StockSearchSchema = z.object({
  keyword: z.string().describe('搜索关键词'),
  limit: z.number().optional().default(10).describe('返回结果数量限制')
});

// 股票工具函数映射
export const STOCK_TOOLS = {
  stock_zh_a_hist: {
    description: '获取A股历史行情数据',
    schema: StockHistoricalSchema,
    functionName: 'stock_zh_a_hist'
  },
  stock_zh_a_spot_em: {
    description: '获取A股实时行情数据',
    schema: StockRealtimeSchema,
    functionName: 'stock_zh_a_spot_em'
  },
  stock_zh_a_spot: {
    description: '获取A股实时行情数据（新浪）',
    schema: StockInfoSchema,
    functionName: 'stock_zh_a_spot'
  },
  stock_sh_a_spot_em: {
    description: '获取上海A股实时行情',
    schema: StockListSchema,
    functionName: 'stock_sh_a_spot_em'
  },
  stock_sz_a_spot_em: {
    description: '获取深圳A股实时行情',
    schema: StockListSchema,
    functionName: 'stock_sz_a_spot_em'
  },
  stock_zh_a_filter_em: {
    description: '获取A股筛选数据',
    schema: StockSearchSchema,
    functionName: 'stock_zh_a_filter_em'
  },
  stock_info_a_code_name_em: {
    description: '获取A股代码名称对照表',
    schema: StockListSchema,
    functionName: 'stock_info_a_code_name_em'
  }
};

// 生成工具定义
export function generateStockTools() {
  return generateToolsDefinition(STOCK_TOOLS);
}