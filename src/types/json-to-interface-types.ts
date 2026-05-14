export type Language = 'typescript' | 'python' | 'dart' | 'java' | 'kotlin' | 'swift' | 'go';
export interface GeneratorOptions {
    rootName: string;
    language: Language;
    usePydantic?: boolean;
}
