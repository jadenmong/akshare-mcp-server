#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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
          },
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
          },
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
          },
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
          },
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
                  default: 'sh'
                },
                limit: {
                  type: 'number',
                  description: '返回数据条数限制，默认100条',
                  default: 100
                }
              }
            }
          },
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
                  default: 'etf'
                },
                limit: {
                  type: 'number',
                  description: '返回数据条数限制，默认50条',
                  default: 50
                }
              }
            }
          },
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
          }
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
        const pythonProcess = spawn('python', ['-c', this.generatePythonCode(functionName, params)], {
          timeout: 30000, // 30秒超时
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        // 设置进程超时
        const timeout = setTimeout(() => {
          pythonProcess.kill('SIGTERM');
          reject(new Error(`Python process timeout after 30 seconds for function: ${functionName}`));
        }, 30000);

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });

        pythonProcess.on('close', (code) => {
          clearTimeout(timeout);

          if (code !== 0) {
            reject(new Error(`Python process failed with code ${code}: ${errorOutput || 'Unknown error'}`));
            return;
          }

          try {
            if (!output.trim()) {
              reject(new Error('Python process returned empty output'));
              return;
            }
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${e.message}. Output: ${output.substring(0, 500)}...`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to call AKShare API: ${error.message}`);
    }
  }

  generatePythonCode(functionName, params) {
    const paramStr = JSON.stringify(params, null, 2);
    return `import sys
import json
import akshare as ak
import pandas as pd
import requests
import warnings
warnings.filterwarnings('ignore')

# 设置请求超时和重试
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    func = getattr(ak, '${functionName}')
    params = ${paramStr}

    # 过滤掉 None 值
    filtered_params = {k: v for k, v in params.items() if v is not None}

    # 增加请求超时设置
    import socket
    socket.setdefaulttimeout(15)

    print(f"Calling ${functionName} with params: {filtered_params}", file=sys.stderr)

    result = func(**filtered_params)

    print(f"Function ${functionName} completed successfully", file=sys.stderr)

    if hasattr(result, 'to_dict'):
        result = result.to_dict('records')
    elif hasattr(result, 'to_json'):
        result = result.to_json()
    elif hasattr(result, '__dict__'):
        result = result.__dict__

    # 限制大数据集的输出
    if isinstance(result, list) and len(result) > 1000:
        print(f"Warning: Large dataset detected, truncating to 1000 items", file=sys.stderr)
        result = result[:1000]

    # 处理NaN值和日期类型，替换为null
    def clean_nan(obj):
        import math
        from datetime import datetime, date
        if isinstance(obj, dict):
            return {k: clean_nan(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nan(v) for v in obj]
        elif isinstance(obj, float) and math.isnan(obj):
            return None
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        else:
            return obj

    cleaned_result = clean_nan(result)
    print(json.dumps(cleaned_result, ensure_ascii=False, separators=(',', ':')))

except requests.exceptions.Timeout as e:
    error_msg = f"Request timeout: {str(e)}"
    print(json.dumps({"error": error_msg}), file=sys.stderr)
    sys.exit(1)
except requests.exceptions.ConnectionError as e:
    error_msg = f"Connection error: {str(e)}"
    print(json.dumps({"error": error_msg}), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    error_msg = f"Unexpected error: {type(e).__name__}: {str(e)}"
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
    const result = await this.callAKShareAPI('stock_zh_a_spot_em', {});

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
    const result = await this.callAKShareAPI('futures_zh_spot', {});

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
    const { market = 'sh', limit = 100 } = args;

    // 根据市场选择不同的 AKShare API，使用更稳定的API
    let apiFunction;
    let apiParams = {};

    switch (market) {
      case 'sh':
        apiFunction = 'stock_sh_a_spot_em';
        break;
      case 'sz':
        apiFunction = 'stock_sz_a_spot_em';
        break;
      case 'all':
      default:
        // 使用分页获取数据的API，避免一次性获取大量数据
        apiFunction = 'stock_zh_a_spot_em';
        apiParams = { 'page': 1, 'page_size': Math.min(limit, 200) };
        break;
    }

    try {
      const result = await this.callAKShareAPI(apiFunction, apiParams);

      // 限制返回数据条数
      let limitedResult = result;
      if (Array.isArray(result) && result.length > limit) {
        limitedResult = result.slice(0, limit);
      }

      return {
        content: [
          {
            type: 'text',
            text: `获取股票列表成功（市场：${market}，限制：${limit}条，实际：${Array.isArray(limitedResult) ? limitedResult.length : 'unknown'}条）：\n\n${JSON.stringify(limitedResult, null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 如果主API失败，尝试备用方案
      try {
        console.error(`Main API failed, trying backup: ${error.message}`);
        const backupResult = await this.callAKShareAPI('stock_info_sz_name_code', {});

        // 限制返回数据条数
        let limitedBackupResult = backupResult;
        if (Array.isArray(backupResult) && backupResult.length > limit) {
          limitedBackupResult = backupResult.slice(0, limit);
        }

        return {
          content: [
            {
              type: 'text',
              text: `获取股票列表成功（使用备用方案，市场：${market}，限制：${limit}条，实际：${Array.isArray(limitedBackupResult) ? limitedBackupResult.length : 'unknown'}条）：\n\n${JSON.stringify(limitedBackupResult, null, 2)}`
            }
          ]
        };
      } catch (backupError) {
        throw new Error(`无法获取股票列表，主API错误：${error.message}，备用API错误：${backupError.message}`);
      }
    }
  }

  async getFundList(args) {
    const { type = 'etf', limit = 50 } = args;

    let apiFunction;
    switch (type) {
      case 'etf':
        apiFunction = 'fund_etf_category_sina';
        break;
      case 'lof':
        apiFunction = 'fund_portfolio_lof_hist';
        break;
      case 'qfii':
        apiFunction = 'fund_qfii_em';
        break;
      case 'all':
      default:
        apiFunction = 'fund_etf_category_sina';
        break;
    }

    try {
      const result = await this.callAKShareAPI(apiFunction, {});

      // 限制返回数据条数
      let limitedResult = result;
      if (Array.isArray(result) && result.length > limit) {
        limitedResult = result.slice(0, limit);
      }

      return {
        content: [
          {
            type: 'text',
            text: `获取基金列表成功（类型：${type}，限制：${limit}条，实际：${Array.isArray(limitedResult) ? limitedResult.length : 'unknown'}条）：\n\n${JSON.stringify(limitedResult, null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 如果主API失败，尝试备用方案
      try {
        console.error(`Main fund API failed, trying backup: ${error.message}`);
        const backupResult = await this.callAKShareAPI('fund_etf_spot_em', {});

        // 限制返回数据条数
        let limitedBackupResult = backupResult;
        if (Array.isArray(backupResult) && backupResult.length > limit) {
          limitedBackupResult = backupResult.slice(0, limit);
        }

        return {
          content: [
            {
              type: 'text',
              text: `获取基金列表成功（使用备用方案，类型：${type}，限制：${limit}条，实际：${Array.isArray(limitedBackupResult) ? limitedBackupResult.length : 'unknown'}条）：\n\n${JSON.stringify(limitedBackupResult, null, 2)}`
            }
          ]
        };
      } catch (backupError) {
        throw new Error(`无法获取基金列表，主API错误：${error.message}，备用API错误：${backupError.message}`);
      }
    }
  }

  async getEconomicData(args) {
    const result = await this.callAKShareAPI('macro_china_gdp', {});

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

// 如果直接运行此文件，启动服务器
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
                     import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;

if (isMainModule) {
  const server = new AKShareMCPServer();
  server.run().catch(console.error);
}

// 导出类供测试使用
export { AKShareMCPServer };