import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

// AI Chat endpoint
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, appData, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Analyze the message and app data to generate a response
    const response = await generateAIResponse(message, appData, context);
    
    res.json({ response });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

// AI response generation function
async function generateAIResponse(message, appData, context) {
  const lowerMessage = message.toLowerCase();
  
  // Extract insights from app data
  const insights = analyzeAppData(appData);
  
  // Handle different types of queries
  if (lowerMessage.includes('expense') || lowerMessage.includes('spending')) {
    return generateExpenseInsights(insights, lowerMessage);
  } else if (lowerMessage.includes('sale') || lowerMessage.includes('revenue') || lowerMessage.includes('income')) {
    return generateSalesInsights(insights, lowerMessage);
  } else if (lowerMessage.includes('category') || lowerMessage.includes('categories')) {
    return generateCategoryInsights(insights, lowerMessage);
  } else if (lowerMessage.includes('trend') || lowerMessage.includes('compare') || lowerMessage.includes('month')) {
    return generateTrendInsights(insights, lowerMessage);
  } else if (lowerMessage.includes('insight') || lowerMessage.includes('analysis') || lowerMessage.includes('summary')) {
    return generateGeneralInsights(insights, lowerMessage);
  } else if (lowerMessage.includes('reduce') || lowerMessage.includes('save') || lowerMessage.includes('optimize')) {
    return generateOptimizationSuggestions(insights, lowerMessage);
  } else {
    return generateGeneralResponse(insights, message);
  }
}

// Analyze app data to extract insights
function analyzeAppData(appData) {
  if (!appData) {
    return {
      totalExpenses: 0,
      totalSales: 0,
      expenseCategories: {},
      topExpenseCategories: [],
      monthlyExpenses: {},
      monthlySales: {},
      averageExpense: 0,
      averageSale: 0,
      expenseCount: 0,
      saleCount: 0
    };
  }

  const { expenses = [], sales = [], categories = [] } = appData;
  
  // Calculate total expenses and sales
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalSales = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
  
  // Analyze expense categories
  const expenseCategories = {};
  expenses.forEach(exp => {
    if (exp.category) {
      expenseCategories[exp.category] = (expenseCategories[exp.category] || 0) + (exp.amount || 0);
    }
  });
  
  // Get top expense categories
  const topExpenseCategories = Object.entries(expenseCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));
  
  // Monthly analysis
  const monthlyExpenses = {};
  const monthlySales = {};
  
  expenses.forEach(exp => {
    if (exp.date) {
      const month = new Date(exp.date).toISOString().slice(0, 7); // YYYY-MM
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (exp.amount || 0);
    }
  });
  
  sales.forEach(sale => {
    if (sale.date) {
      const month = new Date(sale.date).toISOString().slice(0, 7); // YYYY-MM
      monthlySales[month] = (monthlySales[month] || 0) + (sale.amount || 0);
    }
  });
  
  return {
    totalExpenses,
    totalSales,
    expenseCategories,
    topExpenseCategories,
    monthlyExpenses,
    monthlySales,
    averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
    averageSale: sales.length > 0 ? totalSales / sales.length : 0,
    expenseCount: expenses.length,
    saleCount: sales.length,
    categories: categories
  };
}

// Generate expense-related insights
function generateExpenseInsights(insights, message) {
  const { totalExpenses, topExpenseCategories, averageExpense, expenseCount, monthlyExpenses } = insights;
  
  if (message.includes('summary') || message.includes('overview')) {
    return `Here's your expense summary:
• Total Expenses: ₹${totalExpenses.toLocaleString()}
• Number of Expenses: ${expenseCount}
• Average Expense: ₹${averageExpense.toFixed(2)}
• Top Spending Category: ${topExpenseCategories[0]?.category || 'N/A'} (₹${topExpenseCategories[0]?.amount?.toLocaleString() || 0})`;
  }
  
  if (message.includes('category') || message.includes('categories')) {
    if (topExpenseCategories.length === 0) {
      return "You haven't recorded any expenses yet. Start tracking your expenses to see category breakdowns!";
    }
    
    let response = "Here are your top spending categories:\n";
    topExpenseCategories.forEach((cat, index) => {
      const percentage = ((cat.amount / totalExpenses) * 100).toFixed(1);
      response += `${index + 1}. ${cat.category}: ₹${cat.amount.toLocaleString()} (${percentage}%)\n`;
    });
    return response;
  }
  
  if (message.includes('month') || message.includes('trend')) {
    const months = Object.keys(monthlyExpenses).sort().slice(-3);
    if (months.length === 0) {
      return "You haven't recorded any expenses yet. Start tracking to see monthly trends!";
    }
    
    let response = "Here are your recent monthly expenses:\n";
    months.forEach(month => {
      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      response += `• ${monthName}: ₹${monthlyExpenses[month].toLocaleString()}\n`;
    });
    return response;
  }
  
  return `Your total expenses are ₹${totalExpenses.toLocaleString()} across ${expenseCount} transactions. The average expense is ₹${averageExpense.toFixed(2)}.`;
}

// Generate sales-related insights
function generateSalesInsights(insights, message) {
  const { totalSales, saleCount, averageSale, monthlySales } = insights;
  
  if (message.includes('summary') || message.includes('overview')) {
    return `Here's your sales summary:
• Total Sales: ₹${totalSales.toLocaleString()}
• Number of Sales: ${saleCount}
• Average Sale: ₹${averageSale.toFixed(2)}`;
  }
  
  if (message.includes('trend') || message.includes('month')) {
    const months = Object.keys(monthlySales).sort().slice(-3);
    if (months.length === 0) {
      return "You haven't recorded any sales yet. Start tracking to see sales trends!";
    }
    
    let response = "Here are your recent monthly sales:\n";
    months.forEach(month => {
      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      response += `• ${monthName}: ₹${monthlySales[month].toLocaleString()}\n`;
    });
    return response;
  }
  
  return `Your total sales are ₹${totalSales.toLocaleString()} across ${saleCount} transactions. The average sale is ₹${averageSale.toFixed(2)}.`;
}

// Generate category insights
function generateCategoryInsights(insights, message) {
  const { categories, expenseCategories } = insights;
  
  if (categories.length === 0) {
    return "You haven't set up any categories yet. Create categories to better organize your expenses!";
  }
  
  let response = `You have ${categories.length} expense categories:\n`;
  categories.forEach(cat => {
    const totalSpent = expenseCategories[cat.name] || 0;
    response += `• ${cat.name}: ₹${totalSpent.toLocaleString()}\n`;
  });
  
  return response;
}

// Generate trend insights
function generateTrendInsights(insights, message) {
  const { monthlyExpenses, monthlySales } = insights;
  
  const expenseMonths = Object.keys(monthlyExpenses).sort();
  const salesMonths = Object.keys(monthlySales).sort();
  
  if (expenseMonths.length < 2 && salesMonths.length < 2) {
    return "You need more data to analyze trends. Continue tracking your expenses and sales for at least 2 months to see meaningful trends.";
  }
  
  let response = "Here are your recent trends:\n\n";
  
  if (expenseMonths.length >= 2) {
    response += "Expense Trends:\n";
    const lastTwoExpenses = expenseMonths.slice(-2);
    const change = monthlyExpenses[lastTwoExpenses[1]] - monthlyExpenses[lastTwoExpenses[0]];
    const changePercent = ((change / monthlyExpenses[lastTwoExpenses[0]]) * 100).toFixed(1);
    const trend = change > 0 ? "increased" : "decreased";
    response += `• Expenses ${trend} by ${Math.abs(changePercent)}% from ${lastTwoExpenses[0]} to ${lastTwoExpenses[1]}\n`;
  }
  
  if (salesMonths.length >= 2) {
    response += "\nSales Trends:\n";
    const lastTwoSales = salesMonths.slice(-2);
    const change = monthlySales[lastTwoSales[1]] - monthlySales[lastTwoSales[0]];
    const changePercent = ((change / monthlySales[lastTwoSales[0]]) * 100).toFixed(1);
    const trend = change > 0 ? "increased" : "decreased";
    response += `• Sales ${trend} by ${Math.abs(changePercent)}% from ${lastTwoSales[0]} to ${lastTwoSales[1]}\n`;
  }
  
  return response;
}

// Generate optimization suggestions
function generateOptimizationSuggestions(insights, message) {
  const { topExpenseCategories, totalExpenses, averageExpense } = insights;
  
  if (topExpenseCategories.length === 0) {
    return "Start tracking your expenses to get personalized optimization suggestions!";
  }
  
  const topCategory = topExpenseCategories[0];
  const topCategoryPercentage = ((topCategory.amount / totalExpenses) * 100).toFixed(1);
  
  let response = "Here are some optimization suggestions:\n\n";
  
  if (topCategoryPercentage > 50) {
    response += `⚠️ Your top category (${topCategory.category}) represents ${topCategoryPercentage}% of total expenses. Consider:\n`;
    response += `• Reviewing if all expenses in this category are necessary\n`;
    response += `• Looking for ways to reduce costs in this area\n`;
    response += `• Setting a budget limit for this category\n\n`;
  }
  
  response += "General tips:\n";
  response += "• Track all expenses, even small ones\n";
  response += "• Set monthly budgets for each category\n";
  response += "• Review expenses weekly to identify patterns\n";
  response += "• Look for recurring expenses you can reduce or eliminate\n";
  
  return response;
}

// Generate general insights
function generateGeneralInsights(insights, message) {
  const { totalExpenses, totalSales, expenseCount, saleCount, topExpenseCategories } = insights;
  
  const netIncome = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? ((netIncome / totalSales) * 100).toFixed(1) : 0;
  
  let response = "Here's your financial overview:\n\n";
  response += `💰 Total Revenue: ₹${totalSales.toLocaleString()}\n`;
  response += `💸 Total Expenses: ₹${totalExpenses.toLocaleString()}\n`;
  response += `📊 Net Income: ₹${netIncome.toLocaleString()}\n`;
  response += `📈 Profit Margin: ${profitMargin}%\n\n`;
  
  if (topExpenseCategories.length > 0) {
    response += "Top spending areas:\n";
    topExpenseCategories.slice(0, 3).forEach((cat, index) => {
      response += `${index + 1}. ${cat.category}: ₹${cat.amount.toLocaleString()}\n`;
    });
  }
  
  if (netIncome < 0) {
    response += "\n⚠️ Your expenses exceed your revenue. Consider reducing expenses or increasing sales.";
  } else if (profitMargin < 10) {
    response += "\n💡 Your profit margin is low. Look for ways to increase revenue or reduce costs.";
  } else {
    response += "\n✅ Great job! You're maintaining a healthy profit margin.";
  }
  
  return response;
}

// Generate general response for unrecognized queries
function generateGeneralResponse(insights, message) {
  return `I understand you're asking about "${message}". I can help you with:
• Expense analysis and summaries
• Sales trends and insights
• Category breakdowns
• Financial optimization suggestions
• Monthly comparisons and trends

Try asking something like "Show me my expense summary" or "What are my top spending categories?"`;
}

export default router; 