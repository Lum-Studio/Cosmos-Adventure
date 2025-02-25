"use strict";

/* =========================
   TOKENIZER
========================= */
class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

function tokenize(s) {
  let tokens = [];
  let i = 0;
  while (i < s.length) {
    let c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/\d/.test(c) || (c === '.' && i + 1 < s.length && /\d/.test(s[i + 1]))) {
      let numStr = c;
      i++;
      while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) {
        numStr += s[i];
        i++;
      }
      tokens.push(new Token("NUMBER", numStr));
      continue;
    }
    if (/[a-zA-Z_.]/.test(c)) {
      let idStr = c;
      i++;
      while (i < s.length && /[a-zA-Z0-9_.]/.test(s[i])) {
        idStr += s[i];
        i++;
      }
      tokens.push(new Token("IDENTIFIER", idStr));
      continue;
    }
    if ("<>!=".includes(c)) {
      let op = c;
      if (i + 1 < s.length && s[i + 1] === "=") {
        op += "=";
        i += 2;
      } else {
        i++;
      }
      tokens.push(new Token("OPERATOR", op));
      continue;
    }
    if ("+-*/%".includes(c)) {
      tokens.push(new Token("OPERATOR", c));
      i++;
      continue;
    }
    if ("()".includes(c)) {
      tokens.push(new Token("PAREN", c));
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push(new Token("COMMA", ","));
      i++;
      continue;
    }
    if (c === "?") {
      tokens.push(new Token("QUESTION", "?"));
      i++;
      continue;
    }
    if (c === ":") {
      tokens.push(new Token("COLON", ":"));
      i++;
      continue;
    }
    if (c === ";") {
      tokens.push(new Token("SEMICOLON", ";"));
      i++;
      continue;
    }
    if (c === "{") {
      tokens.push(new Token("LCURLY", "{"));
      i++;
      continue;
    }
    if (c === "}") {
      tokens.push(new Token("RCURLY", "}"));
      i++;
      continue;
    }
    // Skip any unrecognized character.
    i++;
  }
  tokens.push(new Token("EOF", ""));
  return tokens;
}

/* =========================
   AST NODE CLASSES
========================= */

class ASTNode {
  toMolang() {
    throw new Error("Not implemented");
  }
  toDensityJson() {
    throw new Error("Not implemented");
  }
}

class NumberNode extends ASTNode {
  constructor(valueStr) {
    super();
    this.value = parseFloat(valueStr);
  }
  toMolang() {
    return this.value.toString();
  }
  toDensityJson() {
    return { type: "minecraft:number", value: this.value };
  }
}

class VariableNode extends ASTNode {
  constructor(name) {
    super();
    this.name = name;
  }
  toMolang() {
    return this.name;
  }
  toDensityJson() {
    return { type: "minecraft:variable", name: this.name };
  }
}

class BinaryOpNode extends ASTNode {
  constructor(op, left, right) {
    super();
    this.op = op;
    this.left = left;
    this.right = right;
  }
  toMolang() {
    return "(" + this.left.toMolang() + " " + this.op + " " + this.right.toMolang() + ")";
  }
  toDensityJson() {
    return {
      type: "minecraft:binary_operation",
      operator: this.op,
      left: this.left.toDensityJson(),
      right: this.right.toDensityJson(),
    };
  }
}

class FunctionCallNode extends ASTNode {
  constructor(functionName) {
    super();
    this.functionName = functionName;
    this.arguments = [];
  }
  addArgument(arg) {
    this.arguments.push(arg);
  }
  toMolang() {
    let argsStr = this.arguments.map(arg => arg.toMolang()).join(", ");
    return this.functionName + "(" + argsStr + ")";
  }
  toDensityJson() {
    // Map specific functions to documented density nodes.
    if (this.functionName === "q.noise" && this.arguments.length === 2) {
      return {
        type: "minecraft:noise",
        x: this.arguments[0].toDensityJson(),
        y: this.arguments[1].toDensityJson(),
      };
    } else if (this.functionName === "math.clamp" && this.arguments.length === 3) {
      return {
        type: "minecraft:clamp",
        input: this.arguments[0].toDensityJson(),
        min: this.arguments[1].toDensityJson(),
        max: this.arguments[2].toDensityJson(),
      };
    } else if (this.functionName === "math.floor" && this.arguments.length === 1) {
      return {
        type: "minecraft:floor",
        input: this.arguments[0].toDensityJson(),
      };
    } else if (this.functionName === "math.max" && this.arguments.length === 2) {
      return {
        type: "minecraft:max",
        a: this.arguments[0].toDensityJson(),
        b: this.arguments[1].toDensityJson(),
      };
    }
    // Otherwise, use a generic function node.
    let argsJson = this.arguments.map(arg => arg.toDensityJson());
    return {
      type: "minecraft:function",
      name: this.functionName,
      args: argsJson,
    };
  }
}

class TernaryOpNode extends ASTNode {
  constructor(condition, trueExpr, falseExpr) {
    super();
    this.condition = condition;
    this.trueExpr = trueExpr;
    this.falseExpr = falseExpr;
  }
  toMolang() {
    return (
      "(" +
      this.condition.toMolang() +
      " ? " +
      this.trueExpr.toMolang() +
      " : " +
      this.falseExpr.toMolang() +
      ")"
    );
  }
  toDensityJson() {
    return {
      type: "minecraft:ternary",
      condition: this.condition.toDensityJson(),
      true: this.trueExpr.toDensityJson(),
      false: this.falseExpr.toDensityJson(),
    };
  }
}

class AssignmentNode extends ASTNode {
  constructor(variable, expression) {
    super();
    this.variable = variable; // VariableNode
    this.expression = expression;
  }
  toMolang() {
    return this.variable.toMolang() + " = " + this.expression.toMolang();
  }
  toDensityJson() {
    return {
      type: "minecraft:assign",
      variable: this.variable.toDensityJson(),
      value: this.expression.toDensityJson(),
    };
  }
}

class ReturnNode extends ASTNode {
  constructor(expression) {
    super();
    this.expression = expression;
  }
  toMolang() {
    return "return " + this.expression.toMolang();
  }
  toDensityJson() {
    return {
      type: "minecraft:return",
      value: this.expression.toDensityJson(),
    };
  }
}

class BlockNode extends ASTNode {
  constructor() {
    super();
    this.statements = [];
  }
  addStatement(stmt) {
    this.statements.push(stmt);
  }
  toMolang() {
    return "{ " + this.statements.map(s => s.toMolang()).join("; ") + " }";
  }
  toDensityJson() {
    return {
      type: "minecraft:block",
      statements: this.statements.map(s => s.toDensityJson()),
    };
  }
}

class LoopNode extends ASTNode {
  constructor(iterations, body) {
    super();
    this.iterations = iterations;
    this.body = body; // BlockNode
  }
  toMolang() {
    return "loop(" + this.iterations.toMolang() + ", " + this.body.toMolang() + ")";
  }
  toDensityJson() {
    return {
      type: "minecraft:loop",
      iterations: this.iterations.toDensityJson(),
      body: this.body.toDensityJson(),
    };
  }
}

/* =========================
   PARSER
========================= */

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  current() {
    return this.tokens[this.pos];
  }
  advance() {
    if (this.pos < this.tokens.length - 1) this.pos++;
  }
  expect(type, value = "") {
    let tok = this.current();
    if (tok.type !== type || (value !== "" && tok.value !== value))
      throw new Error(
        "Expected token " +
          type +
          " " +
          value +
          " but got " +
          tok.type +
          " " +
          tok.value
      );
    this.advance();
  }
  // program = { statement ";" }+
  parseProgram() {
    let block = new BlockNode();
    while (this.current().type !== "EOF") {
      let stmt = this.parseStatement();
      block.addStatement(stmt);
      if (this.current().type === "SEMICOLON") this.advance();
    }
    return block;
  }
  // statement: "return" expression | "loop" "(" expression "," block ")" | expression (optionally assignment)
  parseStatement() {
    if (this.current().type === "IDENTIFIER" && this.current().value === "return") {
      this.advance();
      return new ReturnNode(this.parseExpression());
    }
    if (this.current().type === "IDENTIFIER" && this.current().value === "loop") {
      return this.parseLoopStatement();
    }
    let expr = this.parseExpression();
    if (
      expr instanceof VariableNode &&
      this.current().type === "OPERATOR" &&
      this.current().value === "="
    ) {
      let varNode = expr;
      this.advance(); // consume '='
      let rightExpr = this.parseExpression();
      return new AssignmentNode(varNode, rightExpr);
    }
    return expr;
  }
  parseLoopStatement() {
    this.advance(); // consume "loop"
    this.expect("PAREN", "(");
    let iterations = this.parseExpression();
    this.expect("COMMA", ",");
    let body = this.parseBlock();
    this.expect("PAREN", ")");
    return new LoopNode(iterations, body);
  }
  parseBlock() {
    this.expect("LCURLY", "{");
    let block = new BlockNode();
    while (this.current().type !== "RCURLY") {
      let stmt = this.parseStatement();
      block.addStatement(stmt);
      if (this.current().type === "SEMICOLON") this.advance();
    }
    this.expect("RCURLY", "}");
    return block;
  }
  parseExpression() {
    return this.parseTernary();
  }
  parseTernary() {
    let cond = this.parseComparison();
    if (this.current().type === "QUESTION") {
      this.advance();
      let trueExpr = this.parseExpression();
      this.expect("COLON", ":");
      let falseExpr = this.parseExpression();
      return new TernaryOpNode(cond, trueExpr, falseExpr);
    }
    return cond;
  }
  parseComparison() {
    let node = this.parseAdditive();
    while (
      this.current().type === "OPERATOR" &&
      ["<", ">", "<=", ">=", "==", "!="].includes(this.current().value)
    ) {
      let op = this.current().value;
      this.advance();
      let right = this.parseAdditive();
      node = new BinaryOpNode(op, node, right);
    }
    return node;
  }
  parseAdditive() {
    let node = this.parseMultiplicative();
    while (
      this.current().type === "OPERATOR" &&
      (this.current().value === "+" || this.current().value === "-")
    ) {
      let op = this.current().value;
      this.advance();
      let right = this.parseMultiplicative();
      node = new BinaryOpNode(op, node, right);
    }
    return node;
  }
  parseMultiplicative() {
    let node = this.parseUnary();
    while (
      this.current().type === "OPERATOR" &&
      (this.current().value === "*" ||
        this.current().value === "/" ||
        this.current().value === "%")
    ) {
      let op = this.current().value;
      this.advance();
      let right = this.parseUnary();
      node = new BinaryOpNode(op, node, right);
    }
    return node;
  }
  parseUnary() {
    if (
      this.current().type === "OPERATOR" &&
      (this.current().value === "+" || this.current().value === "-")
    ) {
      let op = this.current().value;
      this.advance();
      let node = this.parseUnary();
      return new BinaryOpNode(op, new NumberNode("0"), node);
    }
    return this.parsePrimary();
  }
  parsePrimary() {
    let tok = this.current();
    if (tok.type === "NUMBER") {
      this.advance();
      return new NumberNode(tok.value);
    }
    if (tok.type === "IDENTIFIER") {
      let id = tok.value;
      this.advance();
      if (this.current().type === "PAREN" && this.current().value === "(")
        return this.parseFunctionCall(id);
      return new VariableNode(id);
    }
    if (tok.type === "PAREN" && tok.value === "(") {
      this.advance();
      let node = this.parseExpression();
      this.expect("PAREN", ")");
      return node;
    }
    if (tok.type === "LCURLY") {
      return this.parseBlock();
    }
    throw new Error("Unexpected token in primary: " + tok.value);
  }
  parseFunctionCall(funcName) {
    this.expect("PAREN", "(");
    let funcCall = new FunctionCallNode(funcName);
    if (!(this.current().type === "PAREN" && this.current().value === ")")) {
      funcCall.addArgument(this.parseExpression());
      while (this.current().type === "COMMA") {
        this.advance();
        funcCall.addArgument(this.parseExpression());
      }
    }
    this.expect("PAREN", ")");
    return funcCall;
  }
}

/* =========================
   REVERSE CONVERSION: Density JSON → Molang
   (Based on the node "type" field)
========================= */
function densityJsonToAst(djson) {
  switch (djson.type) {
    case "minecraft:number":
      return new NumberNode(djson.value.toString());
    case "minecraft:variable":
      return new VariableNode(djson.name);
    case "minecraft:binary_operation":
      return new BinaryOpNode(
        djson.operator,
        densityJsonToAst(djson.left),
        densityJsonToAst(djson.right)
      );
    case "minecraft:noise":
      {
        let func = new FunctionCallNode("q.noise");
        func.addArgument(densityJsonToAst(djson.x));
        func.addArgument(densityJsonToAst(djson.y));
        return func;
      }
    case "minecraft:clamp":
      {
        let func = new FunctionCallNode("math.clamp");
        func.addArgument(densityJsonToAst(djson.input));
        func.addArgument(densityJsonToAst(djson.min));
        func.addArgument(densityJsonToAst(djson.max));
        return func;
      }
    case "minecraft:floor":
      {
        let func = new FunctionCallNode("math.floor");
        func.addArgument(densityJsonToAst(djson.input));
        return func;
      }
    case "minecraft:max":
      {
        let func = new FunctionCallNode("math.max");
        func.addArgument(densityJsonToAst(djson.a));
        func.addArgument(densityJsonToAst(djson.b));
        return func;
      }
    case "minecraft:ternary":
      return new TernaryOpNode(
        densityJsonToAst(djson.condition),
        densityJsonToAst(djson.true),
        densityJsonToAst(djson.false)
      );
    case "minecraft:assign":
      return new AssignmentNode(
        densityJsonToAst(djson.variable),
        densityJsonToAst(djson.value)
      );
    case "minecraft:return":
      return new ReturnNode(densityJsonToAst(djson.value));
    case "minecraft:block":
      {
        let block = new BlockNode();
        for (let stmt of djson.statements) {
          block.addStatement(densityJsonToAst(stmt));
        }
        return block;
      }
    case "minecraft:loop":
      return new LoopNode(
        densityJsonToAst(djson.iterations),
        densityJsonToAst(djson.body)
      );
    case "minecraft:function":
      {
        let func = new FunctionCallNode(djson.name);
        for (let arg of djson.args) {
          func.addArgument(densityJsonToAst(arg));
        }
        return func;
      }
    default:
      throw new Error("Unknown density function node type: " + djson.type);
  }
}

function densityToMolang(djson) {
  let ast = densityJsonToAst(djson);
  return ast.toMolang();
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  molangToDensity: function (molangStr) {
    let tokens = tokenize(molangStr);
    let parser = new Parser(tokens);
    let program = parser.parseProgram();
    return program.toDensityJson();
  },
  densityToMolang: densityToMolang,
};
