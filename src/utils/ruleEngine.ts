import { Node } from '../types/Node';

const validAttributes = ['age', 'department', 'salary', 'experience']; // Add more as needed

export function createRule(ruleString: string): Node {
  const tokens = ruleString.match(/\(|\)|\w+|[<>=]+|\d+|'[^']*'/g) || [];
  
  function parseExpression(): Node {
    if (tokens[0] === '(') {
      tokens.shift();
      const left = parseExpression();
      const operator = tokens.shift();
      const right = parseExpression();
      tokens.shift();
      return { type: 'operator', left, right, operator };
    } else {
      const attribute = tokens.shift() || '';
      if (!validAttributes.includes(attribute)) {
        throw new Error(`Invalid attribute: ${attribute}`);
      }
      const operator = tokens.shift() || '';
      if (!['>', '<', '=', '>=', '<='].includes(operator)) {
        throw new Error(`Invalid operator: ${operator}`);
      }
      const value = tokens.shift() || '';
      return { type: 'operand', attribute, operator, value: value.replace(/'/g, '') };
    }
  }

  try {
    return parseExpression();
  } catch (error) {
    throw new Error(`Invalid rule string: ${(error as Error).message}`);
  }
}

export function combineRules(rules: string[]): Node {
  if (rules.length === 0) {
    throw new Error('No rules provided');
  }
  if (rules.length === 1) {
    return createRule(rules[0]);
  }
  
  const combinedRule: Node = {
    type: 'operator',
    operator: 'AND',
    left: createRule(rules[0]),
    right: combineRules(rules.slice(1))
  };
  
  return combinedRule;
}

export function evaluateRule(rule: Node, data: Record<string, any>): boolean {
  if (rule.type === 'operand') {
    const { attribute, operator, value } = rule;
    const dataValue = data[attribute as string];
    
    if (dataValue === undefined) {
      throw new Error(`Missing attribute in user data: ${attribute}`);
    }

    switch (operator) {
      case '>': return dataValue > Number(value);
      case '<': return dataValue < Number(value);
      case '=': return dataValue === value;
      case '>=': return dataValue >= Number(value);
      case '<=': return dataValue <= Number(value);
      default: return false;
    }
  } else if (rule.type === 'operator') {
    const leftResult = evaluateRule(rule.left as Node, data);
    const rightResult = evaluateRule(rule.right as Node, data);
    
    switch (rule.operator) {
      case 'AND': return leftResult && rightResult;
      case 'OR': return leftResult || rightResult;
      default: return false;
    }
  }
  
  return false;
}

export function modifyRule(rule: Node, path: string[], newValue: any): Node {
  if (path.length === 0) {
    return newValue;
  }

  const [current, ...rest] = path;
  if (rule.type === 'operator') {
    if (current === 'left') {
      return { ...rule, left: modifyRule(rule.left as Node, rest, newValue) };
    } else if (current === 'right') {
      return { ...rule, right: modifyRule(rule.right as Node, rest, newValue) };
    }
  } else if (rule.type === 'operand') {
    return { ...rule, [current]: newValue };
  }

  return rule;
}