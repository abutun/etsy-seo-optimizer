import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { getConfig } from '../utils/config.js';
import type { ListingSEOScore } from '../seo/scorer.js';

export interface ScoreSnapshot {
  date: string;
  overall: number;
  titleScore: number;
  tagScore: number;
  descriptionScore: number;
  imageScore: number;
}

function getHistoryDir(): string {
  return join(getConfig().dataDir, 'history');
}

function getHistoryPath(listingId: number): string {
  return join(getHistoryDir(), `${listingId}.json`);
}

export async function saveSnapshot(score: ListingSEOScore): Promise<void> {
  const historyDir = getHistoryDir();
  await mkdir(historyDir, { recursive: true });

  const filePath = getHistoryPath(score.listingId);
  let snapshots: ScoreSnapshot[] = [];

  try {
    const raw = await readFile(filePath, 'utf-8');
    snapshots = JSON.parse(raw);
  } catch {
    // File doesn't exist yet
  }

  const snapshot: ScoreSnapshot = {
    date: new Date().toISOString(),
    overall: score.overall,
    titleScore: score.titleScore.total,
    tagScore: score.tagScore.total,
    descriptionScore: score.descriptionScore.total,
    imageScore: score.imageScore.total,
  };

  snapshots.push(snapshot);

  // Keep last 100 snapshots
  if (snapshots.length > 100) {
    snapshots = snapshots.slice(-100);
  }

  await writeFile(filePath, JSON.stringify(snapshots, null, 2), 'utf-8');
}

export async function getHistory(listingId: number): Promise<ScoreSnapshot[]> {
  try {
    const raw = await readFile(getHistoryPath(listingId), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getLatestSnapshot(listingId: number): Promise<ScoreSnapshot | null> {
  const history = await getHistory(listingId);
  return history.length > 0 ? history[history.length - 1] : null;
}

export async function getAllLatestSnapshots(): Promise<Map<number, ScoreSnapshot>> {
  const result = new Map<number, ScoreSnapshot>();
  const historyDir = getHistoryDir();

  try {
    const files = await readdir(historyDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const listingId = parseInt(file.replace('.json', ''), 10);
      if (isNaN(listingId)) continue;

      const snapshot = await getLatestSnapshot(listingId);
      if (snapshot) {
        result.set(listingId, snapshot);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return result;
}
