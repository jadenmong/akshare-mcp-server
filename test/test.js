#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const TEST_CONFIG = {
  serverPath: join(__dirname, '..', 'src', 'server.js'),
  tests: [
    {
      name: 'List Tools',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      }
    },
    {
      name: 'Get Stock Historical Data',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'stock_zh_a_hist',
          arguments: {
            symbol: '000001',
            period: 'daily',
            start_date: '20240101',
            end_date: '20240110'
          }
        }
      }
    },
    {
      name: 'Get Stock Realtime Data',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'stock_zh_a_spot_em',
          arguments: {
            symbol: '000001'
          }
        }
      }
    },
    {
      name: 'Get Fund Info',
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'fund_etf_basic_info_em',
          arguments: {
            symbol: '510050'
          }
        }
      }
    },
    {
      name: 'Get Economic Data',
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'macro_china_gdp',
          arguments: {
            year: '2023'
          }
        }
      }
    }
  ]
};

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('Starting AKShare MCP Server...');

      this.serverProcess = spawn('node', [TEST_CONFIG.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverOutput = '';
      let serverError = '';

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.log('Server stdout:', output.trim());
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        serverError += error;
        console.log('Server stderr:', error.trim());
      });

      this.serverProcess.on('spawn', () => {
        console.log('Server process spawned successfully');
        setTimeout(resolve, 1000); // 等待服务器完全启动
      });

      this.serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
        reject(error);
      });

      this.serverProcess.on('exit', (code) => {
        console.log(`Server process exited with code ${code}`);
        if (code !== 0) {
          console.error('Server error output:', serverError);
        }
      });
    });
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server not started'));
        return;
      }

      const requestStr = JSON.stringify(request) + '\n';

      let response = '';

      const dataHandler = (data) => {
        response += data.toString();

        // 尝试解析响应
        try {
          const lines = response.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          if (lastLine) {
            const jsonResponse = JSON.parse(lastLine);
            this.serverProcess.stdout.off('data', dataHandler);
            resolve(jsonResponse);
          }
        } catch (e) {
          // 还未收到完整响应，继续等待
        }
      };

      this.serverProcess.stdout.on('data', dataHandler);

      // 发送请求
      this.serverProcess.stdin.write(requestStr);

      // 设置超时
      setTimeout(() => {
        this.serverProcess.stdout.off('data', dataHandler);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  async runTest(test) {
    console.log(`\nRunning test: ${test.name}`);

    try {
      const response = await this.sendRequest(test.request);

      const result = {
        name: test.name,
        status: 'PASS',
        request: test.request,
        response: response
      };

      console.log(`✅ ${test.name} - PASSED`);
      console.log('Response:', JSON.stringify(response, null, 2));

      return result;
    } catch (error) {
      const result = {
        name: test.name,
        status: 'FAIL',
        request: test.request,
        error: error.message
      };

      console.log(`❌ ${test.name} - FAILED: ${error.message}`);

      return result;
    }
  }

  async runAllTests() {
    console.log('Starting AKShare MCP Server Tests...\n');

    try {
      await this.startServer();

      for (const test of TEST_CONFIG.tests) {
        const result = await this.runTest(test);
        this.testResults.push(result);
      }

      this.printTestSummary();

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      this.stopServer();
    }
  }

  printTestSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\nFailed tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(50));
  }

  stopServer() {
    if (this.serverProcess) {
      console.log('\nStopping server...');
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }
}

// 运行测试
const tester = new MCPTester();

// 处理进程退出
process.on('SIGINT', () => {
  tester.stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  tester.stopServer();
  process.exit(0);
});

// 开始测试
tester.runAllTests().catch(console.error);