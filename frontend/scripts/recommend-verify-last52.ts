/**
 * 추천 20세트 백테스트: 최근 N회차(기본 52)에 대해 앱과 동일 파이프라인으로 세트를 생성하고 실제 당첨과 등수를 집계한다.
 *
 * 실행(백엔드 8010 가동 후):
 *   cd frontend && npm run verify:recommend-last52
 *
 * 환경 변수:
 *   RECOMMEND_VERIFY_API_URL — API 베이스 URL (기본 http://127.0.0.1:8010)
 *   RECOMMEND_VERIFY_DRAWS — 처리할 최근 회차 수 (기본 52)
 *
 * 참고: Node ESM에서 상대 경로는 `.ts` 확장자를 붙여야 로드가 안정적이다.
 */

import { fetchDrawNumbers, fetchRecommendBaseData } from '../src/app/recommend/logic/api.ts'
import { generate20Sets } from '../src/app/recommend/logic/generator.ts'
import { runRecommendPipeline } from '../src/app/recommend/logic/pipeline.ts'
import type { GeneratedSet, TrendNumberResult, WinningHistoryRow } from '../src/app/recommend/logic/types.ts'
import { RECOMMEND_RULES } from '../src/app/recommend/logic/recommendRulesList.ts'
import { isWinningRow } from '../src/app/recommend/logic/validators.ts'

/** 로또 6/45 등수: 1~5등, 낙첨은 null */
function rankLotto645(pick: number[], winningMain: number[], bonus: number): 1 | 2 | 3 | 4 | 5 | null {
  const mainSet = new Set(winningMain)
  let matchedMain = 0
  for (const n of pick) {
    if (mainSet.has(n)) matchedMain += 1
  }
  const hasBonus = pick.includes(bonus)
  if (matchedMain === 6) return 1
  if (matchedMain === 5 && hasBonus) return 2
  if (matchedMain === 5) return 3
  if (matchedMain === 4) return 4
  if (matchedMain === 3) return 5
  return null
}

function setToNumbers(set: GeneratedSet): number[] {
  return [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6]
}

function bestRank(ranks: Array<1 | 2 | 3 | 4 | 5 | null>): 1 | 2 | 3 | 4 | 5 | null {
  const order: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]
  let best: 1 | 2 | 3 | 4 | 5 | null = null
  for (const r of ranks) {
    if (r === null) continue
    if (best === null || order.indexOf(r) < order.indexOf(best)) best = r
  }
  return best
}

function rankLabel(r: 1 | 2 | 3 | 4 | 5 | null): string {
  if (r === null) return '-'
  return `${r}등`
}

async function fetchWinningRow(
  apiUrl: string,
  drawNo: number,
): Promise<{ main: number[]; bonus: number } | null> {
  const res = await fetch(`${apiUrl}/api/analysis/accumulated-numbers/winning-number?draw_no=${drawNo}`)
  if (!res.ok) return null
  const data: unknown = await res.json()
  if (!isWinningRow(data)) return null
  return {
    main: [data.num1, data.num2, data.num3, data.num4, data.num5, data.num6],
    bonus: data.bonus_num,
  }
}

function buildGeneratedSets(
  excludedNumbers: number[],
  trendResults: TrendNumberResult[],
  allHistoryRows: WinningHistoryRow[],
): GeneratedSet[] {
  const excludedSet = new Set(excludedNumbers)
  const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !excludedSet.has(n))
  return generate20Sets(availableNumbers, trendResults, allHistoryRows)
}

const DEFAULT_API = 'http://127.0.0.1:8010'
const DEFAULT_DRAWS = 52

async function main(): Promise<void> {
  const apiUrl = (process.env.RECOMMEND_VERIFY_API_URL ?? DEFAULT_API).replace(/\/$/, '')
  const maxDraws = Math.max(1, Number.parseInt(process.env.RECOMMEND_VERIFY_DRAWS ?? String(DEFAULT_DRAWS), 10) || DEFAULT_DRAWS)

  const drawNumbersDesc = await fetchDrawNumbers(apiUrl)
  const selected = drawNumbersDesc.slice(0, maxDraws)
  const chronological = [...selected].sort((a, b) => a - b)

  console.log(`API: ${apiUrl}`)
  console.log(`처리 회차 수: ${chronological.length} (요청 상한 ${maxDraws}, DB 내림차순 상위에서 선택)\n`)

  const counts: Record<'1' | '2' | '3' | '4' | '5' | 'miss', number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    miss: 0,
  }

  const perDrawLines: string[] = []
  let roundsWithAnyPrize = 0
  /** 당첨 데이터가 있어 실제로 세트와 비교한 회차 수 */
  let drawsWithWinningData = 0
  /** 실제 비교한 세트 건수 합(회차마다 생성 세트 개수가 20 미만일 수 있음) */
  let totalComparisons = 0

  for (const drawNo of chronological) {
    const baseData = await fetchRecommendBaseData(apiUrl, drawNo)
    const pipeline = runRecommendPipeline(
      {
        exclusionCandidates: baseData.exclusionCandidates,
        chiSquareRows: baseData.chiSquareRows,
        trendResults: baseData.trendResults,
        absenceStreakRows: baseData.absenceStreakRows,
      },
      RECOMMEND_RULES,
    )

    const sets = buildGeneratedSets(
      pipeline.excludedNumbers,
      baseData.trendResults,
      baseData.allHistoryRows,
    )

    const win = await fetchWinningRow(apiUrl, drawNo)
    if (!win) {
      perDrawLines.push(`${drawNo}회: 당첨번호 없음 — 스킵`)
      continue
    }

    drawsWithWinningData += 1
    totalComparisons += sets.length
    const ranks: Array<1 | 2 | 3 | 4 | 5 | null> = []
    for (const set of sets) {
      const r = rankLotto645(setToNumbers(set), win.main, win.bonus)
      ranks.push(r)
      if (r === null) counts.miss += 1
      else counts[String(r) as '1' | '2' | '3' | '4' | '5'] += 1
    }

    const best = bestRank(ranks)
    if (best !== null) roundsWithAnyPrize += 1

    const rankStrs = ranks.map(rankLabel).join(', ')
    perDrawLines.push(`${drawNo}회: 최고 ${rankLabel(best)} | 세트별 [${rankStrs}]`)
  }

  const denom = totalComparisons
  const prizesTotal = counts['1'] + counts['2'] + counts['3'] + counts['4'] + counts['5']

  console.log('--- 회차별 요약 ---')
  for (const line of perDrawLines) console.log(line)

  console.log('\n--- 등수별 누적 (세트×회차 건수) ---')
  console.log(`1등: ${counts['1']}, 2등: ${counts['2']}, 3등: ${counts['3']}, 4등: ${counts['4']}, 5등: ${counts['5']}, 낙첨: ${counts.miss}`)
  console.log(
    `총 비교 건수: ${denom} (당첨 데이터 있는 ${drawsWithWinningData}회차, 생성 세트 합계; 선택된 전체 ${chronological.length}회차)`,
  )

  console.log('\n--- 비율 (분모 = 총 비교 건수) ---')
  const pct = (n: number) => (denom > 0 ? ((n / denom) * 100).toFixed(4) : '0.0000')
  console.log(`5등 이상 합계: ${prizesTotal} (${pct(prizesTotal)}%)`)
  for (const k of ['1', '2', '3', '4', '5'] as const) {
    console.log(`${k}등: ${counts[k]} (${pct(counts[k])}%)`)
  }
  console.log(`낙첨: ${counts.miss} (${pct(counts.miss)}%)`)

  console.log('\n--- 회차당 “5등 이상 1건 이상” 비율 (당첨 데이터 있는 회차만) ---')
  const roundPct =
    drawsWithWinningData > 0 ? ((roundsWithAnyPrize / drawsWithWinningData) * 100).toFixed(4) : '0.0000'
  console.log(`${roundsWithAnyPrize} / ${drawsWithWinningData} 회차 (${roundPct}%)`)

  console.log('\n--- JSON 요약 ---')
  console.log(
    JSON.stringify(
      {
        apiUrl,
        processedDraws: chronological.length,
        drawsWithWinningData,
        totalComparisons,
        drawNos: chronological,
        counts,
        denominator: denom,
        rates: {
          anyPrize: denom > 0 ? prizesTotal / denom : 0,
          byRank: {
            '1': denom > 0 ? counts['1'] / denom : 0,
            '2': denom > 0 ? counts['2'] / denom : 0,
            '3': denom > 0 ? counts['3'] / denom : 0,
            '4': denom > 0 ? counts['4'] / denom : 0,
            '5': denom > 0 ? counts['5'] / denom : 0,
            miss: denom > 0 ? counts.miss / denom : 0,
          },
          roundsWithAtLeastOnePrize: drawsWithWinningData > 0 ? roundsWithAnyPrize / drawsWithWinningData : 0,
        },
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
