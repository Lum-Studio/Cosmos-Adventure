// molang_to_density.cpp
// Compile with: g++ -std=c++17 molang_to_density.cpp -o molang_to_density
// this doesnt work because we need  nlohmann/json available as "json.hpp"

#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>
#include <sstream>
#include <memory>
#include <cctype>

// Include nlohmann::json library (download from https://github.com/nlohmann/json)
#include "json.hpp"
using json = nlohmann::json;

using namespace std;

//////////////////////////////////////////////
// TOKENIZER
//////////////////////////////////////////////

struct Token {
    string type;
    string value;
};

vector<Token> tokenize(const string &s) {
    vector<Token> tokens;
    size_t i = 0;
    while (i < s.size()) {
        char c = s[i];
        if (isspace(c)) {
            i++;
            continue;
        }
        if (isdigit(c) || (c == '.' && i+1 < s.size() && isdigit(s[i+1]))) {
            string numStr;
            numStr.push_back(c);
            i++;
            while (i < s.size() && (isdigit(s[i]) || s[i]=='.')) {
                numStr.push_back(s[i]);
                i++;
            }
            tokens.push_back({ "NUMBER", numStr });
            continue;
        }
        if (isalpha(c) || c=='_' || c=='.') {
            string idStr;
            idStr.push_back(c);
            i++;
            while (i < s.size() && (isalnum(s[i]) || s[i]=='_' || s[i]=='.')) {
                idStr.push_back(s[i]);
                i++;
            }
            tokens.push_back({ "IDENTIFIER", idStr });
            continue;
        }
        // Multi-character operators for <, >, !, =
        if (c=='<' || c=='>' || c=='!' || c=='=') {
            string op;
            op.push_back(c);
            if (i+1 < s.size() && s[i+1]=='=') {
                op.push_back('=');
                i += 2;
            } else {
                i++;
            }
            tokens.push_back({ "OPERATOR", op });
            continue;
        }
        if (c=='+' || c=='-' || c=='*' || c=='/' || c=='%') {
            tokens.push_back({ "OPERATOR", string(1,c) });
            i++;
            continue;
        }
        if (c=='(' || c==')') {
            tokens.push_back({ "PAREN", string(1,c) });
            i++;
            continue;
        }
        if (c==',') {
            tokens.push_back({ "COMMA", "," });
            i++;
            continue;
        }
        if (c=='?') {
            tokens.push_back({ "QUESTION", "?" });
            i++;
            continue;
        }
        if (c==':') {
            tokens.push_back({ "COLON", ":" });
            i++;
            continue;
        }
        if (c==';') {
            tokens.push_back({ "SEMICOLON", ";" });
            i++;
            continue;
        }
        if (c=='{') {
            tokens.push_back({ "LCURLY", "{" });
            i++;
            continue;
        }
        if (c=='}') {
            tokens.push_back({ "RCURLY", "}" });
            i++;
            continue;
        }
        // Skip any unrecognized character
        i++;
    }
    tokens.push_back({ "EOF", "" });
    return tokens;
}

//////////////////////////////////////////////
// AST NODE CLASSES
//////////////////////////////////////////////

class ASTNode {
public:
    virtual string toMolang() = 0;
    virtual json toDensityJson() = 0;
    virtual ~ASTNode() {}
};

using ASTNodePtr = unique_ptr<ASTNode>;

class NumberNode : public ASTNode {
public:
    double value;
    NumberNode(const string &valStr) {
        value = stod(valStr);
    }
    string toMolang() override {
        return to_string(value);
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:number"}, {"value", value}};
    }
};

class VariableNode : public ASTNode {
public:
    string name;
    VariableNode(const string &n) : name(n) {}
    string toMolang() override {
        return name;
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:variable"}, {"name", name}};
    }
};

class BinaryOpNode : public ASTNode {
public:
    string op;
    ASTNodePtr left, right;
    BinaryOpNode(string op, ASTNodePtr left, ASTNodePtr right)
        : op(op), left(move(left)), right(move(right)) {}
    string toMolang() override {
        return "(" + left->toMolang() + " " + op + " " + right->toMolang() + ")";
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:binary_operation"},
                    {"operator", op},
                    {"left", left->toDensityJson()},
                    {"right", right->toDensityJson()}};
    }
};

class FunctionCallNode : public ASTNode {
public:
    string functionName;
    vector<ASTNodePtr> arguments;
    FunctionCallNode(const string &fname) : functionName(fname) {}
    void addArgument(ASTNodePtr arg) {
        arguments.push_back(move(arg));
    }
    string toMolang() override {
        string result = functionName + "(";
        for (size_t i = 0; i < arguments.size(); i++) {
            result += arguments[i]->toMolang();
            if(i != arguments.size()-1)
                result += ", ";
        }
        result += ")";
        return result;
    }
    json toDensityJson() override {
        // Map specific functions
        if(functionName=="q.noise" && arguments.size()==2) {
            return json{{"type", "minecraft:noise"},
                        {"x", arguments[0]->toDensityJson()},
                        {"y", arguments[1]->toDensityJson()}};
        } else if(functionName=="math.clamp" && arguments.size()==3) {
            return json{{"type", "minecraft:clamp"},
                        {"input", arguments[0]->toDensityJson()},
                        {"min", arguments[1]->toDensityJson()},
                        {"max", arguments[2]->toDensityJson()}};
        } else if(functionName=="math.floor" && arguments.size()==1) {
            return json{{"type", "minecraft:floor"},
                        {"input", arguments[0]->toDensityJson()}};
        } else if(functionName=="math.max" && arguments.size()==2) {
            return json{{"type", "minecraft:max"},
                        {"a", arguments[0]->toDensityJson()},
                        {"b", arguments[1]->toDensityJson()}};
        }
        // Generic function node
        json argsJson = json::array();
        for(auto &arg : arguments)
            argsJson.push_back(arg->toDensityJson());
        return json{{"type", "minecraft:function"},
                    {"name", functionName},
                    {"args", argsJson}};
    }
};

class TernaryOpNode : public ASTNode {
public:
    ASTNodePtr condition, trueExpr, falseExpr;
    TernaryOpNode(ASTNodePtr cond, ASTNodePtr tExpr, ASTNodePtr fExpr)
        : condition(move(cond)), trueExpr(move(tExpr)), falseExpr(move(fExpr)) {}
    string toMolang() override {
        return "(" + condition->toMolang() + " ? " + trueExpr->toMolang() + " : " + falseExpr->toMolang() + ")";
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:ternary"},
                    {"condition", condition->toDensityJson()},
                    {"true", trueExpr->toDensityJson()},
                    {"false", falseExpr->toDensityJson()}};
    }
};

class AssignmentNode : public ASTNode {
public:
    unique_ptr<VariableNode> variable;
    ASTNodePtr expression;
    AssignmentNode(unique_ptr<VariableNode> var, ASTNodePtr expr)
        : variable(move(var)), expression(move(expr)) {}
    string toMolang() override {
        return variable->toMolang() + " = " + expression->toMolang();
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:assign"},
                    {"variable", variable->toDensityJson()},
                    {"value", expression->toDensityJson()}};
    }
};

class ReturnNode : public ASTNode {
public:
    ASTNodePtr expression;
    ReturnNode(ASTNodePtr expr) : expression(move(expr)) {}
    string toMolang() override {
        return "return " + expression->toMolang();
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:return"},
                    {"value", expression->toDensityJson()}};
    }
};

class BlockNode : public ASTNode {
public:
    vector<ASTNodePtr> statements;
    void addStatement(ASTNodePtr stmt) {
        statements.push_back(move(stmt));
    }
    string toMolang() override {
        string res = "{ ";
        for (size_t i = 0; i < statements.size(); i++) {
            res += statements[i]->toMolang();
            if(i < statements.size()-1)
                res += "; ";
        }
        res += " }";
        return res;
    }
    json toDensityJson() override {
        json arr = json::array();
        for(auto &stmt: statements)
            arr.push_back(stmt->toDensityJson());
        return json{{"type", "minecraft:block"}, {"statements", arr}};
    }
};

class LoopNode : public ASTNode {
public:
    ASTNodePtr iterations;
    unique_ptr<BlockNode> body;
    LoopNode(ASTNodePtr iter, unique_ptr<BlockNode> b)
        : iterations(move(iter)), body(move(b)) {}
    string toMolang() override {
        return "loop(" + iterations->toMolang() + ", " + body->toMolang() + ")";
    }
    json toDensityJson() override {
        return json{{"type", "minecraft:loop"},
                    {"iterations", iterations->toDensityJson()},
                    {"body", body->toDensityJson()}};
    }
};

//////////////////////////////////////////////
// PARSER
//////////////////////////////////////////////

class Parser {
public:
    vector<Token> tokens;
    size_t pos = 0;
    
    Parser(const vector<Token> &tokens) : tokens(tokens) { }
    
    Token current() {
        return tokens[pos];
    }
    
    void advance() {
        if(pos < tokens.size()-1)
            pos++;
    }
    
    void expect(const string &type, const string &value="") {
        Token tok = current();
        if(tok.type != type || (!value.empty() && tok.value != value))
            throw runtime_error("Expected token " + type + " " + value + " but got " + tok.type + " " + tok.value);
        advance();
    }
    
    // program = { statement ";" }+
    unique_ptr<BlockNode> parseProgram() {
        auto block = make_unique<BlockNode>();
        while(current().type != "EOF") {
            auto stmt = parseStatement();
            block->addStatement(move(stmt));
            if(current().type == "SEMICOLON")
                advance();
        }
        return block;
    }
    
    // statement: "return" expression | "loop" "(" expression "," block ")" | expression (and check for assignment)
    ASTNodePtr parseStatement() {
        if(current().type == "IDENTIFIER" && current().value == "return") {
            advance();
            return make_unique<ReturnNode>(parseExpression());
        }
        if(current().type == "IDENTIFIER" && current().value == "loop") {
            return parseLoopStatement();
        }
        // Otherwise, parse an expression. If it's an assignment, handle it.
        auto expr = parseExpression();
        if(dynamic_cast<VariableNode*>(expr.get()) != nullptr &&
           current().type == "OPERATOR" && current().value == "=") {
            // Assignment: variable "=" expression
            auto varNode = make_unique<VariableNode>(dynamic_cast<VariableNode*>(expr.release())->name);
            advance(); // consume '='
            auto rightExpr = parseExpression();
            return make_unique<AssignmentNode>(move(varNode), move(rightExpr));
        }
        return expr;
    }
    
    ASTNodePtr parseLoopStatement() {
        // assume current is "loop"
        advance(); // consume "loop"
        expect("PAREN", "(");
        auto iterations = parseExpression();
        expect("COMMA", ",");
        auto body = parseBlock();
        expect("PAREN", ")");
        return make_unique<LoopNode>(move(iterations), move(body));
    }
    
    unique_ptr<BlockNode> parseBlock() {
        expect("LCURLY", "{");
        auto block = make_unique<BlockNode>();
        while(current().type != "RCURLY") {
            auto stmt = parseStatement();
            block->addStatement(move(stmt));
            if(current().type == "SEMICOLON")
                advance();
        }
        expect("RCURLY", "}");
        return block;
    }
    
    // expression = ternary
    ASTNodePtr parseExpression() {
        return parseTernary();
    }
    
    // ternary = comparison ("?" expression ":" expression)?
    ASTNodePtr parseTernary() {
        auto cond = parseComparison();
        if(current().type == "QUESTION") {
            advance();
            auto trueExpr = parseExpression();
            expect("COLON", ":");
            auto falseExpr = parseExpression();
            return make_unique<TernaryOpNode>(move(cond), move(trueExpr), move(falseExpr));
        }
        return cond;
    }
    
    // comparison = additive { ( "<" | ">" | "<=" | ">=" | "==" | "!=" ) additive }
    ASTNodePtr parseComparison() {
        auto node = parseAdditive();
        while(current().type == "OPERATOR" && 
              (current().value=="<" || current().value==">" || current().value=="<=" ||
               current().value==">=" || current().value=="==" || current().value=="!=")) {
            string op = current().value;
            advance();
            auto right = parseAdditive();
            node = make_unique<BinaryOpNode>(op, move(node), move(right));
        }
        return node;
    }
    
    // additive = multiplicative { ("+" | "-") multiplicative }
    ASTNodePtr parseAdditive() {
        auto node = parseMultiplicative();
        while(current().type == "OPERATOR" && (current().value=="+" || current().value=="-")) {
            string op = current().value;
            advance();
            auto right = parseMultiplicative();
            node = make_unique<BinaryOpNode>(op, move(node), move(right));
        }
        return node;
    }
    
    // multiplicative = unary { ("*" | "/" | "%") unary }
    ASTNodePtr parseMultiplicative() {
        auto node = parseUnary();
        while(current().type == "OPERATOR" && (current().value=="*" || current().value=="/" || current().value=="%")) {
            string op = current().value;
            advance();
            auto right = parseUnary();
            node = make_unique<BinaryOpNode>(op, move(node), move(right));
        }
        return node;
    }
    
    // unary = ("+" | "-") unary | primary
    ASTNodePtr parseUnary() {
        if(current().type == "OPERATOR" && (current().value=="+" || current().value=="-")) {
            string op = current().value;
            advance();
            auto node = parseUnary();
            // Represent unary as (0 op expr)
            return make_unique<BinaryOpNode>(op, make_unique<NumberNode>("0"), move(node));
        }
        return parsePrimary();
    }
    
    // primary = NUMBER | IDENTIFIER (function call?) | "(" expression ")" | block
    ASTNodePtr parsePrimary() {
        Token tok = current();
        if(tok.type == "NUMBER") {
            advance();
            return make_unique<NumberNode>(tok.value);
        }
        if(tok.type == "IDENTIFIER") {
            string id = tok.value;
            advance();
            if(current().type == "PAREN" && current().value=="(")
                return parseFunctionCall(id);
            return make_unique<VariableNode>(id);
        }
        if(tok.type == "PAREN" && tok.value=="(") {
            advance();
            auto node = parseExpression();
            expect("PAREN", ")");
            return node;
        }
        if(tok.type == "LCURLY") {
            return parseBlock();
        }
        throw runtime_error("Unexpected token in primary: " + tok.value);
    }
    
    ASTNodePtr parseFunctionCall(const string &funcName) {
        expect("PAREN", "(");
        auto funcCall = make_unique<FunctionCallNode>(funcName);
        if(!(current().type=="PAREN" && current().value==")")) {
            funcCall->addArgument(parseExpression());
            while(current().type=="COMMA") {
                advance();
                funcCall->addArgument(parseExpression());
            }
        }
        expect("PAREN", ")");
        return funcCall;
    }
};

//////////////////////////////////////////////
// MAIN DEMO
//////////////////////////////////////////////

int main() {
    // Example Molang snippet from a Mars worldgen file (extended with assignments, loops, return)
    string molangExample = R"(
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
    )";
    
    try {
        auto tokens = tokenize(molangExample);
        Parser parser(tokens);
        auto program = parser.parseProgram();
        json densityJson = program->toDensityJson();
        cout << "=== Converted Density Function JSON ===" << endl;
        cout << densityJson.dump(2) << endl;
    } catch (const exception &e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
    
    // Example of processing a worldgen JSON snippet:
    json worldgenJson = {
      {"format_version", "1.20.20"},
      {"minecraft:scatter_feature", {
          {"description", { {"identifier", "cosmos:mars/base/layer_picker"} }},
          {"places_feature", "cosmos:mars/base/block_picker"},
          {"iterations", "t.height"},
          {"x", 0},
          {"z", "t.layer = t.layer + 1; return 0;"},
          {"y", {
              {"distribution", "fixed_grid"},
              {"extent", json::array({0, "t.height - 1"})}
          }}
      }}
    };
    
    cout << "\n=== Original Worldgen JSON ===" << endl;
    cout << worldgenJson.dump(2) << endl;
    
    
    
    return 0;
}
