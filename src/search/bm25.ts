/**
 * BM25 Search Algorithm Implementation
 * Ported from Python to TypeScript
 */

export interface Document {
  id: string;
  content: string;
  data: Record<string, any>;
}

export interface SearchResult {
  document: Document;
  score: number;
}

export class BM25 {
  private documents: Document[] = [];
  private avgDocLength: number = 0;
  private docFrequencies: Map<string, number> = new Map();
  private tokenizedDocs: string[][] = [];

  // BM25 parameters
  private k1: number = 1.5;
  private b: number = 0.75;

  constructor(documents: Document[]) {
    this.documents = documents;
    this.tokenizedDocs = documents.map(doc => this.tokenize(doc.content));
    this.calculateDocFrequencies();
    this.calculateAvgDocLength();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  private calculateDocFrequencies(): void {
    this.docFrequencies.clear();
    for (const tokens of this.tokenizedDocs) {
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
      }
    }
  }

  private calculateAvgDocLength(): void {
    if (this.tokenizedDocs.length === 0) {
      this.avgDocLength = 1;
      return;
    }
    const totalLength = this.tokenizedDocs.reduce((sum, tokens) => sum + tokens.length, 0);
    this.avgDocLength = totalLength / this.tokenizedDocs.length;
    // Ensure avgDocLength is never zero to prevent division by zero
    if (this.avgDocLength === 0) {
      this.avgDocLength = 1;
    }
  }

  private idf(term: string): number {
    const N = this.documents.length;
    const df = this.docFrequencies.get(term) || 0;
    return Math.log((N - df + 0.5) / (df + 0.5) + 1);
  }

  private score(queryTokens: string[], docIndex: number): number {
    const docTokens = this.tokenizedDocs[docIndex];
    const docLength = docTokens.length;

    let score = 0;
    const termFrequencies = new Map<string, number>();

    for (const token of docTokens) {
      termFrequencies.set(token, (termFrequencies.get(token) || 0) + 1);
    }

    for (const term of queryTokens) {
      const tf = termFrequencies.get(term) || 0;
      if (tf === 0) continue;

      const idfValue = this.idf(term);
      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));

      score += idfValue * (numerator / denominator);
    }

    return score;
  }

  search(query: string, maxResults: number = 3): SearchResult[] {
    const queryTokens = this.tokenize(query);

    const results: SearchResult[] = this.documents.map((doc, index) => ({
      document: doc,
      score: this.score(queryTokens, index)
    }));

    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
}
