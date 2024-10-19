import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Node } from '../types/Node';
import { AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

const RuleForm: React.FC = () => {
  const [ruleName, setRuleName] = useState('');
  const [ruleString, setRuleString] = useState('');
  const [rules, setRules] = useState<Array<{ _id: string; name: string; ruleString: string }>>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [userData, setUserData] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get(`${API_URL}/rules`);
      setRules(response.data);
    } catch (error) {
      setError('Error fetching rules');
    }
  };

  const handleCreateRule = async () => {
    try {
      await axios.post(`${API_URL}/rules`, { name: ruleName, ruleString });
      setRuleName('');
      setRuleString('');
      fetchRules();
      setError(null);
    } catch (error) {
      setError(`Error creating rule: ${(error as Error).message}`);
    }
  };

  const handleEvaluateRule = async () => {
    if (selectedRules.length === 0) {
      setError('Please select at least one rule');
      return;
    }

    try {
      const data = JSON.parse(userData);
      const response = await axios.post(`${API_URL}/evaluate`, {
        ruleIds: selectedRules,
        userData: data,
      });
      setResult(response.data.result);
      setError(null);
    } catch (error) {
      setError(`Error evaluating rule: ${(error as Error).message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">Rule Engine</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name:</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder="Enter rule name"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Rule String:</label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          rows={5}
          value={ruleString}
          onChange={(e) => setRuleString(e.target.value)}
          placeholder="Enter rule string"
        />
      </div>
      
      <div className="mb-6">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
          onClick={handleCreateRule}
        >
          Create Rule
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-indigo-600">Saved Rules:</h2>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule._id} className="flex items-center p-2 bg-gray-100 rounded-md">
              <input
                type="checkbox"
                id={rule._id}
                checked={selectedRules.includes(rule._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRules([...selectedRules, rule._id]);
                  } else {
                    setSelectedRules(selectedRules.filter((id) => id !== rule._id));
                  }
                }}
                className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={rule._id} className="flex-grow">
                <span className="font-medium">{rule.name}:</span> {rule.ruleString}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">User Data (JSON):</label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          value={userData}
          onChange={(e) => setUserData(e.target.value)}
          placeholder='{"age": 35, "department": "Sales", "salary": 60000, "experience": 3}'
        />
      </div>
      
      <div className="mb-6">
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-300"
          onClick={handleEvaluateRule}
        >
          Evaluate Rule
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}
      
      {result !== null && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600">Result:</h2>
          <p className={`flex items-center ${result ? "text-green-600" : "text-red-600"}`}>
            {result ? <CheckCircle className="mr-2" /> : <AlertCircle className="mr-2" />}
            {result ? "User is eligible" : "User is not eligible"}
          </p>
        </div>
      )}
    </div>
  );
};

export default RuleForm;