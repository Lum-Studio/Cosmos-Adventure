class MolangExpression {}

class MolangLiteral extends MolangExpression {
    constructor(value) { super(); this.value = value; }
    toMolang() { return this.value.toString(); }
}
class MolangVariable extends MolangExpression {
    constructor(name) { super(); this.name = name; }
    toMolang() { return this.name; }
}
class MolangBinaryOp extends MolangExpression {
    constructor(operator, left, right) { super(); this.operator = operator; this.left = left; this.right = right; }
    toMolang() { return `(${this.left.toMolang()} ${this.operator} ${this.right.toMolang()})`; }
}
class MolangUnaryOp extends MolangExpression {
    constructor(operator, operand) { super(); this.operator = operator; this.operand = operand; }
    toMolang() { return `(${this.operator}${this.operand.toMolang()})`; }
}
class MolangFunctionCall extends MolangExpression {
    constructor(functionName, args = []) { super(); this.functionName = functionName; this.args = args; }
    toMolang() {
        const argsStr = this.args.map(arg => arg.toMolang()).join(', ');
        return `${this.functionName}(${argsStr})`;
    }
}
class MolangConditional extends MolangExpression {
    constructor(condition, trueExpr, falseExpr) { super(); this.condition = condition; this.trueExpr = trueExpr; this.falseExpr = falseExpr; }
    toMolang() { return `(${this.condition.toMolang()} ? ${this.trueExpr.toMolang()} : ${this.falseExpr.toMolang()})`; }
}

function literal(value) { return new MolangLiteral(value); }
function variable(name) { return new MolangVariable(name); }
function add(left, right) { return new MolangBinaryOp('+', left, right); }
function subtract(left, right) { return new MolangBinaryOp('-', left, right); }
function multiply(left, right) { return new MolangBinaryOp('*', left, right); }
function divide(left, right) { return new MolangBinaryOp('/', left, right); }
function negate(expr) { return new MolangUnaryOp('-', expr); }
function conditional(condition, trueExpr, falseExpr) { return new MolangConditional(condition, trueExpr, falseExpr); }
function funcCall(functionName, args = []) { return new MolangFunctionCall(functionName, args); }
function sin(expr) { return funcCall('math.sin', [expr]); }
function cos(expr) { return funcCall('math.cos', [expr]); }
function abs(expr) { return funcCall('math.abs', [expr]); }
function floor(expr) { return funcCall('math.floor', [expr]); }
function ceil(expr) { return funcCall('math.ceil', [expr]); }
function exp(expr) { return funcCall('math.exp', [expr]); }
function log(expr) { return funcCall('math.log', [expr]); }
function sqrt(expr) { return funcCall('math.sqrt', [expr]); }
function pow(base, exponent) { return funcCall('math.pow', [base, exponent]); }


class MolangStatement {}

class AssignmentStatement extends MolangStatement {
    constructor(variableName, expression) { super(); this.variableName = variableName; this.expression = expression; }
    toMolang() { return `${this.variableName} = ${this.expression.toMolang()};`; }
}
class CompoundStatement extends MolangStatement {
    constructor(statements = []) { super(); this.statements = statements; }
    add(statement) { this.statements.push(statement); }
    toMolang() { return this.statements.map(stmt => stmt.toMolang()).join('\n'); }
}
class LoopStatement extends MolangStatement {
    constructor(iterations, bodyCompound) { super(); this.iterations = iterations; this.bodyCompound = bodyCompound; }
    toMolang() { return `loop(${this.iterations.toMolang()}, {\n${this.bodyCompound.toMolang()}\n});`; }
}
class ReturnStatement extends MolangStatement {
    constructor(expression) { super(); this.expression = expression; }
    toMolang() { return `return ${this.expression.toMolang()};`; }
}