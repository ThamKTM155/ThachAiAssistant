// Vietnamese Natural Language Processing Engine
import axios from 'axios';

interface VietnameseToken {
  word: string;
  pos: string; // Part of speech
  type: 'syllable' | 'word' | 'compound';
  tone: string;
  meaning?: string;
}

interface SentimentResult {
  score: number; // -1 to 1
  confidence: number;
  emotion: 'positive' | 'negative' | 'neutral' | 'joy' | 'anger' | 'sadness' | 'fear';
  keywords: string[];
}

interface TranslationResult {
  original: string;
  translated: string;
  language_detected: string;
  confidence: number;
  alternatives?: string[];
}

interface AutoCorrectResult {
  original: string;
  corrected: string;
  corrections: Array<{
    position: number;
    original: string;
    suggested: string;
    type: 'spelling' | 'grammar' | 'tone';
  }>;
}

export class VietnameseNLP {
  private vietnameseDictionary: Map<string, VietnameseToken> = new Map();
  private sentimentLexicon: Map<string, number> = new Map();
  private commonTypos: Map<string, string> = new Map();

  constructor() {
    this.initializeVietnameseDictionary();
    this.initializeSentimentLexicon();
    this.initializeTypoCorrection();
  }

  // Vietnamese word segmentation and tokenization
  tokenizeVietnamese(text: string): VietnameseToken[] {
    const tokens: VietnameseToken[] = [];
    const cleanText = this.normalizeVietnameseText(text);
    
    // Split by common Vietnamese word boundaries
    const words = cleanText.split(/[\s,\.;:!?\-\(\)\[\]\"\']+/).filter(w => w.length > 0);
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      
      // Check if it's a compound word
      const compoundParts = this.detectCompoundWord(lowerWord);
      if (compoundParts.length > 1) {
        compoundParts.forEach(part => {
          tokens.push(this.createToken(part, 'word'));
        });
      } else {
        tokens.push(this.createToken(lowerWord, 'word'));
      }
    });

    return tokens;
  }

  // Vietnamese sentiment analysis
  analyzeSentiment(text: string): SentimentResult {
    const tokens = this.tokenizeVietnamese(text);
    let totalScore = 0;
    let scoredWords = 0;
    const keywords: string[] = [];
    
    tokens.forEach(token => {
      const sentiment = this.sentimentLexicon.get(token.word);
      if (sentiment !== undefined) {
        totalScore += sentiment;
        scoredWords++;
        if (Math.abs(sentiment) > 0.5) {
          keywords.push(token.word);
        }
      }
    });

    // Calculate final sentiment
    const avgScore = scoredWords > 0 ? totalScore / scoredWords : 0;
    const confidence = Math.min(scoredWords / tokens.length, 1);

    // Determine emotion
    let emotion: SentimentResult['emotion'] = 'neutral';
    if (avgScore > 0.3) emotion = 'positive';
    else if (avgScore < -0.3) emotion = 'negative';
    
    // Check for specific emotions
    if (this.containsJoyWords(text)) emotion = 'joy';
    else if (this.containsAngerWords(text)) emotion = 'anger';
    else if (this.containsSadnessWords(text)) emotion = 'sadness';
    else if (this.containsFearWords(text)) emotion = 'fear';

    return {
      score: Math.max(-1, Math.min(1, avgScore)),
      confidence,
      emotion,
      keywords
    };
  }

  // Auto-correct Vietnamese text
  autoCorrectVietnamese(text: string): AutoCorrectResult {
    const corrections: AutoCorrectResult['corrections'] = [];
    let correctedText = text;
    let offset = 0;

    // Common typo corrections
    this.commonTypos.forEach((correct, typo) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        corrections.push({
          position: match.index + offset,
          original: match[0],
          suggested: correct,
          type: 'spelling'
        });
        correctedText = correctedText.replace(match[0], correct);
        offset += correct.length - match[0].length;
      }
    });

    // Tone mark corrections
    correctedText = this.correctToneMarks(correctedText, corrections);
    
    // Grammar corrections
    correctedText = this.correctGrammar(correctedText, corrections);

    return {
      original: text,
      corrected: correctedText,
      corrections
    };
  }

  // Vietnamese to English translation (using free translation API)
  async translateVietnamese(text: string, targetLang: string = 'en'): Promise<TranslationResult> {
    try {
      // Using MyMemory free translation API
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: `vi|${targetLang}`
        }
      });

      const data = response.data;
      return {
        original: text,
        translated: data.responseData.translatedText,
        language_detected: 'vi',
        confidence: data.responseData.match || 0.8,
        alternatives: data.matches?.slice(0, 3).map((m: any) => m.translation) || []
      };
    } catch (error) {
      // Fallback to basic word-by-word translation
      return this.basicTranslation(text, targetLang);
    }
  }

  // Text quality assessment for Vietnamese content
  assessTextQuality(text: string): {
    readability_score: number;
    complexity_level: 'basic' | 'intermediate' | 'advanced';
    suggestions: string[];
    word_count: number;
    sentence_count: number;
    vocabulary_richness: number;
  } {
    const tokens = this.tokenizeVietnamese(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate readability (Vietnamese Flesch Reading Ease adaptation)
    const avgWordsPerSentence = tokens.length / sentences.length;
    const avgSyllablesPerWord = this.calculateAvgSyllables(tokens);
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Vocabulary richness (unique words / total words)
    const uniqueWords = new Set(tokens.map(t => t.word));
    const vocabularyRichness = uniqueWords.size / tokens.length;
    
    // Complexity assessment
    let complexityLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (readabilityScore > 70) complexityLevel = 'basic';
    else if (readabilityScore > 50) complexityLevel = 'intermediate';
    else complexityLevel = 'advanced';
    
    // Generate suggestions
    const suggestions: string[] = [];
    if (avgWordsPerSentence > 20) {
      suggestions.push('Chia câu dài thành các câu ngắn hơn để dễ hiểu');
    }
    if (vocabularyRichness < 0.5) {
      suggestions.push('Sử dụng từ vựng đa dạng hơn để tránh lặp lại');
    }
    if (readabilityScore < 30) {
      suggestions.push('Đơn giản hóa cấu trúc câu để dễ đọc hơn');
    }

    return {
      readability_score: Math.max(0, Math.min(100, readabilityScore)),
      complexity_level: complexityLevel,
      suggestions,
      word_count: tokens.length,
      sentence_count: sentences.length,
      vocabulary_richness: vocabularyRichness * 100
    };
  }

  // Extract Vietnamese keywords and keyphrases
  extractKeywords(text: string, maxKeywords: number = 10): Array<{
    keyword: string;
    importance: number;
    frequency: number;
    type: 'single' | 'phrase';
  }> {
    const tokens = this.tokenizeVietnamese(text);
    const wordFreq = new Map<string, number>();
    const phraseFreq = new Map<string, number>();
    
    // Count word frequencies
    tokens.forEach(token => {
      if (token.word.length > 2 && !this.isStopWord(token.word)) {
        wordFreq.set(token.word, (wordFreq.get(token.word) || 0) + 1);
      }
    });

    // Extract 2-3 word phrases
    for (let i = 0; i < tokens.length - 1; i++) {
      const phrase2 = `${tokens[i].word} ${tokens[i + 1].word}`;
      if (!this.containsStopWord(phrase2)) {
        phraseFreq.set(phrase2, (phraseFreq.get(phrase2) || 0) + 1);
      }
      
      if (i < tokens.length - 2) {
        const phrase3 = `${tokens[i].word} ${tokens[i + 1].word} ${tokens[i + 2].word}`;
        if (!this.containsStopWord(phrase3)) {
          phraseFreq.set(phrase3, (phraseFreq.get(phrase3) || 0) + 1);
        }
      }
    }

    // Calculate importance scores
    const keywords: Array<{keyword: string; importance: number; frequency: number; type: 'single' | 'phrase'}> = [];
    
    // Add single words
    wordFreq.forEach((freq, word) => {
      const importance = freq * (word.length / 10) * (this.isImportantWord(word) ? 1.5 : 1);
      keywords.push({ keyword: word, importance, frequency: freq, type: 'single' });
    });
    
    // Add phrases
    phraseFreq.forEach((freq, phrase) => {
      const importance = freq * 2 * (phrase.split(' ').length / 2);
      keywords.push({ keyword: phrase, importance, frequency: freq, type: 'phrase' });
    });

    return keywords
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxKeywords);
  }

  // Private helper methods
  private initializeVietnameseDictionary() {
    // Core Vietnamese vocabulary with POS tags
    const coreWords = [
      { word: 'tôi', pos: 'pronoun', type: 'word' as const, tone: 'mid' },
      { word: 'bạn', pos: 'pronoun', type: 'word' as const, tone: 'mid' },
      { word: 'là', pos: 'verb', type: 'word' as const, tone: 'low' },
      { word: 'có', pos: 'verb', type: 'word' as const, tone: 'rising' },
      { word: 'không', pos: 'adverb', type: 'word' as const, tone: 'mid' },
      { word: 'học', pos: 'verb', type: 'word' as const, tone: 'falling' },
      { word: 'làm', pos: 'verb', type: 'word' as const, tone: 'low' },
      { word: 'việc', pos: 'noun', type: 'word' as const, tone: 'falling' },
      { word: 'công', pos: 'noun', type: 'word' as const, tone: 'mid' },
      { word: 'ty', pos: 'noun', type: 'word' as const, tone: 'mid' }
    ];

    coreWords.forEach(word => {
      this.vietnameseDictionary.set(word.word, word);
    });
  }

  private initializeSentimentLexicon() {
    // Vietnamese sentiment words
    const sentiments = [
      // Positive words
      { word: 'tốt', score: 0.8 },
      { word: 'hay', score: 0.7 },
      { word: 'đẹp', score: 0.7 },
      { word: 'tuyệt', score: 0.9 },
      { word: 'xuất sắc', score: 0.9 },
      { word: 'thích', score: 0.6 },
      { word: 'yêu', score: 0.8 },
      { word: 'vui', score: 0.7 },
      
      // Negative words
      { word: 'xấu', score: -0.7 },
      { word: 'tệ', score: -0.8 },
      { word: 'ghét', score: -0.8 },
      { word: 'buồn', score: -0.6 },
      { word: 'tức', score: -0.7 },
      { word: 'giận', score: -0.7 },
      { word: 'khó chịu', score: -0.6 },
      { word: 'thất vọng', score: -0.8 }
    ];

    sentiments.forEach(item => {
      this.sentimentLexicon.set(item.word, item.score);
    });
  }

  private initializeTypoCorrection() {
    // Common Vietnamese typos and corrections
    const typos = [
      ['ke', 'kệ'],
      ['cho', 'chờ'],
      ['duoc', 'được'],
      ['khong', 'không'],
      ['nhe', 'nhẹ'],
      ['den', 'đến'],
      ['di', 'đi'],
      ['roi', 'rồi']
    ];

    typos.forEach(([typo, correct]) => {
      this.commonTypos.set(typo, correct);
    });
  }

  private normalizeVietnameseText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createToken(word: string, type: 'syllable' | 'word' | 'compound'): VietnameseToken {
    const existing = this.vietnameseDictionary.get(word);
    if (existing) return existing;

    return {
      word,
      pos: this.guessPOS(word),
      type,
      tone: this.detectTone(word)
    };
  }

  private detectCompoundWord(word: string): string[] {
    // Simple compound word detection for Vietnamese
    const commonCompounds = ['công ty', 'học sinh', 'sinh viên', 'nhà hàng'];
    for (const compound of commonCompounds) {
      if (word.includes(compound.replace(' ', ''))) {
        return compound.split(' ');
      }
    }
    return [word];
  }

  private guessPOS(word: string): string {
    // Simple POS tagging based on common patterns
    if (word.endsWith('tion') || word.endsWith('sion')) return 'noun';
    if (word.startsWith('pre') || word.startsWith('re')) return 'verb';
    return 'unknown';
  }

  private detectTone(word: string): string {
    // Detect Vietnamese tone marks
    if (/[àằầèềìòồùừỳ]/.test(word)) return 'low';
    if (/[áắấéếíóốúứý]/.test(word)) return 'rising';
    if (/[ảẳẩẻểỉỏổủửỷ]/.test(word)) return 'hook';
    if (/[ãẵẫẽễĩõỗũữỹ]/.test(word)) return 'tilde';
    if (/[ạặậẹệịọộụựỵ]/.test(word)) return 'dot';
    return 'mid';
  }

  private containsJoyWords(text: string): boolean {
    const joyWords = ['vui', 'hạnh phúc', 'vui vẻ', 'thích thú', 'hân hoan'];
    return joyWords.some(word => text.includes(word));
  }

  private containsAngerWords(text: string): boolean {
    const angerWords = ['giận', 'tức', 'bực mình', 'phẫn nộ'];
    return angerWords.some(word => text.includes(word));
  }

  private containsSadnessWords(text: string): boolean {
    const sadnessWords = ['buồn', 'chán', 'thất vọng', 'u sầu'];
    return sadnessWords.some(word => text.includes(word));
  }

  private containsFearWords(text: string): boolean {
    const fearWords = ['sợ', 'lo lắng', 'hoảng sợ', 'kinh hoàng'];
    return fearWords.some(word => text.includes(word));
  }

  private correctToneMarks(text: string, corrections: AutoCorrectResult['corrections']): string {
    // Basic tone mark correction logic would go here
    return text;
  }

  private correctGrammar(text: string, corrections: AutoCorrectResult['corrections']): string {
    // Basic grammar correction logic would go here
    return text;
  }

  private basicTranslation(text: string, targetLang: string): TranslationResult {
    // Basic word-by-word translation as fallback
    return {
      original: text,
      translated: text, // Would implement basic translation
      language_detected: 'vi',
      confidence: 0.3,
      alternatives: []
    };
  }

  private calculateAvgSyllables(tokens: VietnameseToken[]): number {
    // Vietnamese words are typically 1-2 syllables
    return tokens.reduce((sum, token) => sum + (token.word.length > 4 ? 2 : 1), 0) / tokens.length;
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['và', 'của', 'với', 'từ', 'cho', 'về', 'tại', 'trong', 'ngoài'];
    return stopWords.includes(word);
  }

  private containsStopWord(phrase: string): boolean {
    return phrase.split(' ').some(word => this.isStopWord(word));
  }

  private isImportantWord(word: string): boolean {
    // Words that are typically important in Vietnamese content
    const importantCategories = ['học', 'việc', 'công', 'kinh', 'doanh', 'nghiệp'];
    return importantCategories.some(cat => word.includes(cat));
  }
}

export const vietnameseNLP = new VietnameseNLP();