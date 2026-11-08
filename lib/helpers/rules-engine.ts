/**
 * Transaction Rules Engine - Linear Scan Filter
 *
 * This implements a simple keyword-based categorization engine.
 *
 * How it works:
 * 1. Selection: Filter rules by userId (entityId)
 * 2. Iteration: Loop through each transaction
 * 3. Nested Search: For each transaction, loop through rules
 * 4. String Matching: Compare payee/description with rule keywords
 * 5. State Update: Apply matched category to transaction
 */

export interface Rule {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  keyword: string;
  matchType: "contains" | "startsWith" | "equals";
  priority?: number; // For future use - lower number = higher priority
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  description: string;
  merchant: string;
  amount: number;
  category?: string;
  status: string;
  cardLastFour: string;
  type: string;
}

export interface CategorizedTransaction extends Transaction {
  category: string;
  matchedRule?: {
    ruleId: string;
    keyword: string;
    matchType: string;
  };
}

/**
 * Linear Scan Filter - Categorizes transactions using keyword rules
 *
 * @param transactions - Array of transactions to categorize
 * @param rules - Array of rules belonging to the current user
 * @param userId - Current user's ID for filtering
 * @returns Array of transactions with categories applied
 */
export function categorizeTransactionsWithRules(
  transactions: Transaction[],
  rules: Rule[],
  userId: string
): CategorizedTransaction[] {
  // Step 1: Selection - Filter rules for current user and active rules only
  const userRules = rules.filter(
    (rule) => rule.userId === userId && rule.isActive
  );

  // Sort rules by priority if available (lower number = higher priority)
  const sortedRules = [...userRules].sort((a, b) => {
    const priorityA = a.priority ?? 999;
    const priorityB = b.priority ?? 999;
    return priorityA - priorityB;
  });

  // Step 2: Iteration - Loop through every transaction
  const categorizedTransactions: CategorizedTransaction[] = [];

  for (const transaction of transactions) {
    let categorized: CategorizedTransaction = {
      ...transaction,
      category: transaction.category || "uncategorized",
    };

    // Skip if already manually categorized
    if (transaction.category && transaction.category !== "uncategorized") {
      categorizedTransactions.push(categorized);
      continue;
    }

    // Step 3: Nested Search - Loop through rules for this transaction
    const payee = transaction.description || transaction.merchant || "";
    const payeeLower = payee.toLowerCase();

    for (const rule of sortedRules) {
      const keywordLower = rule.keyword.toLowerCase();

      // Step 4: String Matching - Check if rule matches
      let isMatch = false;

      switch (rule.matchType) {
        case "contains":
          isMatch = payeeLower.includes(keywordLower);
          break;
        case "startsWith":
          isMatch = payeeLower.startsWith(keywordLower);
          break;
        case "equals":
          isMatch = payeeLower === keywordLower;
          break;
        default:
          isMatch = payeeLower.includes(keywordLower);
      }

      // Step 5: State Update - If match found, apply category
      if (isMatch) {
        categorized = {
          ...categorized,
          category: rule.categoryId,
          matchedRule: {
            ruleId: rule.id,
            keyword: rule.keyword,
            matchType: rule.matchType,
          },
        };
        // Use first matching rule (highest priority)
        break;
      }
    }

    categorizedTransactions.push(categorized);
  }

  return categorizedTransactions;
}

/**
 * Generate rules from category keywords (backward compatibility)
 * Converts existing category-keyword system to rules format
 */
export function generateRulesFromCategories(
  categories: Array<{
    id: string;
    name: string;
    keywords: string[];
  }>,
  userId: string
): Rule[] {
  const rules: Rule[] = [];

  categories.forEach((category, categoryIndex) => {
    category.keywords.forEach((keyword, keywordIndex) => {
      rules.push({
        id: `rule-${category.id}-${keywordIndex}`,
        userId,
        categoryId: category.id,
        categoryName: category.name,
        keyword: keyword.trim().toLowerCase(),
        matchType: "contains", // Default to contains for backward compatibility
        priority: categoryIndex * 100 + keywordIndex, // Maintain category order
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  return rules;
}

/**
 * Create a single rule
 */
export function createRule(
  userId: string,
  categoryId: string,
  categoryName: string,
  keyword: string,
  matchType: "contains" | "startsWith" | "equals" = "contains",
  priority?: number
): Rule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    categoryId,
    categoryName,
    keyword: keyword.trim().toLowerCase(),
    matchType,
    priority,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Test a single transaction against all rules
 * Useful for debugging or preview
 */
export function testTransactionAgainstRules(
  transaction: Transaction,
  rules: Rule[],
  userId: string
): {
  matchedRule: Rule | null;
  category: string;
} {
  const userRules = rules.filter(
    (rule) => rule.userId === userId && rule.isActive
  );

  const sortedRules = [...userRules].sort((a, b) => {
    const priorityA = a.priority ?? 999;
    const priorityB = b.priority ?? 999;
    return priorityA - priorityB;
  });

  const payee = transaction.description || transaction.merchant || "";
  const payeeLower = payee.toLowerCase();

  for (const rule of sortedRules) {
    const keywordLower = rule.keyword.toLowerCase();
    let isMatch = false;

    switch (rule.matchType) {
      case "contains":
        isMatch = payeeLower.includes(keywordLower);
        break;
      case "startsWith":
        isMatch = payeeLower.startsWith(keywordLower);
        break;
      case "equals":
        isMatch = payeeLower === keywordLower;
        break;
      default:
        isMatch = payeeLower.includes(keywordLower);
    }

    if (isMatch) {
      return {
        matchedRule: rule,
        category: rule.categoryId,
      };
    }
  }

  return {
    matchedRule: null,
    category: "uncategorized",
  };
}
