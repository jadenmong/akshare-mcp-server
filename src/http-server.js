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
  start_date: z.string().optional().describe('开始日期，格式 YYYY-MM-DD'),
  end_date: z.string().optional().describe('结束日期，格式 YYYY-MM-DD'),
  adjust: z.enum(['', 'qfq', 'hfq']).optional().default('').describe('复权类型')
});

const StockRealtimeSchema = z.object({
  symbol: z.string().describe('股票代码，如 "000001"')
});

const StockListSchema = z.object({
  market: z.enum(['sh', 'sz', 'all', 'us', 'hk']).optional().default('sh').describe('市场：sh=上海，sz=深圳，all=全部，us=美股，hk=港股'),
  limit: z.number().optional().default(100).describe('返回数据条数限制，默认100条')
});

const FundListSchema = z.object({
  type: z.enum(['etf', 'lof', 'qfii', 'all']).optional().default('etf').describe('基金类型'),
  limit: z.number().optional().default(50).describe('返回数据条数限制，默认50条')
});

class FinanceHTTPMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'finance-http-mcp-server',
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
            description: '获取股票历史数据（基于免费API）',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '股票代码，如 "000001", "AAPL"'
                },
                period: {
                  type: 'string',
                  enum: ['daily', 'weekly', 'monthly'],
                  description: '数据周期',
                  default: 'daily'
                },
                start_date: {
                  type: 'string',
                  description: '开始日期，格式 YYYY-MM-DD'
                },
                end_date: {
                  type: 'string',
                  description: '结束日期，格式 YYYY-MM-DD'
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
            description: '获取股票实时数据（基于免费API）',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '股票代码，如 "000001", "AAPL"'
                }
              },
              required: ['symbol']
            }
          },
          {
            name: 'get_stock_list',
            description: '获取股票列表（基于免费API）',
            inputSchema: {
              type: 'object',
              properties: {
                market: {
                  type: 'string',
                  enum: ['sh', 'sz', 'all', 'us', 'hk'],
                  description: '市场：sh=上海，sz=深圳，all=全部，us=美股，hk=港股',
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
            description: '获取基金列表（基于免费API）',
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
            name: 'search_stock',
            description: '搜索股票信息（基于免费API）',
            inputSchema: {
              type: 'object',
              properties: {
                keyword: {
                  type: 'string',
                  description: '搜索关键词，如公司名称或股票代码'
                },
                market: {
                  type: 'string',
                  enum: ['sh', 'sz', 'all', 'us', 'hk'],
                  description: '搜索市场范围',
                  default: 'all'
                }
              },
              required: ['keyword']
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

          case 'get_stock_list':
            return await this.getStockList(args);

          case 'get_fund_list':
            return await this.getFundList(args);

          case 'search_stock':
            return await this.searchStock(args);

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

  async callFinanceAPI(url, params = {}) {
    try {
      const response = await axios.get(url, {
        params,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  // 使用新浪财经API获取数据
  async getStockHistoricalData(args) {
    const validated = StockHistoricalSchema.parse(args);
    const { symbol, period, start_date, end_date, adjust } = validated;

    try {
      // 新浪财经历史数据API
      const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData`;
      const params = {
        symbol: this.formatSymbolForSina(symbol),
        scale: period === 'daily' ? '240' : period === 'weekly' ? '1200' : '7200',
        ma: 'no',
        datalen: Math.min(1000, validated.limit || 1000)
      };

      if (start_date) params.start = start_date;
      if (end_date) params.end = end_date;

      const data = await this.callFinanceAPI(url, params);

      let result;
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (e) {
          result = this.parseSinaData(data);
        }
      } else {
        result = data;
      }

      return {
        content: [
          {
            type: 'text',
            text: `获取股票 ${symbol} 历史数据成功（${result.length || 0}条记录）：\n\n${JSON.stringify(result.slice(0, 100), null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 备用方案：使用模拟数据
      return this.getMockHistoricalData(symbol);
    }
  }

  async getStockRealtimeData(args) {
    const validated = StockRealtimeSchema.parse(args);
    const { symbol } = validated;

    try {
      // 新浪财经实时数据API
      const url = `https://hq.sinajs.cn/list=${this.formatSymbolForSina(symbol)}`;
      const data = await this.callFinanceAPI(url);

      const result = this.parseSinaRealtimeData(data);

      return {
        content: [
          {
            type: 'text',
            text: `获取股票 ${symbol} 实时数据成功：\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 备用方案：使用模拟数据
      return this.getMockRealtimeData(symbol);
    }
  }

  async getStockList(args) {
    const { market = 'sh', limit = 100 } = args;

    try {
      // 根据市场获取不同的股票列表
      let data = [];

      if (market === 'sh' || market === 'all') {
        // 上海A股
        const shData = await this.callFinanceAPI('https://money.finance.sina.com.cn/corp/view/vIE_AllStockSelect.php?type=hs');
        data = data.concat(this.parseStockList(shData).slice(0, Math.ceil(limit/2)));
      }

      if (market === 'sz' || market === 'all') {
        // 深圳A股
        const szData = await this.callFinanceAPI('https://money.finance.sina.com.cn/corp/view/vIE_AllStockSelect.php?type=zs');
        data = data.concat(this.parseStockList(szData).slice(0, Math.ceil(limit/2)));
      }

      // 限制返回数据条数
      const limitedData = data.slice(0, limit);

      return {
        content: [
          {
            type: 'text',
            text: `获取股票列表成功（市场：${market}，限制：${limit}条，实际：${limitedData.length}条）：\n\n${JSON.stringify(limitedData, null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 备用方案：使用模拟数据
      return this.getMockStockList(market, limit);
    }
  }

  async getFundList(args) {
    const { type = 'etf', limit = 50 } = args;

    try {
      // 新浪财经基金数据API
      const url = 'https://money.finance.sina.com.cn/fund/view/vF_AllFundSelect.php';
      const params = {
        type: type === 'etf' ? 'etf' : type === 'lof' ? 'lof' : 'all'
      };

      const data = await this.callFinanceAPI(url, params);
      const result = this.parseFundList(data).slice(0, limit);

      return {
        content: [
          {
            type: 'text',
            text: `获取基金列表成功（类型：${type}，限制：${limit}条，实际：${result.length}条）：\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 备用方案：使用模拟数据
      return this.getMockFundList(type, limit);
    }
  }

  async searchStock(args) {
    const { keyword, market = 'all' } = args;

    try {
      // 新浪财经搜索API
      const url = 'https://suggest3.sinajs.cn/suggest/type=11,12,13,14,15&key=';
      const data = await this.callFinanceAPI(url + encodeURIComponent(keyword));

      const result = this.parseSearchData(data);

      return {
        content: [
          {
            type: 'text',
            text: `搜索股票 "${keyword}" 成功（找到${result.length}个结果）：\n\n${JSON.stringify(result.slice(0, 20), null, 2)}`
          }
        ]
      };
    } catch (error) {
      // 备用方案：返回模拟搜索结果
      return this.getMockSearchResults(keyword, market);
    }
  }

  // 工具方法
  formatSymbolForSina(symbol) {
    if (symbol.startsWith('6') || symbol.startsWith('9')) {
      return `sh${symbol}`;
    } else if (symbol.startsWith('0') || symbol.startsWith('3')) {
      return `sz${symbol}`;
    }
    return symbol;
  }

  parseSinaData(data) {
    // 解析新浪财经数据格式
    try {
      if (typeof data === 'string' && data.includes('[')) {
        const match = data.match(/\[(.*)\]/);
        if (match) {
          return JSON.parse(match[1]);
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  parseSinaRealtimeData(data) {
    try {
      const lines = data.split('\n');
      const result = {};

      for (const line of lines) {
        if (line.includes('var hq_str_')) {
          const matches = line.match(/="([^"]+)"/);
          if (matches) {
            const values = matches[1].split(',');
            result.name = values[0];
            result.open = parseFloat(values[1]) || 0;
            result.close_prev = parseFloat(values[2]) || 0;
            result.price = parseFloat(values[3]) || 0;
            result.high = parseFloat(values[4]) || 0;
            result.low = parseFloat(values[5]) || 0;
            result.volume = parseInt(values[8]) || 0;
            result.amount = parseFloat(values[9]) || 0;
            break;
          }
        }
      }

      return result;
    } catch (e) {
      return { error: 'Failed to parse realtime data' };
    }
  }

  parseStockList(data) {
    // 简化的股票列表解析
    try {
      if (typeof data === 'string') {
        const stocks = [];
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.includes(',')) {
            const [code, name] = line.split(',');
            if (code && name) {
              stocks.push({ code: code.trim(), name: name.trim() });
            }
          }
        }
        return stocks;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  parseFundList(data) {
    // 简化的基金列表解析
    try {
      if (typeof data === 'string') {
        const funds = [];
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.includes(',')) {
            const [code, name, type] = line.split(',');
            if (code && name) {
              funds.push({ code: code.trim(), name: name.trim(), type: type?.trim() || 'ETF' });
            }
          }
        }
        return funds;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  parseSearchData(data) {
    try {
      const matches = data.match(/="([^"]+)"/);
      if (matches) {
        const items = matches[1].split(';');
        const results = [];
        for (const item of items) {
          if (item) {
            const parts = item.split(',');
            if (parts.length >= 3) {
              results.push({
                code: parts[0],
                name: parts[2],
                market: parts[1]
              });
            }
          }
        }
        return results;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // 模拟数据方法（作为备用方案）
  getMockHistoricalData(symbol) {
    const mockData = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const price = 10 + Math.random() * 5;
      mockData.push({
        date: date.toISOString().split('T')[0],
        open: price + (Math.random() - 0.5),
        high: price + Math.random(),
        low: price - Math.random(),
        close: price,
        volume: Math.floor(Math.random() * 1000000)
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `获取股票 ${symbol} 历史数据成功（模拟数据，${mockData.length}条记录）：\n\n${JSON.stringify(mockData, null, 2)}`
        }
      ]
    };
  }

  getMockRealtimeData(symbol) {
    const price = 10 + Math.random() * 10;
    return {
      content: [
        {
          type: 'text',
          text: `获取股票 ${symbol} 实时数据成功（模拟数据）：\n\n${JSON.stringify({
            name: `股票${symbol}`,
            price: price.toFixed(2),
            change: (Math.random() - 0.5).toFixed(2),
            changePercent: ((Math.random() - 0.5) * 5).toFixed(2) + '%',
            volume: Math.floor(Math.random() * 1000000),
            time: new Date().toLocaleString()
          }, null, 2)}`
        }
      ]
    };
  }

  getMockStockList(market, limit) {
    const stocks = [];
    const prefixes = market === 'sh' ? ['6', '9'] : market === 'sz' ? ['0', '3'] : ['0', '3', '6'];

    for (let i = 0; i < Math.min(limit, 50); i++) {
      const prefix = prefixes[i % prefixes.length];
      const code = prefix + String(i).padStart(5, '0');
      stocks.push({
        code: code,
        name: `测试股票${code}`,
        price: (10 + Math.random() * 20).toFixed(2),
        change: ((Math.random() - 0.5) * 5).toFixed(2)
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `获取股票列表成功（模拟数据，市场：${market}，限制：${limit}条，实际：${stocks.length}条）：\n\n${JSON.stringify(stocks, null, 2)}`
        }
      ]
    };
  }

  getMockFundList(type, limit) {
    const funds = [];
    for (let i = 1; i <= Math.min(limit, 30); i++) {
      funds.push({
        code: String(i).padStart(6, '0'),
        name: `${type.toUpperCase()}基金${i}`,
        type: type.toUpperCase(),
        price: (1 + Math.random() * 3).toFixed(4),
        change: ((Math.random() - 0.5) * 2).toFixed(2)
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `获取基金列表成功（模拟数据，类型：${type}，限制：${limit}条，实际：${funds.length}条）：\n\n${JSON.stringify(funds, null, 2)}`
        }
      ]
    };
  }

  getMockSearchResults(keyword, market) {
    const results = [];
    for (let i = 1; i <= 10; i++) {
      results.push({
        code: String(i).padStart(6, '0'),
        name: `${keyword}相关股票${i}`,
        market: market === 'all' ? ['sh', 'sz'][i % 2] : market,
        price: (10 + Math.random() * 20).toFixed(2)
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `搜索股票 "${keyword}" 成功（模拟数据，找到${results.length}个结果）：\n\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Finance HTTP MCP server running on stdio');
  }
}

// 如果直接运行此文件，启动服务器
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
                     import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;

if (isMainModule) {
  const server = new FinanceHTTPMCPServer();
  server.run().catch(console.error);
}

// 导出类供测试使用
export { FinanceHTTPMCPServer };