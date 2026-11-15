export interface CareerStats {
  tacticalElo: number;
  solvedIds: number[];
  totalSolved: number;
  bestRushScore: number;
  bestRushSolved: number;
}

const CAREER_STORAGE_KEY = 'daily_chess_tactics_career_v1';

const DEFAULT_CAREER: CareerStats = {
  tacticalElo: 1200,
  solvedIds: [],
  totalSolved: 0,
  bestRushScore: 0,
  bestRushSolved: 0,
};

export function computeNextTacticalElo(
  currentElo: number,
  puzzleRating: number,
  solved: boolean,
  usedHint: boolean,
  mistakes: number
): number {
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - currentElo) / 400));
  const actual = !solved ? 0 : usedHint || mistakes > 0 ? 0.65 : 1;
  const delta = Math.round(32 * (actual - expected));
  return Math.max(600, Math.min(2800, currentElo + delta));
}

export function loadCareerStats(): CareerStats {
  try {
    const raw = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return DEFAULT_CAREER;
    const parsed = JSON.parse(raw) as Partial<CareerStats>;
    return {
      tacticalElo: typeof parsed.tacticalElo === 'number' ? parsed.tacticalElo : 1200,
      solvedIds: Array.isArray(parsed.solvedIds)
        ? parsed.solvedIds.filter((n): n is number => typeof n === 'number')
        : [],
      totalSolved: typeof parsed.totalSolved === 'number' ? parsed.totalSolved : 0,
      bestRushScore: typeof parsed.bestRushScore === 'number' ? parsed.bestRushScore : 0,
      bestRushSolved: typeof parsed.bestRushSolved === 'number' ? parsed.bestRushSolved : 0,
    };
  } catch {
    return DEFAULT_CAREER;
  }
}

function saveCareerStats(stats: CareerStats): void {
  try {
    window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage unavailable in restricted iframe
  }
}

export function recordCareerPuzzleOutcome(
  puzzleId: number,
  puzzleRating: number,
  solved: boolean,
  usedHint: boolean,
  mistakes: number
): CareerStats {
  const prev = loadCareerStats();
  const nextElo = computeNextTacticalElo(
    prev.tacticalElo,
    puzzleRating,
    solved,
    usedHint,
    mistakes
  );
  const solvedSet = new Set(prev.solvedIds);
  if (solved) solvedSet.add(puzzleId);

  const next: CareerStats = {
    ...prev,
    tacticalElo: nextElo,
    solvedIds: Array.from(solvedSet),
    totalSolved: solved ? prev.totalSolved + 1 : prev.totalSolved,
  };
  saveCareerStats(next);
  return next;
}

export function recordCareerRushResult(score: number, solvedCount: number): {
  stats: CareerStats;
  isNewBest: boolean;
} {
  const prev = loadCareerStats();
  const isNewBest = score > prev.bestRushScore;
  const next: CareerStats = {
    ...prev,
    bestRushScore: Math.max(prev.bestRushScore, score),
    bestRushSolved: Math.max(prev.bestRushSolved, solvedCount),
  };
  saveCareerStats(next);
  return { stats: next, isNewBest };
}
