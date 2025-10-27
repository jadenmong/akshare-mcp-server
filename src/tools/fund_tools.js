import { z } from 'zod';
import { generateToolsDefinition } from '../utils/toolHelpers.js';

// 基金工具 schemas
export const FundInfoSchema = z.object({
  symbol: z.string().describe('基金代码，如 "000001"'),
  market: z.string().optional().describe('市场代码')
});

export const FundListSchema = z.object({
  type: z.enum(['etf', 'lof', 'qfii', 'all']).optional().default('all').describe('基金类型'),
  market: z.string().optional().describe('市场代码')
});

export const FundRankSchema = z.object({
  symbol: z.string().optional().describe('基金代码'),
  type: z.enum(['etf', 'lof', 'all']).optional().default('all').describe('基金类型'),
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily').describe('统计周期'),
  limit: z.number().optional().default(50).describe('返回结果数量限制')
});

export const FundHoldingSchema = z.object({
  symbol: z.string().describe('基金代码'),
  quarter: z.string().optional().describe('季度，格式：YYYYQn，如2024Q1')
});

// 基金工具函数映射
export const FUND_TOOLS = {
  fund_etf_basic_info_em: {
    description: '获取ETF基本信息',
    schema: FundInfoSchema,
    functionName: 'fund_etf_basic_info_em'
  },
  fund_etf_category_em: {
    description: '获取ETF分类数据',
    schema: FundListSchema,
    functionName: 'fund_etf_category_em'
  },
  fund_etf_spot_em: {
    description: '获取ETF实时行情',
    schema: FundListSchema,
    functionName: 'fund_etf_spot_em'
  },
  fund_portfolio_em: {
    description: '获取基金持仓信息',
    schema: FundHoldingSchema,
    functionName: 'fund_portfolio_em'
  },
  fund_rank_em: {
    description: '获取基金排行榜',
    schema: FundRankSchema,
    functionName: 'fund_rank_em'
  },
  fund_lof_spot_em: {
    description: '获取LOF实时行情',
    schema: FundListSchema,
    functionName: 'fund_lof_spot_em'
  },
  fund_info_a_code_name_em: {
    description: '获取基金代码名称对照表',
    schema: FundListSchema,
    functionName: 'fund_info_a_code_name_em'
  },
  fund_etf_fund_info_em: {
    description: '获取ETF详细信息',
    schema: FundInfoSchema,
    functionName: 'fund_etf_fund_info_em'
  }
};

// 生成工具定义
export function generateFundTools() {
  return generateToolsDefinition(FUND_TOOLS);
}