# AKShare MCP Server

[English](./README.md) | [中文版](./README_CN.md)

A powerful financial data MCP (Model Context Protocol) server based on AKShare, providing AI assistants with comprehensive financial data retrieval capabilities.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **Python**: 3.8 or higher

### Installation

```bash
# 1. Clone the project
git clone https://github.com/jadenmong/akshare-mcp-server.git
cd akshare-mcp-server

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the server
npm start
```

## ⚙️ Configuration

### Claude Desktop Configuration

Add the following configuration to your Claude Desktop configuration file:

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
      "description": "AKShare Financial Data MCP Server"
    }
  }
}
```

**Note**: Please update the path `E:\\akshare-mcp-server\\src\\server.js` to your actual project path.

## 📋 Available Tools

### 📈 Stock Data
- **Historical Data**: `get_stock_historical_data` - Get A-share historical data
- **Real-time Quotes**: `get_stock_realtime_data` - Get A-share real-time quotes
- **Stock List**: `get_stock_list` - Get A-share stock list

### 💰 Fund Data
- **Fund Information**: `get_fund_info` - Get fund basic information
- **Fund List**: `get_fund_list` - Get fund list
- **Fund Rankings**: Fund performance rankings

### 📊 Futures Data
- **Futures Information**: `get_futures_info` - Get futures market data
- **Real-time Quotes**: Real-time futures quotes
- **Historical Data**: Futures historical data

### 🏭 Economic Data
- **Economic Indicators**: `get_economic_data` - Get macroeconomic data
- **GDP Data**: Gross Domestic Product
- **CPI Data**: Consumer Price Index
- **PMI Data**: Purchasing Managers' Index

## 🏗️ Project Structure

```
akshare-mcp-server/
├── src/
│   ├── server.js              # Main MCP server
│   └── tools/                 # Financial data tool modules
├── test/
│   └── test_client.js         # Test client
├── requirements.txt           # Python dependencies
├── package.json               # Node.js configuration
├── README.md                  # English documentation
├── README_CN.md              # Chinese documentation
└── LICENSE                    # Open source license
```

## 📝 Usage Examples

### Stock Data Examples

#### Get Stock Historical Data
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

#### Get Stock Real-time Quotes
```json
{
  "name": "get_stock_realtime_data",
  "arguments": {
    "symbol": "000001"
  }
}
```

#### Get Stock List
```json
{
  "name": "get_stock_list",
  "arguments": {
    "market": "all"
  }
}
```

### Fund Data Examples

#### Get Fund Information
```json
{
  "name": "get_fund_info",
  "arguments": {
    "symbol": "510050"
  }
}
```

#### Get Fund List
```json
{
  "name": "get_fund_list",
  "arguments": {
    "type": "etf"
  }
}
```

### Futures Data Examples

#### Get Futures Information
```json
{
  "name": "get_futures_info",
  "arguments": {
    "symbol": "ag",
    "exchange": "SHFE"
  }
}
```

### Economic Data Examples

#### Get Economic Indicators
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

## 🔧 Development and Testing

### Run Tests
```bash
npm test
```

### Development Mode (with auto-restart)
```bash
npm run dev
```

## 🔍 Troubleshooting

### Common Issues

1. **Node.js Version Too Low**
   ```
   Error: Node.js version 18.0.0 or higher required
   Solution: Upgrade Node.js to the latest LTS version
   ```

2. **Python Dependencies Installation Failed**
   ```bash
   # Try using a domestic mirror
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

3. **Claude Desktop Connection Failed**
   - Check if the configuration file path is correct
   - Confirm that the server.js file path exists
   - Restart the Claude Desktop application

4. **Data Retrieval Failed**
   - Check network connection
   - Confirm AKShare library is working properly
   - Check server log output

### Debug Mode

Start the server with detailed logging:
```bash
DEBUG=akshare:* npm start
```

## 🔧 Technical Features

- ⚡ **High Performance**: Asynchronous processing with concurrent request support
- 🛡️ **Type Safety**: Strict parameter validation using Zod
- 🌉 **Python Bridge**: Call AKShare library through subprocess
- 🔧 **Modular Design**: Tools organized by financial product category
- 📊 **Data Standardization**: Unified data format and error handling
- 🚀 **Easy to Extend**: Simple tool definition and addition mechanism

## 📄 License

This project is open source under the MIT License.

## 🙏 Acknowledgments

- [AKShare](https://github.com/akfamily/akshare) - Powerful financial data API library
- [Model Context Protocol](https://modelcontextprotocol.io/) - Standardized tool interface protocol

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve this project!

## 📞 Support

If you encounter issues during use, please:
1. Check the troubleshooting section of this documentation
2. Submit an Issue on GitHub
3. Check the AKShare official documentation

## 📚 Documentation

- For detailed documentation in Chinese, see [README_CN.md](./README_CN.md)
- For the original AKShare documentation, visit [AKShare GitHub](https://github.com/akfamily/akshare)