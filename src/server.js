#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';

// Define schemas for tool inputs
const StockHistoricalSchema = z.object({
  symbol: z.string().describe('股票代码，如 "000001"'),
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily').describe('数据周期'),
  start_date: z.string().optional().describe('开始日期，格式 YYYYMMDD'),
  end_date: z.string().optional().describe('结束日期，格式 YYYYMMDD'),
  adjust: z.enum(['', 'qfq', 'hfq']).optional().default('').describe('复权类型')
});

const StockRealtimeSchema = z.object({
  symbol: z.string().describe('股票代码，如 "000001"')
});

const FundInfoSchema = z.object({
  symbol: z.string().describe('基金代码，如 "000001"')
});

const FuturesInfoSchema = z.object({
  symbol: z.string().describe('期货品种代码，如 "ag"'),
  exchange: z.string().optional().describe('交易所代码')
});

class AKShareMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'akshare-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_stock_historical_data',
            description: '获取股票历史数据',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '股票代码，如 "000001"'
                },
                period: {
                  type: 'string',
                  enum: ['daily', 'weekly', 'monthly'],
                  description: '数据周期',
                  default: 'daily'
                },
                start_date: {
                  type: 'string',
                  description: '开始日期，格式 YYYYMMDD'
                },
                end_date: {
                  type: 'string',
                  description: '结束日期，格式 YYYYMMDD'
                },
                adjust: {
                  type: 'string',
                  enum: ['', 'qfq', 'hfq'],
                  description: '复权类型',
                  default: ''
                }
              },
              required: ['symbol']
            }
          } as Tool,
          {
            name: 'get_stock_realtime_data',
            description: '获取股票实时数据',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '股票代码，如 "000001"'
                }
              },
              required: ['symbol']
            }
          } as Tool,
          {
            name: 'get_fund_info',
            description: '获取基金信息',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '基金代码，如 "000001"'
                }
              },
              required: ['symbol']
            }
          } as Tool,
          {
            name: 'get_futures_info',
            description: '获取期货信息',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '期货品种代码，如 "ag"'
                },
                exchange: {
                  type: 'string',
                  description: '交易所代码'
                }
              },
              required: ['symbol']
            }
          } as Tool,
          {
            name: 'get_stock_list',
            description: '获取股票列表',
            inputSchema: {
              type: 'object',
              properties: {
                market: {
                  type: 'string',
                  enum: ['sh', 'sz', 'all'],
                  description: '市场：sh=上海，sz=深圳，all=全部',
                  default: 'all'
                }
              }
            }
          } as Tool,
          {
            name: 'get_fund_list',
            description: '获取基金列表',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['etf', 'lof', 'qfii', 'all'],
                  description: '基金类型',
                  default: 'all'
                }
              }
            }
          } as Tool,
          {
            name: 'get_economic_data',
            description: '获取宏观经济数据',
            inputSchema: {
              type: 'object',
              properties: {
                indicator: {
                  type: 'string',
                  description: '经济指标名称，如 "GDP", "CPI"'
                },
                start_date: {
                  type: 'string',
                  description: '开始日期，格式 YYYYMMDD'
                },
                end_date: {
                  type: 'string',
                  description: '结束日期，格式 YYYYMMDD'
                }
              },
              required: ['indicator']
            }
          } as Tool
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_stock_historical_data':
            return await this.getStockHistoricalData(args);

          case 'get_stock_realtime_data':
            return await this.getStockRealtimeData(args);

          case 'get_fund_info':
            return await this.getFundInfo(args);

          case 'get_futures_info':
            return await this.getFuturesInfo(args);

          case 'get_stock_list':
            return await this.getStockList(args);

          case 'get_fund_list':
            return await this.getFundList(args);

          case 'get_economic_data':
            return await this.getEconomicData(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error calling ${name}: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async callAKShareAPI(functionName, params = {}) {
    try {
      // 启动 Python 子进程来调用 AKShare
      const { spawn } = await import('child_process');

      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['-c', this.generatePythonCode(functionName, params)]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process failed: ${errorOutput}`));
            return;
          }

          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${e.message}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to call AKShare API: ${error.message}`);
    }
  }

  generatePythonCode(functionName, params) {
    const paramStr = JSON.stringify(params, null, 2);
    return `
import sys
import json
import akshare as ak
import pandas as pd

try:
    func = getattr(ak, '${functionName}')
    params = ${paramStr}

    # 过滤掉 None 值
    filtered_params = {k: v for k, v in params.items() if v is not None}

    result = func(**filtered_params)

    if hasattr(result, 'to_dict'):
        result = result.to_dict('records')
    elif hasattr(result, 'to_json'):
        result = result.to_json()
    elif hasattr(result, '__dict__'):
        result = result.__dict__

    print(json.dumps(result, ensure_ascii=False, indent=2))

except Exception as e:
    error_msg = str(e)
    print(json.dumps({"error": error_msg}), file=sys.stderr)
    sys.exit(1)
`;
  }

  async getStockHistoricalData(args) {
    const validated = StockHistoricalSchema.parse(args);
    const result = await this.callAKShareAPI('stock_zh_a_hist', validated);

    return {
      content: [
        {
          type: 'text',
          text: `获取股票 ${validated.symbol} 历史数据成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getStockRealtimeData(args) {
    const validated = StockRealtimeSchema.parse(args);
    const result = await this.callAKShareAPI('stock_zh_a_spot_em', { symbol: validated.symbol });

    return {
      content: [
        {
          type: 'text',
          text: `获取股票 ${validated.symbol} 实时数据成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getFundInfo(args) {
    const validated = FundInfoSchema.parse(args);
    const result = await this.callAKShareAPI('fund_etf_basic_info_em', { symbol: validated.symbol });

    return {
      content: [
        {
          type: 'text',
          text: `获取基金 ${validated.symbol} 信息成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getFuturesInfo(args) {
    const validated = FuturesInfoSchema.parse(args);
    const result = await this.callAKShareAPI('futures_zh_spot', { symbol: validated.symbol, ...validated });

    return {
      content: [
        {
          type: 'text',
          text: `获取期货 ${validated.symbol} 信息成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getStockList(args) {
    const result = await this.callAKShareAPI('stock_zh_a_spot_em', args);

    return {
      content: [
        {
          type: 'text',
          text: `获取股票列表成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getFundList(args) {
    const result = await this.callAKShareAPI('fund_etf_category_em', args);

    return {
      content: [
        {
          type: 'text',
          text: `获取基金列表成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async getEconomicData(args) {
    const result = await this.callAKShareAPI('macro_china_gdp', args);

    return {
      content: [
        {
          type: 'text',
          text: `获取宏观经济数据成功：\n\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AKShare MCP server running on stdio');
  }
}

// Start the server
const server = new AKShareMCPServer();
server.run().catch(console.error);