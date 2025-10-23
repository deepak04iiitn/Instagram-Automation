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
- Use proper formatting with bullet points, numbered lists, and clear structure
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
      // Enhanced instruction with proper formatting requirements
      const separationInstruction = `
CRITICAL FORMAT REQUIREMENTS:

1. QUESTION/PROBLEM SECTION:
   - Provide 2-4 sentences explaining the scenario
   - Make it clear and concise

2. SEPARATOR:
   - Add exactly this line: "---SOLUTION---"

3. SOLUTION SECTION (MUST be well-formatted):
   
   FORMAT THE SOLUTION PROPERLY:
   
   A. For Conceptual Answers:
      • Start with a brief intro sentence
      • Use bullet points (•) for key points
      • Use numbered lists (1., 2., 3.) for steps or sequences
      • Add sub-bullets where needed (  - sub point)
      • Keep each point concise (1-2 lines max)
   
   B. For Code-Based Answers:
      • Start with brief explanation
      • Add numbered steps (1., 2., 3.)
      • Include code blocks clearly separated
      • Add bullet points for key concepts
      • End with practical tips (bullet format)
   
   C. Structure Example:
      Brief intro sentence.
      
      Key Points:
      • First main point
      • Second main point
        - Sub-point detail
        - Another sub-point
      • Third main point
      
      Step-by-step approach:
      1. First step explanation
      2. Second step explanation
      3. Third step explanation
      
      Best Practices:
      • Practice tip one
      • Practice tip two

   REQUIREMENTS:
   - MUST use bullet points (•) and numbered lists (1., 2., 3.)
   - Each bullet/number point should be 1-2 lines
   - Include 5-10 distinct points/steps
   - Add clear spacing between sections
   - Use indentation for sub-points
   - Keep it scannable and easy to read
   - For code examples, add comments and explanation before/after

EXAMPLE FORMAT:

Question: How do you handle dynamic web elements in Selenium?

---SOLUTION---

Dynamic elements change their properties at runtime, making them unstable for automation.

Handling Strategies:

• Use relative XPath based on stable parent elements
  - Example: //div[@class='container']//button[contains(text(),'Submit')]

• Implement explicit waits for element stability
  - WebDriverWait with ExpectedConditions
  - Wait for visibility, clickability, or presence

• Use flexible locators with contains() or starts-with()
  - CSS: [class*='dynamic']
  - XPath: //div[starts-with(@id,'prefix')]

Step-by-Step Approach:

1. Identify stable parent/ancestor elements
   - Find elements that don't change

2. Build relative locators from stable elements
   - Navigate down to target element

3. Add explicit waits before interaction
   - Wait for element to be clickable

4. Implement retry mechanisms for flaky elements
   - Add try-catch with retries

Best Practices:

• Avoid using absolute XPath
• Use custom wait conditions for complex scenarios
• Centralize locators in Page Object Model
• Add meaningful wait messages for debugging
• Test with different data sets to ensure stability
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
IMPORTANT: The previous solution was too short. Please provide a DETAILED, WELL-FORMATTED solution with:
- Clear bullet points (•) for key concepts
- Numbered lists (1., 2., 3.) for steps
- At least 5-8 distinct points
- Code examples with explanations if applicable
- Sub-bullets for detailed points
- Practical implementation tips at the end

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
    
    // Remove excessive markdown (but keep bullets and numbers)
    formatted = formatted.replace(/[*_~`]{2,}/g, ''); // Remove bold/italic markers
    
    // Normalize bullet points - convert various bullet styles to •
    formatted = formatted.replace(/^[\s]*[-*]\s/gm, '• ');
    formatted = formatted.replace(/^[\s]*[•]\s/gm, '• ');
    
    // Ensure proper spacing after bullets and numbers
    formatted = formatted.replace(/^(•|\d+\.)\s*/gm, '$1 ');
    
    // Remove hashtags from content body
    formatted = formatted.replace(/(^|\s)#\w+/g, '').trim();
    
    // Ensure proper line breaks between sections
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

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
- WELL-FORMATTED solution with bullets and numbers
- Practical and detailed explanation`;

      // Generate new short topic
      const shortTopic = await this.generateShortTopic(retryPrompt);
      
      // Generate new content with formatting requirements
      const separationInstruction = `
CRITICAL FORMAT REQUIREMENTS:
- First provide the QUESTION/PROBLEM statement (2-4 sentences)
- Then add exactly this separator line: "---SOLUTION---"
- Then provide a WELL-FORMATTED SOLUTION:
  • Use bullet points (•) for key concepts
  • Use numbered lists (1., 2., 3.) for steps
  • Include sub-bullets for details
  • Make it scannable and easy to read
  • Include 5-10 distinct formatted points
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