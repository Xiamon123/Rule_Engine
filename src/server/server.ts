import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createRule, combineRules, evaluateRule, modifyRule } from '../utils/ruleEngine';
import { Node } from '../types/Node';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ruleEngine');

// Define Rule Schema
const RuleSchema = new mongoose.Schema({
  name: String,
  ruleString: String,
  ast: Object,
});

const Rule = mongoose.model('Rule', RuleSchema);

// API Routes
app.post('/api/rules', async (req, res) => {
  try {
    const { name, ruleString } = req.body;
    const ast = createRule(ruleString);
    const rule = new Rule({ name, ruleString, ast });
    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get('/api/rules', async (req, res) => {
  try {
    const rules = await Rule.find();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const { ruleIds, userData } = req.body;
    const rules = await Rule.find({ _id: { $in: ruleIds } });
    const combinedAst = combineRules(rules.map(rule => rule.ruleString));
    const result = evaluateRule(combinedAst, userData);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.put('/api/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { path, newValue } = req.body;
    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    const updatedAst = modifyRule(rule.ast, path, newValue);
    rule.ast = updatedAst;
    rule.ruleString = JSON.stringify(updatedAst); // This is a simplification, you might want to implement a proper AST to string conversion
    await rule.save();
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});