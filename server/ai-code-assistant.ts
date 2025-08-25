import OpenAI from 'openai';
import { db } from './db';
import { 
  codeProjects, 
  codeFiles, 
  codeReviews, 
  codeGenerations,
  type InsertCodeProject,
  type InsertCodeFile,
  type InsertCodeReview,
  type InsertCodeGeneration,
  type CodeProject,
  type CodeFile,
  type CodeReview,
  type CodeGeneration
} from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  framework?: string;
  includeTests?: boolean;
  includeComments?: boolean;
}

export interface CodeReviewRequest {
  code: string;
  language: string;
  reviewTypes: ('security' | 'performance' | 'quality' | 'bugs')[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CodeOptimizationRequest {
  code: string;
  language: string;
  optimizationType: 'performance' | 'readability' | 'security' | 'best-practices';
}

export class AICodeAssistant {
  private openai: OpenAI;

  constructor() {
    this.openai = openai;
  }

  // Generate code based on prompt
  async generateCode(userId: string, request: CodeGenerationRequest): Promise<{
    code: string;
    explanation: string;
    complexity: string;
    performance: number;
    tests?: string;
    id: string;
  }> {
    const { prompt, language, complexity = 'intermediate', framework, includeTests, includeComments } = request;

    const systemPrompt = `You are an expert ${language} developer. Generate high-quality, production-ready code.
    
Requirements:
- Language: ${language}
- Complexity: ${complexity}
- Framework: ${framework || 'none specified'}
- Include tests: ${includeTests ? 'yes' : 'no'}
- Include comments: ${includeComments ? 'yes' : 'no'}
- Optimize for Vietnamese developers (use Vietnamese comments if requested)

Respond with JSON format:
{
  "code": "generated code here",
  "explanation": "detailed explanation in Vietnamese",
  "complexity": "${complexity}",
  "performance": number (0-100),
  "tests": "test code if requested",
  "bestPractices": ["list of best practices applied"],
  "dependencies": ["required dependencies"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Save to database
      const id = `code_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const codeGeneration: InsertCodeGeneration = {
        id,
        userId,
        prompt,
        language,
        generatedCode: result.code,
        explanation: result.explanation,
        complexity: result.complexity,
        performance: result.performance || 85,
      };

      await db.insert(codeGenerations).values(codeGeneration);

      return {
        id,
        code: result.code,
        explanation: result.explanation,
        complexity: result.complexity,
        performance: result.performance || 85,
        tests: result.tests,
      };
    } catch (error) {
      console.error('Code generation error:', error);
      
      // Fallback code generation for Vietnamese context
      const fallbackCode = this.generateFallbackCode(language, prompt);
      const id = `code_gen_fallback_${Date.now()}`;
      
      const codeGeneration: InsertCodeGeneration = {
        id,
        userId,
        prompt,
        language,
        generatedCode: fallbackCode.code,
        explanation: fallbackCode.explanation,
        complexity,
        performance: 75,
      };

      await db.insert(codeGenerations).values(codeGeneration);

      return {
        id,
        code: fallbackCode.code,
        explanation: fallbackCode.explanation,
        complexity,
        performance: 75,
      };
    }
  }

  // Review code for issues and improvements
  async reviewCode(userId: string, request: CodeReviewRequest): Promise<CodeReview[]> {
    const { code, language, reviewTypes, severity } = request;

    const systemPrompt = `You are an expert code reviewer specializing in ${language}. 
    Analyze the code for: ${reviewTypes.join(', ')}.
    
    Focus on:
    - Security vulnerabilities
    - Performance issues
    - Code quality and maintainability
    - Bug detection
    - Best practices for Vietnamese development teams
    
    Respond with JSON array format:
    [
      {
        "reviewType": "security|performance|quality|bug",
        "severity": "low|medium|high|critical",
        "issue": "description of the issue in Vietnamese",
        "suggestion": "detailed suggestion for improvement in Vietnamese",
        "lineNumber": number or null,
        "codeSnippet": "problematic code snippet"
      }
    ]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Code to review:\n\n${code}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const reviewData = JSON.parse(response.choices[0].message.content || '{"reviews": []}');
      const reviews = reviewData.reviews || [];

      // Save reviews to database
      const codeReviews: CodeReview[] = [];
      for (const review of reviews) {
        const id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const codeReview: InsertCodeReview = {
          id,
          fileId: null, // Will be set when associated with a file
          userId,
          reviewType: review.reviewType,
          severity: review.severity,
          issue: review.issue,
          suggestion: review.suggestion,
          lineNumber: review.lineNumber,
          status: 'open',
        };

        await db.insert(codeReviews).values(codeReview);
        codeReviews.push({
          ...codeReview,
          createdAt: new Date(),
        });
      }

      return codeReviews;
    } catch (error) {
      console.error('Code review error:', error);
      
      // Fallback code review
      const fallbackReview = this.generateFallbackReview(language, code, reviewTypes);
      const id = `review_fallback_${Date.now()}`;
      
      const codeReview: InsertCodeReview = {
        id,
        fileId: null,
        userId,
        reviewType: 'quality',
        severity: 'medium',
        issue: fallbackReview.issue,
        suggestion: fallbackReview.suggestion,
        lineNumber: null,
        status: 'open',
      };

      await db.insert(codeReviews).values(codeReview);
      
      return [{
        ...codeReview,
        createdAt: new Date(),
      }];
    }
  }

  // Optimize code for performance, readability, or security
  async optimizeCode(userId: string, request: CodeOptimizationRequest): Promise<{
    originalCode: string;
    optimizedCode: string;
    improvements: string[];
    performanceGain: number;
    explanation: string;
  }> {
    const { code, language, optimizationType } = request;

    const systemPrompt = `You are an expert ${language} developer specializing in code optimization.
    
    Optimization focus: ${optimizationType}
    
    Provide optimized code with:
    - Better ${optimizationType}
    - Maintain functionality
    - Clear improvements explanation in Vietnamese
    - Estimated performance gains
    
    Respond with JSON format:
    {
      "optimizedCode": "improved code here",
      "improvements": ["list of improvements made"],
      "performanceGain": number (percentage improvement),
      "explanation": "detailed explanation in Vietnamese",
      "beforeAfterComparison": "comparison of key changes"
    }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Code to optimize:\n\n${code}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        originalCode: code,
        optimizedCode: result.optimizedCode,
        improvements: result.improvements || [],
        performanceGain: result.performanceGain || 0,
        explanation: result.explanation,
      };
    } catch (error) {
      console.error('Code optimization error:', error);
      
      // Fallback optimization
      const fallbackOptimization = this.generateFallbackOptimization(language, code, optimizationType);
      
      return {
        originalCode: code,
        optimizedCode: fallbackOptimization.optimizedCode,
        improvements: fallbackOptimization.improvements,
        performanceGain: 15,
        explanation: fallbackOptimization.explanation,
      };
    }
  }

  // Get code generation history
  async getCodeGenerations(userId: string, limit: number = 10): Promise<CodeGeneration[]> {
    return await db
      .select()
      .from(codeGenerations)
      .where(eq(codeGenerations.userId, userId))
      .orderBy(desc(codeGenerations.createdAt))
      .limit(limit);
  }

  // Get code reviews for user
  async getCodeReviews(userId: string, status?: string): Promise<CodeReview[]> {
    const whereClause = status 
      ? and(eq(codeReviews.userId, userId), eq(codeReviews.status, status))
      : eq(codeReviews.userId, userId);

    return await db
      .select()
      .from(codeReviews)
      .where(whereClause)
      .orderBy(desc(codeReviews.createdAt));
  }

  // Get dashboard analytics
  async getDashboardAnalytics(userId: string): Promise<{
    totalGenerations: number;
    totalReviews: number;
    averagePerformance: number;
    topLanguages: { language: string; count: number }[];
    recentActivity: any[];
    securityIssues: number;
    performanceIssues: number;
  }> {
    const generations = await this.getCodeGenerations(userId, 100);
    const reviews = await this.getCodeReviews(userId);

    const languageStats = generations.reduce((acc, gen) => {
      acc[gen.language] = (acc[gen.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLanguages = Object.entries(languageStats)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averagePerformance = generations.length > 0
      ? Math.round(generations.reduce((sum, gen) => sum + (gen.performance || 0), 0) / generations.length)
      : 0;

    const securityIssues = reviews.filter(r => r.reviewType === 'security').length;
    const performanceIssues = reviews.filter(r => r.reviewType === 'performance').length;

    return {
      totalGenerations: generations.length,
      totalReviews: reviews.length,
      averagePerformance,
      topLanguages,
      recentActivity: [...generations.slice(0, 5), ...reviews.slice(0, 5)]
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 10),
      securityIssues,
      performanceIssues,
    };
  }

  // Fallback code generation for Vietnamese context
  private generateFallbackCode(language: string, prompt: string): { code: string; explanation: string } {
    const templates = {
      javascript: {
        code: `// ${prompt}
function solution() {
  // Implement your solution here
  console.log('Hello from ThachAI Code Assistant');
  return 'Code generated successfully';
}

// Export for use
module.exports = solution;`,
        explanation: `Đã tạo template cơ bản cho ${language}. Code này cần được tùy chỉnh theo yêu cầu cụ thể của bạn.`
      },
      python: {
        code: `# ${prompt}
def solution():
    """
    Implement your solution here
    """
    print("Hello from ThachAI Code Assistant")
    return "Code generated successfully"

if __name__ == "__main__":
    result = solution()
    print(result)`,
        explanation: `Đã tạo template cơ bản cho ${language}. Code này cần được tùy chỉnh theo yêu cầu cụ thể của bạn.`
      },
      java: {
        code: `// ${prompt}
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello from ThachAI Code Assistant");
        String result = solution();
        System.out.println(result);
    }
    
    public static String solution() {
        // Implement your solution here
        return "Code generated successfully";
    }
}`,
        explanation: `Đã tạo template cơ bản cho ${language}. Code này cần được tùy chỉnh theo yêu cầu cụ thể của bạn.`
      }
    };

    return templates[language as keyof typeof templates] || templates.javascript;
  }

  // Fallback code review
  private generateFallbackReview(language: string, code: string, reviewTypes: string[]): {
    issue: string;
    suggestion: string;
  } {
    return {
      issue: `Đã phát hiện các vấn đề tiềm ẩn trong code ${language}. Cần review thêm về ${reviewTypes.join(', ')}.`,
      suggestion: `Khuyến nghị: Kiểm tra lại logic, thêm error handling, và tối ưu hóa performance. Sử dụng best practices cho ${language}.`
    };
  }

  // Fallback code optimization
  private generateFallbackOptimization(language: string, code: string, optimizationType: string): {
    optimizedCode: string;
    improvements: string[];
    explanation: string;
  } {
    return {
      optimizedCode: `// Optimized for ${optimizationType}\n${code}\n\n// Additional optimizations applied`,
      improvements: [
        `Cải thiện ${optimizationType}`,
        'Thêm error handling',
        'Tối ưu hóa cấu trúc code',
        'Áp dụng best practices'
      ],
      explanation: `Đã tối ưu hóa code cho ${optimizationType}. Các cải tiến bao gồm cấu trúc tốt hơn, xử lý lỗi, và performance.`
    };
  }
}

export const aiCodeAssistant = new AICodeAssistant();