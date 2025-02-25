"use strict";

/* TOKENIZER */

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

/* AST NODE CLASSES

   Note: The conversion functions below aim to mirror the documented structure
   for Java density functions. For example, "q.noise(a, b)" maps to a JSON node:
     { "type": "minecraft:noise", "x": <density_node>, "y": <density_node> }
   Other function calls are mapped similarly. Variables are kept as simple strings.
*/

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
    // As per documentation, a literal number.
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
    // In official density functions, variables may be implemented as parameters.
    // Here we use a generic "minecraft:variable" node.
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
    // Matches the documented "binary_operation" node.
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
    let argsStr = this.arguments.map((arg) => arg.toMolang()).join(", ");
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
    let argsJson = this.arguments.map((arg) => arg.toDensityJson());
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
    return "{ " + this.statements.map((s) => s.toMolang()).join("; ") + " }";
  }
  toDensityJson() {
    return {
      type: "minecraft:block",
      statements: this.statements.map((s) => s.toDensityJson()),
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

/* PARSER */

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
  // statement: "return" expression | "loop" "(" expression "," block ")" | expression (with optional assignment)
  parseStatement() {
    if (
      this.current().type === "IDENTIFIER" &&
      this.current().value === "return"
    ) {
      this.advance();
      return new ReturnNode(this.parseExpression());
    }
    if (
      this.current().type === "IDENTIFIER" &&
      this.current().value === "loop"
    ) {
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
      // Represent unary as (0 op expression)
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

/* HELPER FUNCTIONS TO PROCESS WORLDGEN JSON */

/**
 * isMolangExpression:
 *   Checks whether a string appears to be a full Molang expression.
 *   This heuristic checks if the string starts with a common variable (e.g. "t." or "v.")
 *   or contains key function calls such as "q.noise(", "math.", "loop(", or "return".
 */
function isMolangExpression(s) {
  s = s.trim();
  return (
    s.startsWith("t.") ||
    s.startsWith("v.") ||
    s.startsWith("q.noise(") ||
    s.includes(" math.") ||
    s.includes("loop(") ||
    s.includes("return")
  );
}

/**
 * convertMolangInJson:
 *   Recursively traverses a JSON object (or array) and, if a value is a string that appears
 *   to be a Molang expression, converts it using the parser into a Density Function JSON node.
 */
function convertMolangInJson(obj) {
  if (typeof obj === "string") {
    if (isMolangExpression(obj)) {
      try {
        let tokens = tokenize(obj);
        let parser = new Parser(tokens);
        let program = parser.parseProgram();
        return program.toDensityJson();
      } catch (e) {
        // If conversion fails, return the original string.
        return obj;
      }
    } else {
      return obj;
    }
  } else if (Array.isArray(obj)) {
    return obj.map((item) => convertMolangInJson(item));
  } else if (typeof obj === "object" && obj !== null) {
    let newObj = {};
    for (let key in obj) {
      newObj[key] = convertMolangInJson(obj[key]);
    }
    return newObj;
  }
  return obj;
}

/* MAIN DEMO */

function main() {
  const molangExample = `
    t.biome = (q.noise(v.originx * 0.005, v.originz * 0.005) + 1) * 0.5;
    t.blend = t.biome * t.biome * (3 - 2 * t.biome);
    v.base = 93;
    v.huge = (q.noise(v.originx * 0.003125, v.originz * 0.003125)
                + 0.25 * q.noise(v.originx * 0.00625, v.originz * 0.00625)
                + 0.0625 * q.noise(v.originx * 0.0125, v.originz * 0.0125)
                + 0.015625 * q.noise(v.originx * 0.025, v.originz * 0.025)) * 12;
    loop(4, {
        v.noise1_val = v.noise1_val + q.noise(v.originx * 0.0125, v.originz * 0.0125) * 1;
        v.noise2_val = v.noise2_val + q.noise(-v.originx * 0.015, -v.originz * 0.015) * 1;
    });
    t.height = t.blend * (90 + v.noise1_val) + ((1 - t.blend) * (v.base + v.huge));
    t.layer = (math.floor(t.height) < 92 ? math.floor(t.height) - 92 : 0)
  `;

  try {
    let tokens = tokenize(molangExample);
    let parser = new Parser(tokens);
    let program = parser.parseProgram();
    let densityJson = program.toDensityJson();
    console.log("=== Converted Density Function JSON ===");
    console.log(JSON.stringify(densityJson, null, 2));
  } catch (e) {
    console.error("Error: " + e.message);
  }

  // Example worldgen JSON snippet.
  let worldgenJson = {
    format_version: "1.20.20",
    "minecraft:scatter_feature": {
      description: { identifier: "cosmos:mars/base/layer_picker" },
      places_feature: "cosmos:mars/base/block_picker",
      iterations: "t.height",
      x: 0,
      z: "t.layer = t.layer + 1; return 0;",
      y: {
        distribution: "fixed_grid",
        extent: [0, "t.height - 1"],
      },
    },
  };

  console.log("\n=== Original Worldgen JSON ===");
  console.log(JSON.stringify(worldgenJson, null, 2));

  let convertedWorldgen = convertMolangInJson(worldgenJson);
  console.log("\n=== Converted Worldgen JSON with Molang Expressions Converted ===");
  console.log(JSON.stringify(convertedWorldgen, null, 2));
}

main();
