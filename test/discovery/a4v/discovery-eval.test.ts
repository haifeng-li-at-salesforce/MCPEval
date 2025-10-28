import { describeEval, ToolCallScorer, TaskResult } from 'vitest-evals';
import { afterAll } from 'vitest';
import { EinsteinDevModel } from '../../../src/model/model-configs';
import { toolDiscoveryWorkflow } from '../../../src/eval/tool-discovery-workflow';
import toolQueries from '../../fixture/tool-queries.json';
import fs from 'node:fs';
import path from 'node:path';

type DiscoveryItem = {
  toolName: string;
  query: string;
  success: boolean;
  invokedTool?: string;
  arguments?: Record<string, any> | undefined;
};

const discoveryReport: Partial<Record<EinsteinDevModel, {
  total: number;
  invoked: number;
  notInvoked: number;
  items: DiscoveryItem[];
}>> = {};

// Runtime controls via environment variables
// - DISCOVERY_MAX_RECORDS: number (default: all)
// - DISCOVERY_KEYWORDS: comma-separated keywords to include (case-insensitive)
const maxRecordsEnv = process.env.DISCOVERY_MAX_RECORDS;
const MAX_RECORDS: number = maxRecordsEnv && !Number.isNaN(Number(maxRecordsEnv)) && Number(maxRecordsEnv) > 0
  ? Number(maxRecordsEnv)
  : Number.POSITIVE_INFINITY;

const keywordsEnv = process.env.DISCOVERY_KEYWORDS;
const KEYWORDS: string[] | null = keywordsEnv
  ? keywordsEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  : null;

function matchesKeywords(text: string): boolean {
  if (!KEYWORDS || KEYWORDS.length === 0) return true;
  const lower = text.toLowerCase();
  return KEYWORDS.some(kw => lower.includes(kw));
}

function recordDiscoveryResult(model: EinsteinDevModel, item: DiscoveryItem) {
  if (!discoveryReport[model]) {
    discoveryReport[model] = { total: 0, invoked: 0, notInvoked: 0, items: [] };
  }
  const bucket = discoveryReport[model]!;
  bucket.total += 1;
  if (item.success) bucket.invoked += 1; else bucket.notInvoked += 1;
  bucket.items.push(item);
}

function emitDiscoveryReport() {
  const models = Object.keys(discoveryReport) as EinsteinDevModel[];
  // eslint-disable-next-line no-console
  console.log('\n\n=== Tool Discovery Comparison Report ===');
  for (const model of models) {
    const r = discoveryReport[model]!;
    // eslint-disable-next-line no-console
    console.log(`\n[${model}] total=${r.total} invoked=${r.invoked} notInvoked=${r.notInvoked} successRate=${r.total ? ((r.invoked / r.total) * 100).toFixed(1) + '%' : 'n/a'}`);
    const failures = r.items.filter(i => !i.success).slice(0, 10);
    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`  First ${failures.length} failures:`);
      for (const f of failures) {
        // eslint-disable-next-line no-console
        console.log(`    - expected=${f.toolName} got=${f.invokedTool ?? 'none'}`);
      }
    }
  }

  if (models.length >= 2) {
    const [m1, m2] = models;
    const m1Map = new Map(discoveryReport[m1]!.items.map(i => [i.toolName + '|' + i.query, i.success]));
    const m2Map = new Map(discoveryReport[m2]!.items.map(i => [i.toolName + '|' + i.query, i.success]));
    const diffs: Array<{ key: string; m1: boolean; m2: boolean }> = [];
    for (const [k, v1] of m1Map.entries()) {
      const v2 = m2Map.get(k);
      if (typeof v2 === 'boolean' && v1 !== v2) diffs.push({ key: k, m1: v1, m2: v2 });
    }
    if (diffs.length) {
      // eslint-disable-next-line no-console
      console.log(`\nDifferences between ${m1} and ${m2} (${diffs.length} cases):`);
      for (const d of diffs.slice(0, 20)) {
        const [toolName] = d.key.split('|');
        // eslint-disable-next-line no-console
        console.log(`  - ${toolName}: ${m1}=${d.m1 ? 'invoked' : 'not'} vs ${m2}=${d.m2 ? 'invoked' : 'not'}`);
      }
    }
  }

  try {
    const outDir = path.resolve(process.cwd(), 'dist', 'reports');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'tool-discovery-report.json');
    fs.writeFileSync(outPath, JSON.stringify(discoveryReport, null, 2), 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`\nSaved discovery report: ${outPath}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to write discovery report:', e);
  }
}

// Run the same discovery evals against both XGEN and GPT5 models
for (const model of [EinsteinDevModel.XGEN, EinsteinDevModel.GPT5]) {
  // Create a describeEval for each record in the fixture
  let count = 0;
  for (const record of toolQueries.records) {
    const { name: toolName, query } = record as { name: string; query: string };
    if (!matchesKeywords(query)) continue;
    describeEval(`A4V mobile mcp tool discovery (${model})`, {
      data: async () => [
        {
          input: query,
          expectedTools: [
            {
              name: toolName,
              arguments: {},
            },
          ],
        },
      ],
      task: toolDiscoveryTask(model, toolName, query),
      scorers: [
        ToolCallScorer({
          params: 'fuzzy',
          fuzzyOptions: {
            substring: true,
            coerceTypes: true,
          },
        }),
      ],
      timeout: 180000,
    });

    count++;
    if (count >= MAX_RECORDS) break;
  }

  //}
}

function toolDiscoveryTask(model: EinsteinDevModel, toolName: string, query: string) {
  return async function (input: string): Promise<TaskResult> {
    const evalResult = await toolDiscoveryWorkflow(model, input, toolName);
    recordDiscoveryResult(model, {
      toolName,
      query,
      success: !!evalResult.success,
      invokedTool: evalResult.toolCall?.name,
      arguments: evalResult.toolCall?.arguments,
    });
    return {
      result: evalResult.success ? 'invoked' : 'not invoked',
      toolCalls: evalResult.toolCall ? [evalResult.toolCall] : [],
    };
  };
}

afterAll(() => {
  emitDiscoveryReport();
});
