import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Standard instruction to prepend to all prompts
    this.standardInstruction = `IMPORTANT INSTRUCTIONS:
- Do NOT include any emojis in your response
- Do NOT use bold, italic, or any markdown formatting
- Do NOT include any welcoming phrases, preambles, or introductory sentences
- Start directly with the actual content
- Keep the response concise and under 2000 characters
- Output ONLY the main content, nothing else

USER REQUEST: `;
  }

  /**
   * Generate a short topic (max 4 words) from a prompt
   * @param {string} prompt - The full prompt text
   * @returns {Promise<string>} Short topic (max 4 words)
   */
  async generateShortTopic(prompt) {
    try {
      const topicPrompt = `Based on this request, generate a short, crisp topic name of MAXIMUM 4 words that captures the essence. Output ONLY the topic, nothing else.

Request: ${prompt}

Examples:
- "Give one real-world SDET interview question on Java" → "Java SDET Question"
- "Explain how to design a hybrid framework" → "Hybrid Framework Design"
- "Share one flaky test debugging example" → "Flaky Test Debug"

Topic:`;

      const result = await this.model.generateContent(topicPrompt);
      const response = await result.response;
      const topic = response.text().trim();
      
      // Ensure max 4 words
      const words = topic.split(/\s+/);
      const shortTopic = words.slice(0, 4).join(' ');
      
      return shortTopic || 'SDET Interview Prep';
    } catch (error) {
      console.error('Error generating short topic:', error);
      return 'SDET Interview Prep'; // Fallback
    }
  }

  /**
   * Generate content from a prompt
   * @param {string} userPrompt - The user's prompt/question
   * @returns {Promise<Object>} Object containing topic and content
   */
  async generateContentFromPrompt(userPrompt) {
    try {
      console.log('Generating short topic...');
      const shortTopic = await this.generateShortTopic(userPrompt);
      console.log(`Generated topic: ${shortTopic}`);
      
      console.log('Generating content...');
      // Enhanced instruction with length requirements
      const separationInstruction = `
CRITICAL FORMAT REQUIREMENTS:
- First provide the QUESTION/PROBLEM statement (2-4 sentences explaining the scenario)
- Then add exactly this separator line: "---SOLUTION---"
- Then provide the SOLUTION/ANSWER with these requirements:
  * MUST be 5-10 sentences long (not just 1-2 sentences)
  * Include explanation of the concept
  * Provide step-by-step approach or code example
  * Add practical tips or best practices
  * Keep it informative but concise
- Do NOT include any other separators or labels
- Aim for medium length - not too short (avoid 1-liner answers), not too lengthy (avoid essays)
- For coding questions, include actual code snippets with brief explanation
- For conceptual questions, provide concrete examples

EXAMPLE OF GOOD LENGTH:
Question: "How do you handle dynamic web elements in Selenium?"
Solution: "Dynamic web elements change their properties like ID or class at runtime. To handle them, use XPath with contains(), starts-with(), or text() functions instead of absolute locators. Implement explicit waits with ExpectedConditions to wait for element visibility or clickability. Use relative XPath based on stable parent elements. For example: driver.findElement(By.xpath('//div[@class='container']//button[contains(text(),'Submit')]')). You can also use CSS selectors with attribute contains like [class*='dynamic']. Always implement proper wait strategies using WebDriverWait with appropriate timeout values. Add retry mechanisms for flaky elements. Consider using Page Object Model to centralize element locators for easier maintenance."

`;
      const fullPrompt = separationInstruction + this.standardInstruction + userPrompt;
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();
  
      // Split content by the separator
      const parts = content.split('---SOLUTION---');
      const question = parts[0] ? this.formatContent(this.stripPreamble(parts[0].trim())) : '';
      const solution = parts[1] ? this.formatContent(this.stripPreamble(parts[1].trim())) : '';

      // Validate solution length - if too short, regenerate
      const solutionWordCount = solution.split(/\s+/).length;
      if (solutionWordCount < 30) {
        console.log(`Solution too short (${solutionWordCount} words), regenerating...`);
        // Retry with more explicit instruction
        const retryPrompt = separationInstruction + `
IMPORTANT: The previous solution was too short. Please provide a DETAILED solution with:
- At least 5-8 sentences
- Code examples if applicable
- Step-by-step explanation
- Practical implementation details

` + this.standardInstruction + userPrompt;
        
        const retryResult = await this.model.generateContent(retryPrompt);
        const retryResponse = await retryResult.response;
        const retryContent = retryResponse.text();
        
        const retryParts = retryContent.split('---SOLUTION---');
        const retryQuestion = retryParts[0] ? this.formatContent(this.stripPreamble(retryParts[0].trim())) : question;
        const retrySolution = retryParts[1] ? this.formatContent(this.stripPreamble(retryParts[1].trim())) : solution;
        
        return {
          topic: shortTopic,
          content: `${retryQuestion}|||SPLIT|||${retrySolution}`
        };
      }

      console.log(`Solution length: ${solutionWordCount} words`);
      return {
        topic: shortTopic,
        content: `${question}|||SPLIT|||${solution}`
      };
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Format the generated content for Instagram
   * @param {string} content - Raw content from Gemini
   * @returns {string} Formatted content
   */
  formatContent(content) {
    let formatted = content.trim();
    
    // Ensure it doesn't exceed Instagram's character limit
    if (formatted.length > 2200) {
      formatted = formatted.substring(0, 2200) + '...';
    }

    // Remove emojis
    formatted = formatted.replace(/[\p{Extended_Pictographic}\p{Emoji}]/gu, '');
    
    // Remove markdown bold/italics
    formatted = formatted.replace(/[*_~`]+/g, '');
    
    // Remove hashtags from content body
    formatted = formatted.replace(/(^|\s)#\w+/g, '').trim();

    return formatted;
  }

  /**
   * Remove any preface/intro lines from model output
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  stripPreamble(text) {
    if (!text) return text;
    
    let t = text.trim();
    const lines = t.split(/\r?\n/);
    let startIdx = 0;
    
    while (startIdx < lines.length) {
      const l = lines[startIdx].trim();
      
      // Skip empty lines
      if (!l) { 
        startIdx++; 
        continue; 
      }
      
      // Check if line looks like a preamble
      const looksLikePreamble = /^(sure|okay|here|alright|great|no problem|here's|here is|\w+:)\b/i.test(l) ||
        /^\(?\*?output|content|post|body|response\)?\s*:/.test(l);
      
      // If it's a short preamble line, skip it
      if (looksLikePreamble && l.length < 80) { 
        startIdx++; 
        continue; 
      }
      
      // Stop stripping when we hit real content
      break;
    }
    
    t = lines.slice(startIdx).join('\n').trim();
    return t;
  }

  /**
   * Generate a clean caption and up to 10 related hashtags (no emojis)
   * @param {string} topic - General topic
   * @param {string} content - Post content
   * @returns {Promise<string>} Caption with hashtags
   */
  async generateCaption(topic, content) {
    const captionPrompt = `
      Based on the following Instagram post body and topic, create:
      1) A single concise caption line (no emojis, no quotes), optimized for professional tech audience
      2) A second line with up to 10 highly relevant, popular hashtags (lowercase, no spaces, no punctuation except #), separated by single spaces
      
      Rules:
      - Do NOT include emojis anywhere
      - Do NOT repeat the full content
      - Do NOT include bold/markdown formatting
      - Keep total under 300 characters if possible
      
      Topic: ${topic}
      Content:
      ${content.substring(0, 500)}
      
      Output format:
      <caption line>
      <hashtags line>
    `;

    const result = await this.model.generateContent(captionPrompt);
    const response = await result.response;
    const raw = response.text().trim();

    // Normalize output: take first two non-empty lines
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const captionLine = (lines[0] || '').replace(/["'""]/g, '').trim();
    let hashtagsLine = (lines[1] || '').trim();
    
    // Sanitize hashtags: keep only #words, max 10
    const tags = (hashtagsLine.match(/#\w+/g) || []).slice(0, 10).map(t => t.toLowerCase());
    hashtagsLine = tags.join(' ');

    return hashtagsLine ? `${captionLine}\n${hashtagsLine}` : captionLine;
  }

  /**
   * Generate retry content with a different approach
   * @param {string} topic - The topic
   * @param {string} originalContent - The original content that was rejected
   * @returns {Promise<Object>} Object containing new topic and content
   */
  async generateRetryContent(topic, originalContent) {
    try {
      const retryPrompt = `The previous content was not approved. Generate completely different content with a fresh approach.

Previous content to avoid repeating:
${originalContent.substring(0, 300)}

Create fresh, unique content with:
- A different angle and perspective
- Different examples
- Different structure
- Medium length solution (5-10 sentences, not just 1-2 lines)
- Practical and detailed explanation`;

      // Generate new short topic
      const shortTopic = await this.generateShortTopic(retryPrompt);
      
      // Generate new content with length requirements
      const separationInstruction = `
CRITICAL FORMAT REQUIREMENTS:
- First provide the QUESTION/PROBLEM statement (2-4 sentences)
- Then add exactly this separator line: "---SOLUTION---"
- Then provide a DETAILED SOLUTION (5-10 sentences minimum)
- Include code examples or step-by-step explanation
- Make it substantive and informative, not just a one-liner
`;
      const fullPrompt = separationInstruction + this.standardInstruction + retryPrompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      const parts = content.split('---SOLUTION---');
      const question = parts[0] ? this.formatContent(this.stripPreamble(parts[0].trim())) : '';
      const solution = parts[1] ? this.formatContent(this.stripPreamble(parts[1].trim())) : '';

      return {
        topic: shortTopic,
        content: `${question}|||SPLIT|||${solution}`
      };
    } catch (error) {
      console.error('Error generating retry content with Gemini:', error);
      throw new Error(`Failed to generate retry content: ${error.message}`);
    }
  }
}

export default GeminiService;