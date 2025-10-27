#!/usr/bin/env node

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

class MCPTestClient {
  constructor() {
    this.process = null;
    this.pendingRequests = new Map();
    this.messageId = 1;
  }

  async start() {
    console.log('Starting MCP test client...');
    this.process = spawn('node', ['src/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      const responses = data.toString().trim().split('\n');
      responses.forEach(response => {
        if (response.trim()) {
          try {
            const parsed = JSON.parse(response);
            this.handleResponse(parsed);
          } catch (e) {
            console.log('Server output:', response);
          }
        }
      });
    });

    this.process.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    this.process.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // 等待服务器启动
    await this.sleep(1000);
  }

  handleResponse(response) {
    const id = response.id;
    if (id && this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id);
      this.pendingRequests.delete(id);

      if (response.error) {
        reject(new Error(response.error.message));
      } else {
        resolve(response.result);
      }
    }
  }

  async sendRequest(method, params = {}) {
    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async initialize() {
    console.log('Initializing MCP connection...');
    const result = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
    console.log('Initialize response:', result);
  }

  async listTools() {
    console.log('Listing available tools...');
    const result = await this.sendRequest('tools/list');
    console.log('Available tools:', result.tools.map(t => t.name));
    return result.tools;
  }

  async callTool(toolName, args = {}) {
    console.log(`Calling tool: ${toolName} with args:`, args);
    try {
      const result = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: args
      });
      console.log(`Tool ${toolName} result:`, result.content[0].text.substring(0, 200) + '...');
      return result;
    } catch (error) {
      console.error(`Tool ${toolName} failed:`, error.message);
      throw error;
    }
  }

  async testAllTools() {
    const tools = await this.listTools();

    console.log('\n=== Testing all tools ===\n');

    // Test each tool
    for (const tool of tools) {
      try {
        switch (tool.name) {
          case 'get_stock_list':
            await this.callTool('get_stock_list', { market: 'all' });
            break;
          case 'get_stock_historical_data':
            await this.callTool('get_stock_historical_data', {
              symbol: '000001',
              period: 'daily'
            });
            break;
          case 'get_stock_realtime_data':
            await this.callTool('get_stock_realtime_data', { symbol: '000001' });
            break;
          case 'get_fund_list':
            await this.callTool('get_fund_list', { type: 'etf' });
            break;
          case 'get_fund_info':
            await this.callTool('get_fund_info', { symbol: '510300' });
            break;
          case 'get_futures_info':
            await this.callTool('get_futures_info', { symbol: 'ag' });
            break;
          case 'get_economic_data':
            await this.callTool('get_economic_data', { indicator: 'GDP' });
            break;
        }
      } catch (error) {
        console.error(`Failed to test ${tool.name}:`, error.message);
      }

      // Small delay between calls
      await this.sleep(500);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    if (this.process) {
      this.process.kill();
    }
  }
}

async function main() {
  const client = new MCPTestClient();

  try {
    await client.start();
    await client.initialize();
    await client.testAllTools();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.sleep(2000);
    await client.stop();
    process.exit(0);
  }
}

main().catch(console.error);