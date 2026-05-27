import { getConsecutivelyAppearedMainNumbers } from '@/app/analysis/run-streak/logic/consec'
import { getAccumulatedExclusionNumbers } from '@/app/analysis/final-pick/logic/accuAdopt'
import { getChiSquareFinalPickSlice } from '@/app/analysis/final-pick/logic/chiWf'
import {
  extractMainNumbers,
  isWinningNumberRow,
  type WinningNumberRow,
} from '@/app/analysis/final-pick/types/winRow'

const chiSquareBase = (apiUrl: string, pathWithQuery: string): string =>
  `${apiUrl}/api/analysis/chi-square/${pathWithQuery}`

export type FinalPickAdoptedResult = {
  adopted: number[]
  previousDrawRows: WinningNumberRow[]
  /** N회 당첨 단건이 없거나 비정상일 때 */
  error: string | null
  /**
   * 미추첨 회차 등 N회 당첨이 없을 때: (N−1)회 당첨을 reference로 썼음을 안내.
   * 통합 페이지(당첨 조회 후)와는 다른 정의이므로 사용자에게 명시한다.
   */
  infoMessage: string | null
}

/**
 * 통합 분석과 동일한 이력 범위로 최종 채택 번호를 계산한다.
 * - 이력: draw_no < N 만
 * - N회 당첨 본6: 워크포워드 reference (있으면 사용)
 * - N회 당첨이 없으면(404) N>1일 때만 (N−1)회 당첨 본6을 reference로 대체한다.
 */
export async function fetchFinalPickAdopted(
  apiUrl: string,
  drawNo: number,
): Promise<FinalPickAdoptedResult> {
  if (!Number.isInteger(drawNo) || drawNo < 1) {
    return { adopted: [], previousDrawRows: [], error: '유효한 회차가 아닙니다.', infoMessage: null }
  }

  try {
    if (drawNo === 1) {
      const winningRes = await fetch(chiSquareBase(apiUrl, `winning-number?draw_no=1`))
      if (!winningRes.ok) {
        if (winningRes.status === 404) {
          return {
            adopted: [],
            previousDrawRows: [],
            error: '선택한 회차의 당첨번호를 찾을 수 없습니다.',
            infoMessage: null,
          }
        }
        throw new Error(`winning-number: ${winningRes.status}`)
      }
      const winningData: unknown = await winningRes.json()
      if (!isWinningNumberRow(winningData)) {
        return { adopted: [], previousDrawRows: [], error: '당첨번호 응답 형식이 올바르지 않습니다.', infoMessage: null }
      }
      const main = extractMainNumbers(winningData)
      const slice = getChiSquareFinalPickSlice({
        previousDrawRows: [],
        selectedMainNumbers: main,
        excludedByStreakNumbers: [],
        accumulatedExclusionNumbers: getAccumulatedExclusionNumbers({ previousDrawRows: [] })
          .excludedUnique,
      })
      return { adopted: slice.adopted, previousDrawRows: [], error: null, infoMessage: null }
    }

    const [winningRes, rangeRes] = await Promise.all([
      fetch(chiSquareBase(apiUrl, `winning-number?draw_no=${drawNo}`)),
      fetch(chiSquareBase(apiUrl, `winning-numbers-range?draw_no=${drawNo}`)),
    ])

    if (!rangeRes.ok) {
      throw new Error(`winning-numbers-range: ${rangeRes.status}`)
    }

    const rangeData: unknown = await rangeRes.json()
    if (!Array.isArray(rangeData)) {
      return { adopted: [], previousDrawRows: [], error: '당첨 이력 응답 형식이 올바르지 않습니다.', infoMessage: null }
    }

    const previousDrawRows = rangeData.filter(isWinningNumberRow)

    let main: number[]
    let infoMessage: string | null = null

    if (winningRes.ok) {
      const winningData: unknown = await winningRes.json()
      if (!isWinningNumberRow(winningData)) {
        return { adopted: [], previousDrawRows: [], error: '당첨번호 응답 형식이 올바르지 않습니다.', infoMessage: null }
      }
      main = extractMainNumbers(winningData)
    } else if (winningRes.status === 404 && drawNo > 1) {
      const prevRes = await fetch(chiSquareBase(apiUrl, `winning-number?draw_no=${drawNo - 1}`))
      if (!prevRes.ok) {
        return {
          adopted: [],
          previousDrawRows,
          error:
            prevRes.status === 404
              ? `${drawNo}회·${drawNo - 1}회 당첨번호를 모두 찾을 수 없습니다.`
              : `전회차 당첨 조회 실패: ${prevRes.status}`,
          infoMessage: null,
        }
      }
      const prevData: unknown = await prevRes.json()
      if (!isWinningNumberRow(prevData)) {
        return { adopted: [], previousDrawRows: [], error: '전회차 당첨번호 응답 형식이 올바르지 않습니다.', infoMessage: null }
      }
      main = extractMainNumbers(prevData)
      infoMessage = `${drawNo}회는 아직 당첨번호가 없어, 카이제곱 워크포워드 기준 번호로 ${drawNo - 1}회 당첨 본번호 6개를 사용했습니다.`
    } else {
      throw new Error(`winning-number: ${winningRes.status}`)
    }
    const excludedByStreakNumbers = getConsecutivelyAppearedMainNumbers(previousDrawRows, drawNo)
    const accumulated = getAccumulatedExclusionNumbers({ previousDrawRows })

    const slice = getChiSquareFinalPickSlice({
      previousDrawRows,
      selectedMainNumbers: main,
      excludedByStreakNumbers,
      accumulatedExclusionNumbers: accumulated.excludedUnique,
    })

    return { adopted: slice.adopted, previousDrawRows, error: null, infoMessage }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      adopted: [],
      previousDrawRows: [],
      error: msg || '통합 채택 계산 중 오류가 발생했습니다.',
      infoMessage: null,
    }
  }
}
