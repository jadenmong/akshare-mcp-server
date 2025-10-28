# AKShare MCP 服务器

[English](./README.md) | [中文版](./README_CN.md)

基于 AKShare 的强大金融数据 MCP（模型上下文协议）服务器，为 AI 助手提供全面的金融数据检索能力。

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **Python**: 3.8 或更高版本（仅 Python 版本需要）

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/jadenmong/akshare-mcp-server.git
cd akshare-mcp-server

# 2. 安装 Node.js 依赖
npm install

# 3. 启动服务器（HTTP 版本，推荐 - 无需 Python 依赖）
npm start

# 或者启动 Python 版本（需要安装 Python 和 akshare）
npm run start:python
```

### 版本说明

**HTTP 版本（推荐）**:
- ✅ 无需安装 Python 或 akshare
- ✅ 基于 HTTP API，稳定可靠
- ✅ 内置备用数据确保可用性
- ✅ 部署简单

**Python 版本**:
- ✅ 数据更丰富完整
- ❌ 需要本地 Python 环境
- ❌ 依赖 akshare 库安装

## ⚙️ 配置

### Claude Desktop 配置

将以下配置添加到 Claude Desktop 的配置文件中：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "akshare": {
      "command": "node",
      "args": ["E:\\akshare-mcp-server\\src\\http-server.js"],
      "env": {},
      "description": "AKShare Financial Data MCP Server"
    }
  }
}
```

**注意**: 请将路径 `E:\\akshare-mcp-server\\src\\http-server.js` 更新为您的实际项目路径。

## 📋 可用工具

### 📈 股票数据（HTTP + Python 版本）
- **历史数据**: `get_stock_historical_data` - 获取股票历史数据
- **实时行情**: `get_stock_realtime_data` - 获取股票实时报价
- **股票列表**: `get_stock_list` - 获取股票列表

### 🔍 搜索工具（HTTP 版本新增）
- **股票搜索**: `search_stock` - 搜索股票信息

### 💰 基金数据（HTTP + Python 版本）
- **基金列表**: `get_fund_list` - 获取基金列表

### 📊 期货数据（仅 Python 版本）
- **期货信息**: `get_futures_info` - 获取期货市场数据

### 🏭 经济数据（仅 Python 版本）
- **经济指标**: `get_economic_data` - 获取宏观经济数据

### 版本对比

| 功能 | HTTP 版本 | Python 版本 |
|------|-----------|-------------|
| 股票历史数据 | ✅ | ✅ |
| 股票实时数据 | ✅ | ✅ |
| 股票列表 | ✅ | ✅ |
| 股票搜索 | ✅ | ❌ |
| 基金数据 | ✅ | ✅ |
| 期货数据 | ❌ | ✅ |
| 经济数据 | ❌ | ✅ |

## 🏗️ 项目结构

```
akshare-mcp-server/
├── src/
│   ├── server.js              # 基于 Python 的 MCP 服务器
│   ├── http-server.js         # 基于 HTTP 的 MCP 服务器（推荐）
│   └── tools/                 # 金融数据工具模块
├── test/
│   └── test_client.js         # 测试客户端
├── requirements.txt           # Python 依赖
├── package.json               # Node.js 配置
├── README.md                  # 英文文档
├── README_CN.md              # 中文文档
└── LICENSE                    # 开源许可证
```

## 📝 使用示例

### 股票数据示例

#### 获取股票历史数据
```json
{
  "name": "get_stock_historical_data",
  "arguments": {
    "symbol": "000001",
    "period": "daily",
    "start_date": "20240101",
    "end_date": "20240131",
    "adjust": "qfq"
  }
}
```

#### 获取股票实时行情
```json
{
  "name": "get_stock_realtime_data",
  "arguments": {
    "symbol": "000001"
  }
}
```

#### 获取股票列表
```json
{
  "name": "get_stock_list",
  "arguments": {
    "market": "all"
  }
}
```

#### 搜索股票
```json
{
  "name": "search_stock",
  "arguments": {
    "keyword": "平安",
    "market": "all"
  }
}
```

### 基金数据示例

#### 获取基金列表
```json
{
  "name": "get_fund_list",
  "arguments": {
    "type": "etf"
  }
}
```

### 期货数据示例

#### 获取期货信息
```json
{
  "name": "get_futures_info",
  "arguments": {
    "symbol": "ag",
    "exchange": "SHFE"
  }
}
```

### 经济数据示例

#### 获取经济指标
```json
{
  "name": "get_economic_data",
  "arguments": {
    "indicator": "GDP",
    "start_date": "20240101",
    "end_date": "20241231"
  }
}
```

## 🔧 开发和测试

### 运行测试
```bash
npm test
```

### 开发模式（自动重启）
```bash
# HTTP 版本开发模式
npm run dev

# Python 版本开发模式
npm run dev:python
```

## 🔍 故障排除

### 常见问题

1. **Node.js 版本过低**
   ```
   错误: Node.js 版本需要 18.0.0 或更高
   解决: 升级 Node.js 到最新 LTS 版本
   ```

2. **Python 依赖安装失败**
   ```bash
   # 尝试使用国内镜像
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

3. **Claude Desktop 连接失败**
   - 检查配置文件路径是否正确
   - 确认 http-server.js 文件路径存在
   - 重启 Claude Desktop 应用程序

4. **数据获取失败**
   - 检查网络连接
   - 确认 HTTP API 或 AKShare 库正常工作
   - 检查服务器日志输出

### 调试模式

启动服务器时查看详细日志：
```bash
DEBUG=akshare:* npm start
```

## 🔧 技术特点

- ⚡ **高性能**: 异步处理，支持并发请求
- 🛡️ **类型安全**: 使用 Zod 进行严格的参数验证
- 🌉 **Python 桥接**: 通过子进程调用 AKShare 库
- 🔧 **模块化设计**: 按金融产品类别组织工具
- 📊 **数据标准化**: 统一的数据格式和错误处理
- 🚀 **易于扩展**: 简单的工具定义和添加机制

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- [AKShare](https://github.com/akfamily/akshare) - 提供强大的金融数据接口库
- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供标准化工具接口协议

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📞 支持

如果您在使用过程中遇到问题，请：
1. 查看本文档的故障排除部分
2. 在 GitHub 上提交 Issue
3. 查阅 AKShare 官方文档

## 📚 文档

- 详细的中文文档请参阅本文档
- 英文文档请参阅 [README.md](./README.md)
- AKShare 原始文档请访问 [AKShare GitHub](https://github.com/akfamily/akshare)