import { describe, expect, it } from 'vitest'
import { bestRank, rankLabel, rankLotto645 } from '@/app/recommend/logic/lottoRank'

describe('rankLotto645', () => {
  const main = [1, 2, 3, 4, 5, 6]
  const bonus = 7

  it('1등: 주번호 6개 일치', () => {
    expect(rankLotto645([1, 2, 3, 4, 5, 6], main, bonus)).toBe(1)
  })

  it('2등: 주번호 5개 + 보너스', () => {
    expect(rankLotto645([1, 2, 3, 4, 5, 7], main, bonus)).toBe(2)
  })

  it('3등: 주번호 5개, 보너스 없음', () => {
    expect(rankLotto645([1, 2, 3, 4, 5, 8], main, bonus)).toBe(3)
  })

  it('4등: 주번호 4개', () => {
    expect(rankLotto645([1, 2, 3, 4, 8, 9], main, bonus)).toBe(4)
  })

  it('5등: 주번호 3개', () => {
    expect(rankLotto645([1, 2, 3, 8, 9, 10], main, bonus)).toBe(5)
  })

  it('낙첨: 주번호 2개 이하', () => {
    expect(rankLotto645([1, 2, 8, 9, 10, 11], main, bonus)).toBeNull()
  })
})

describe('bestRank', () => {
  it('가장 높은 등수(숫자가 가장 작은 등)를 고른다', () => {
    expect(bestRank([null, 5, 3, null, 4])).toBe(3)
  })

  it('전부 낙첨이면 null', () => {
    expect(bestRank([null, null])).toBeNull()
  })

  it('1등이 있으면 1등', () => {
    expect(bestRank([5, 1, null])).toBe(1)
  })
})

describe('rankLabel', () => {
  it('낙첨은 대시', () => {
    expect(rankLabel(null)).toBe('-')
  })

  it('등수 문자열', () => {
    expect(rankLabel(4)).toBe('4등')
  })
})
