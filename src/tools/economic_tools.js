import { z } from 'zod';

// 宏观经济工具 schemas
export const EconomicGDPSchema = z.object({
  year: z.string().optional().describe('年份，格式：YYYY'),
  quarter: z.string().optional().describe('季度，格式：Qn，如Q1')
});

export const EconomicCPISchema = z.object({
  year: z.string().optional().describe('年份，格式：YYYY'),
  month: z.string().optional().describe('月份，格式：MM')
});

export const EconomicPMISchema = z.object({
  year: z.string().optional().describe('年份，格式：YYYY'),
  month: z.string().optional().describe('月份，格式：MM')
});

export const EconomicInterestRateSchema = z.object({
  start_date: z.string().optional().describe('开始日期，格式 YYYYMMDD'),
  end_date: z.string().optional().describe('结束日期，格式 YYYYMMDD')
});

export const EconomicM2Schema = z.object({
  year: z.string().optional().describe('年份，格式：YYYY'),
  month: z.string().optional().describe('月份，格式：MM')
});

// 宏观经济工具函数映射
export const ECONOMIC_TOOLS = {
  macro_china_gdp: {
    description: '获取中国GDP数据',
    schema: EconomicGDPSchema,
    functionName: 'macro_china_gdp'
  },
  macro_china_cpi: {
    description: '获取中国CPI数据',
    schema: EconomicCPISchema,
    functionName: 'macro_china_cpi'
  },
  macro_china_ppi: {
    description: '获取中国PPI数据',
    schema: EconomicPMISchema,
    functionName: 'macro_china_ppi'
  },
  macro_china_pmi: {
    description: '获取中国PMI数据',
    schema: EconomicPMISchema,
    functionName: 'macro_china_pmi'
  },
  macro_china_m2: {
    description: '获取中国M2货币供应量数据',
    schema: EconomicM2Schema,
    functionName: 'macro_china_m2'
  },
  macro_china_interest_rate: {
    description: '获取中国利率数据',
    schema: EconomicInterestRateSchema,
    functionName: 'macro_china_interest_rate'
  },
  macro_china_reserve_requirement_ratio: {
    description: '获取中国存款准备金率数据',
    schema: EconomicInterestRateSchema,
    functionName: 'macro_china_reserve_requirement_ratio'
  },
  macro_china_foreign_exchange_reserve: {
    description: '获取中国外汇储备数据',
    schema: EconomicInterestRateSchema,
    functionName: 'macro_china_foreign_exchange_reserve'
  },
  macro_china_trade_data: {
    description: '获取中国贸易数据',
    schema: EconomicInterestRateSchema,
    functionName: 'macro_china_trade_data'
  },
  macro_china_fiscal_revenue: {
    description: '获取中国财政收入数据',
    schema: EconomicInterestRateSchema,
    functionName: 'macro_china_fiscal_revenue'
  }
};

// 生成工具定义
export function generateEconomicTools() {
  return Object.entries(ECONOMIC_TOOLS).map(([toolName, toolInfo]) => ({
    name: toolName,
    description: toolInfo.description,
    inputSchema: {
      type: 'object',
      properties: generateToolProperties(toolInfo.schema),
      required: extractRequiredFields(toolInfo.schema)
    }
  }));
}

// 生成工具属性
function generateToolProperties(schema) {
  const properties = {};

  Object.entries(schema._def).forEach(([key, value]) => {
    if (key === 'errorMap' || key === 'unknownKeys') return;

    if (value && typeof value === 'object') {
      properties[key] = {
        type: getValueType(value),
        description: value._def?.description || value.description || '',
        ...(value._def?.defaultValue !== undefined && { default: value._def.defaultValue }),
        ...(value._def?.values && { enum: value._def.values })
      };
    }
  });

  return properties;
}

// 提取必需字段
function extractRequiredFields(schema) {
  const required = [];

  Object.entries(schema._def).forEach(([key, value]) => {
    if (key === 'errorMap' || key === 'unknownKeys') return;

    if (value && typeof value === 'object' && value._def?.defaultValue === undefined) {
      required.push(key);
    }
  });

  return required;
}

// 获取值类型
function getValueType(value) {
  if (!value || !value._def) return 'string';

  const def = value._def;

  if (def.typeName === 'ZodString') return 'string';
  if (def.typeName === 'ZodNumber') return 'number';
  if (def.typeName === 'ZodBoolean') return 'boolean';
  if (def.typeName === 'ZodEnum') return 'string';
  if (def.typeName === 'ZodArray') return 'array';
  if (def.typeName === 'ZodObject') return 'object';

  return 'string';
}