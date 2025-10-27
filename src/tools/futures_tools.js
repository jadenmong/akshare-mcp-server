import { z } from 'zod';

// 期货工具 schemas
export const FuturesSpotSchema = z.object({
  symbol: z.string().describe('期货品种代码，如 "ag"'),
  exchange: z.string().optional().describe('交易所代码')
});

export const FuturesRealtimeSchema = z.object({
  symbol: z.string().describe('期货品种代码，如 "ag"'),
  market: z.string().optional().describe('市场代码')
});

export const FuturesHistoricalSchema = z.object({
  symbol: z.string().describe('期货品种代码，如 "ag"'),
  start_date: z.string().optional().describe('开始日期，格式 YYYYMMDD'),
  end_date: z.string().optional().describe('结束日期，格式 YYYYMMDD'),
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily').describe('数据周期')
});

export const FuturesListSchema = z.object({
  exchange: z.string().optional().describe('交易所代码'),
  type: z.string().optional().describe('期货类型')
});

export const FuturesPositionSchema = z.object({
  symbol: z.string().describe('期货品种代码，如 "ag"'),
  date: z.string().optional().describe('查询日期，格式 YYYYMMDD')
});

// 期货工具函数映射
export const FUTURES_TOOLS = {
  futures_zh_spot: {
    description: '获取期货实时行情数据',
    schema: FuturesSpotSchema,
    functionName: 'futures_zh_spot'
  },
  futures_zh_spot_sina: {
    description: '获取期货实时行情数据（新浪）',
    schema: FuturesRealtimeSchema,
    functionName: 'futures_zh_spot_sina'
  },
  futures_zh_his: {
    description: '获取期货历史行情数据',
    schema: FuturesHistoricalSchema,
    functionName: 'futures_zh_his'
  },
  futures_position_main_em: {
    description: '获取期货主力合约持仓数据',
    schema: FuturesPositionSchema,
    functionName: 'futures_position_main_em'
  },
  futures_position_rank_em: {
    description: '获取期货持仓排名数据',
    schema: FuturesPositionSchema,
    functionName: 'futures_position_rank_em'
  },
  futures_inventory_sge: {
    description: '获取上海期货交易所库存数据',
    schema: FuturesSpotSchema,
    functionName: 'futures_inventory_sge'
  },
  futures_inventory_lme: {
    description: '获取伦敦金属交易所库存数据',
    schema: FuturesSpotSchema,
    functionName: 'futures_inventory_lme'
  },
  futures_inventory_shfe: {
    description: '获取上海期货交易所库存数据',
    schema: FuturesSpotSchema,
    functionName: 'futures_inventory_shfe'
  },
  futures_inventory_dce: {
    description: '获取大连商品交易所库存数据',
    schema: FuturesSpotSchema,
    functionName: 'futures_inventory_dce'
  },
  futures_inventory_czce: {
    description: '获取郑州商品交易所库存数据',
    schema: FuturesSpotSchema,
    functionName: 'futures_inventory_czce'
  }
};

// 生成工具定义
export function generateFuturesTools() {
  return Object.entries(FUTURES_TOOLS).map(([toolName, toolInfo]) => ({
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