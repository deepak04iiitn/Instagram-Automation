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

      return this.formatContent(this.stripPreamble(content));
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
        Create a concise, educational Instagram post body about a coding question of the day. 
        Include:
        - A challenging but solvable coding problem
        - Brief explanation of the approach
        - Why this concept matters
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
      `,
      'Interview experience': `
        Create a concise, educational Instagram post body about interview experiences in tech.
        Include:
        - A realistic scenario
        - Key lessons learned
        - Tips for handling similar situations
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
      `,
      'UI Testing': `
        Create a concise, educational Instagram post body about UI Testing best practices.
        Include:
        - Practical tips
        - Common pitfalls to avoid
        - Tools or techniques
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
      `,
      'API Testing': `
        Create a concise, educational Instagram post body about API Testing.
        Include:
        - Strategies
        - Common challenges
        - Effective tools/methods
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
      `,
      'Performance Testing': `
        Create a concise, educational Instagram post body about Performance Testing.
        Include:
        - Why it matters
        - Key metrics
        - Useful tools/techniques
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
      `,
      'SDET Tools': `
        Create a concise, educational Instagram post body about SDET tools.
        Include:
        - Popular tools
        - How they improve testing efficiency
        - Brief recommendations
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
      `,
      'AI in Testing': `
        Create a concise, educational Instagram post body about AI in Testing.
        Include:
        - How AI is changing testing
        - AI-powered tools or techniques
        - The near future of AI in QA
        Constraints for the CONTENT BODY:
        - Do NOT include emojis
        - Do NOT include hashtags
        - Do NOT include any bold/markdown formatting
        - Keep under 2000 characters
        Output strictly the content body only. Do NOT add any preface, intro, or explanation.
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

    // Remove emojis
    formatted = formatted.replace(/[\p{Extended_Pictographic}\p{Emoji}]/gu, '');
    // Remove markdown bold/italics
    formatted = formatted.replace(/[*_~`]+/g, '');
    // Remove hashtags from content body
    formatted = formatted.replace(/(^|\s)#\w+/g, '').trim();

    return formatted;
  }

  /**
   * Remove any preface/intro lines (e.g., "Sure, here's...") from model output
   */
  stripPreamble(text) {
    if (!text) return text;
    let t = text.trim();
    // Remove common prefaces up to first empty line or first bullet/heading
    const lines = t.split(/\r?\n/);
    let startIdx = 0;
    while (startIdx < lines.length) {
      const l = lines[startIdx].trim();
      const looksLikePreamble = /^(sure|okay|here|alright|great|no problem|\w+:)\b/i.test(l) ||
        /^\(?\*?output|content|post|body\)?\s*:/.test(l);
      const looksLikeStructure = /^[-*•\d+\.)]|^#{1,6}\s|^\w/.test(l);
      if (!l) { startIdx++; continue; }
      if (looksLikePreamble && !/\w{1,}\s\w{1,}/.test(l)) { startIdx++; continue; }
      if (looksLikePreamble && l.length < 80) { startIdx++; continue; }
      // Stop stripping when we hit something that looks like real content
      break;
    }
    t = lines.slice(startIdx).join('\n').trim();
    return t;
  }

  /**
   * Generate a clean caption and up to 10 related hashtags (no emojis)
   * @param {string} topic
   * @param {string} content
   * @returns {Promise<string>} caption string containing caption + hashtags
   */
  async generateCaption(topic, content) {
    const captionPrompt = `
      Based on the following Instagram post body and topic, produce:
      1) A single concise caption line (no emojis, no quotes), optimized for professional tech audience.
      2) A second line with up to 10 highly relevant, popular hashtags (lowercase, no spaces, no punctuation except #), separated by single spaces.
      Rules:
      - Do NOT include emojis anywhere.
      - Do NOT repeat the full content.
      - Do NOT include bold/markdown formatting.
      - Keep total under 300 characters if possible.

      Topic: ${topic}
      Content:
      ${content}

      Output format:
      <caption line>
      <hashtags line>
    `;

    const result = await this.model.generateContent(captionPrompt);
    const response = await result.response;
    const raw = response.text().trim();

    // Normalize output: take first two non-empty lines
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const captionLine = (lines[0] || '').replace(/["'“”]/g, '').trim();
    let hashtagsLine = (lines[1] || '').trim();
    // sanitize hashtags: keep only #words, max 10
    const tags = (hashtagsLine.match(/#\w+/g) || []).slice(0, 10).map(t => t.toLowerCase());
    hashtagsLine = tags.join(' ');

    return hashtagsLine ? `${captionLine}\n${hashtagsLine}` : captionLine;
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
