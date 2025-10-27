# AKShare MCP Server

基于 AKShare 的金融数据 MCP (Model Context Protocol) 服务器，为 AI 助手提供强大的金融数据获取能力。

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **Python**: 3.8 或更高版本

### 安装步骤

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd akshare-mcp-server

# 2. 安装 Node.js 依赖
npm install

# 3. 安装 Python 依赖
pip install -r requirements.txt

# 4. 启动服务器
npm start
```

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
      "args": ["E:\\akshare-mcp-server\\src\\server.js"],
      "env": {},
      "description": "AKShare 金融数据 MCP 服务器"
    }
  }
}
```

**注意**: 请将路径 `E:\\akshare-mcp-server\\src\\server.js` 修改为您实际的项目路径。

## 📋 可用工具

### 📈 股票数据
- **历史行情**: `stock_zh_a_hist` - 获取A股历史数据
- **实时行情**: `stock_zh_a_spot_em` - 获取A股实时行情
- **股票筛选**: `stock_zh_a_filter_em` - A股数据筛选
- **代码对照**: `stock_info_a_code_name_em` - 股票代码名称对照

### 💰 基金数据
- **ETF信息**: `fund_etf_basic_info_em` - ETF基本信息
- **ETF分类**: `fund_etf_category_em` - ETF分类数据
- **基金排行**: `fund_rank_em` - 基金排行榜
- **持仓信息**: `fund_portfolio_em` - 基金持仓明细

### 🏭 宏观经济
- **GDP数据**: `macro_china_gdp` - 国内生产总值
- **CPI数据**: `macro_china_cpi` - 居民消费价格指数
- **PMI数据**: `macro_china_pmi` - 采购经理指数
- **货币供应**: `macro_china_m2` - M2货币供应量
- **利率数据**: `macro_china_interest_rate` - 利率数据

### 📊 期货数据
- **实时行情**: `futures_zh_spot` - 期货实时行情
- **历史数据**: `futures_zh_his` - 期货历史行情
- **持仓排名**: `futures_position_rank_em` - 期货持仓排名
- **库存数据**: `futures_inventory_shfe` - 交易所库存数据

## 🏗️ 项目结构

```
akshare-mcp-server/
├── src/
│   ├── server.js              # MCP 主服务器
│   ├── index.js               # 工具模块统一导出
│   ├── tools/                 # 金融数据工具模块
│   │   ├── stock_tools.js     # 股票工具
│   │   ├── fund_tools.js      # 基金工具
│   │   ├── economic_tools.js  # 宏观经济工具
│   │   └── futures_tools.js   # 期货工具
│   └── utils/
│       └── toolHelpers.js     # 工具辅助函数
├── test/
│   └── test.js                # 测试文件
├── python_bridge.py           # Python 桥接器
├── requirements.txt           # Python 依赖
├── package.json               # Node.js 配置
├── README.md                  # 项目文档
└── LICENSE                    # 开源许可证
```

## 📝 使用示例

### 股票数据示例

#### 获取平安银行历史数据
```json
{
  "name": "stock_zh_a_hist",
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
  "name": "stock_zh_a_spot_em",
  "arguments": {
    "symbol": "000001"
  }
}
```

### 基金数据示例

#### 获取上证50ETF信息
```json
{
  "name": "fund_etf_basic_info_em",
  "arguments": {
    "symbol": "510050"
  }
}
```

#### 获取基金排行榜
```json
{
  "name": "fund_rank_em",
  "arguments": {
    "type": "etf",
    "period": "daily",
    "limit": 20
  }
}
```

### 宏观经济数据示例

#### 获取2023年GDP数据
```json
{
  "name": "macro_china_gdp",
  "arguments": {
    "year": "2023"
  }
}
```

#### 获取最新CPI数据
```json
{
  "name": "macro_china_cpi",
  "arguments": {
    "year": "2024",
    "month": "01"
  }
}
```

### 期货数据示例

#### 获取黄金期货实时行情
```json
{
  "name": "futures_zh_spot",
  "arguments": {
    "symbol": "au",
    "exchange": "SHFE"
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
npm run dev
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

3. **Claude Desktop 无法连接**
   - 检查配置文件路径是否正确
   - 确认 server.js 文件路径是否存在
   - 重启 Claude Desktop 应用

4. **数据获取失败**
   - 检查网络连接
   - 确认 AKShare 库是否正常工作
   - 查看服务器日志输出

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
3. 检查 AKShare 官方文档