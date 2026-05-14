import { ToolMeta } from "@/types/tool-search";

export const dataLensConfig: ToolMeta = {
  id: 'data-lens',
  name: 'Data Lens',
  description: 'Analyze CSV and JSON data with SQL queries, Python scripts and charts.',
  longDescription:
    'Data Lens turns your browser into a data analysis workbench. Load CSV or JSON files, run SQL queries against them, execute Python (Pandas, NumPy) for deep analysis, visualize with charts, and filter with a visual query builder. Your data stays completely local.',
  category: 'data',
  route: 'data-lens',
  thumbnail: '/assets/thumbnails/data-lens.png',
  tags: ['csv', 'json', 'sql', 'python', 'pandas', 'chart', 'data', 'analysis', 'filter'],
  isNew: false,
  isFeatured: true,
  wasmPowered: true,
  pythonPowered: true,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: false,
};
