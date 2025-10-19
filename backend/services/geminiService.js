import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Generate content based on the topic for the day
   * @param {string} topic - The topic for the day
   * @returns {Promise<string>} Generated content
   */
  async generateContent(topic) {
    try {
      const prompt = this.getPromptForTopic(topic);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      return this.formatContent(content);
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Get the appropriate prompt based on the topic
   * @param {string} topic - The topic for the day
   * @returns {string} Formatted prompt
   */
  getPromptForTopic(topic) {
    const prompts = {
      'Coding question of the day': `
        Create an engaging Instagram post about a coding question of the day. 
        Include:
        - A challenging but solvable coding problem
        - Brief explanation of the approach
        - Why this concept is important for developers
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Make it engaging for software developers and coding enthusiasts
      `,
      'Interview experience': `
        Create an engaging Instagram post about interview experiences in tech.
        Include:
        - A real or realistic interview scenario
        - Key lessons learned
        - Tips for handling similar situations
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Make it relatable for job seekers and developers
      `,
      'UI Testing': `
        Create an engaging Instagram post about UI Testing best practices.
        Include:
        - Practical UI testing tips
        - Common pitfalls to avoid
        - Tools or techniques mentioned
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Target QA engineers and developers
      `,
      'API Testing': `
        Create an engaging Instagram post about API Testing.
        Include:
        - API testing strategies
        - Common API testing challenges
        - Tools or methods for effective API testing
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Target QA engineers and developers
      `,
      'Performance Testing': `
        Create an engaging Instagram post about Performance Testing.
        Include:
        - Performance testing importance
        - Key metrics to monitor
        - Tools or techniques for performance testing
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Target QA engineers and performance engineers
      `,
      'SDET Tools': `
        Create an engaging Instagram post about SDET (Software Development Engineer in Test) tools.
        Include:
        - Popular SDET tools
        - How these tools improve testing efficiency
        - Brief comparison or recommendation
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Target SDETs and QA automation engineers
      `,
      'AI in Testing': `
        Create an engaging Instagram post about AI in Testing.
        Include:
        - How AI is revolutionizing testing
        - AI-powered testing tools or techniques
        - Future of AI in QA
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Target QA professionals and tech enthusiasts
      `
    };

    return prompts[topic] || prompts['Coding question of the day'];
  }

  /**
   * Format the generated content for Instagram
   * @param {string} content - Raw content from Gemini
   * @returns {string} Formatted content
   */
  formatContent(content) {
    // Clean up the content
    let formatted = content.trim();
    
    // Ensure it doesn't exceed Instagram's character limit
    if (formatted.length > 2200) {
      formatted = formatted.substring(0, 2200) + '...';
    }

    // Add some basic formatting if not present
    if (!formatted.includes('#')) {
      formatted += '\n\n#Tech #Coding #SoftwareDevelopment #Programming';
    }

    return formatted;
  }

  /**
   * Generate retry content with a different approach
   * @param {string} topic - The topic for the day
   * @param {string} originalContent - The original content that was rejected
   * @returns {Promise<string>} New generated content
   */
  async generateRetryContent(topic, originalContent) {
    try {
      const retryPrompt = `
        The previous content for "${topic}" was not approved. Please generate a completely different approach:
        
        Original content: ${originalContent}
        
        Create a fresh, engaging Instagram post about "${topic}" with:
        - A different angle or perspective
        - New examples or scenarios
        - Different style or tone
        - Use emojis and hashtags appropriately
        - Keep it concise but informative (max 2000 characters)
        - Make it unique and engaging
      `;

      const result = await this.model.generateContent(retryPrompt);
      const response = await result.response;
      const content = response.text();

      return this.formatContent(content);
    } catch (error) {
      console.error('Error generating retry content with Gemini:', error);
      throw new Error(`Failed to generate retry content: ${error.message}`);
    }
  }
}

export default GeminiService;
