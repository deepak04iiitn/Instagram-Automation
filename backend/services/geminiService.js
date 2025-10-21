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
      // First, generate a short topic
      console.log('Generating short topic...');
      const shortTopic = await this.generateShortTopic(userPrompt);
      console.log(`Generated topic: ${shortTopic}`);
      
      // Then generate the content
      console.log('Generating content...');
      const fullPrompt = this.standardInstruction + userPrompt;
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      return {
        topic: shortTopic,
        content: this.formatContent(this.stripPreamble(content))
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
   * Generate retry content with a different approach (kept for compatibility)
   * @param {string} topic - The topic
   * @param {string} originalContent - The original content that was rejected
   * @returns {Promise<Object>} Object containing new topic and content
   */
  async generateRetryContent(topic, originalContent) {
    try {
      const retryPrompt = `The previous content was not approved. Generate completely different content with a fresh approach.

Previous content to avoid repeating:
${originalContent.substring(0, 300)}

Create fresh, unique content with a different angle, different examples, and different structure.`;

      // Generate new short topic
      const shortTopic = await this.generateShortTopic(retryPrompt);
      
      // Generate new content
      const fullPrompt = this.standardInstruction + retryPrompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      return {
        topic: shortTopic,
        content: this.formatContent(this.stripPreamble(content))
      };
    } catch (error) {
      console.error('Error generating retry content with Gemini:', error);
      throw new Error(`Failed to generate retry content: ${error.message}`);
    }
  }
}

export default GeminiService;