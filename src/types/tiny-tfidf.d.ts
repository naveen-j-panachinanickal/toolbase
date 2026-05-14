declare module "tiny-tfidf" {
  export type TermVector = Map<string, number>;

  export type CorpusOptions = {
    useDefaultStopwords?: boolean;
    customStopwords?: string[];
    K1?: number;
    b?: number;
  };

  export class Corpus {
    constructor(names: string[], texts: string[], options?: CorpusOptions);
    getDocumentVector(identifier: string): TermVector;
  }

  export class Similarity {
    static cosineSimilarity(vector1: TermVector, vector2: TermVector): number;
  }
}
