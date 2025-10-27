/**
 * 工具辅助函数
 * 为所有工具模块提供通用的辅助函数
 */

/**
 * 生成工具属性
 * @param {Object} schema - Zod schema
 * @returns {Object} 工具属性对象
 */
export function generateToolProperties(schema) {
  const properties = {};

  Object.entries(schema._def.shape()).forEach(([key, value]) => {
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

/**
 * 提取必需字段
 * @param {Object} schema - Zod schema
 * @returns {Array} 必需字段数组
 */
export function extractRequiredFields(schema) {
  const required = [];

  Object.entries(schema._def.shape()).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value._def?.defaultValue === undefined) {
      required.push(key);
    }
  });

  return required;
}

/**
 * 获取值类型
 * @param {Object} value - Zod 值对象
 * @returns {string} 类型名称
 */
export function getValueType(value) {
  if (!value || !value._def) return 'string';

  const def = value._def;

  if (def.typeName === 'ZodString') return 'string';
  if (def.typeName === 'ZodNumber') return 'number';
  if (def.typeName === 'ZodBoolean') return 'boolean';
  if (def.typeName === 'ZodEnum') return 'string';
  if (def.typeName === 'ZodArray') return 'array';
  if (def.typeName === 'ZodObject') return 'object';
  if (def.typeName === 'ZodOptional') return getValueType(value._def.innerType);

  return 'string';
}

/**
 * 生成工具定义
 * @param {Object} toolsMap - 工具映射对象
 * @returns {Array} 工具定义数组
 */
export function generateToolsDefinition(toolsMap) {
  return Object.entries(toolsMap).map(([toolName, toolInfo]) => ({
    name: toolName,
    description: toolInfo.description,
    inputSchema: {
      type: 'object',
      properties: generateToolProperties(toolInfo.schema),
      required: extractRequiredFields(toolInfo.schema)
    }
  }));
}