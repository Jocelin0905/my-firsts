import { MILESTONE_THRESHOLDS } from './constants'
import type { AppData } from './types'

export function registerMilestoneAfterCreate(data: AppData, year: number, previousCount: number) {
  const currentCount = data.firsts.filter((first) => first.year === year).length
  const celebrated = data.celebratedMilestones[String(year)] ?? []
  const milestone = MILESTONE_THRESHOLDS.find(
    (threshold) => previousCount < threshold && currentCount >= threshold && !celebrated.includes(threshold),
  ) ?? null

  if (milestone === null) return { data, milestone }

  return {
    milestone,
    data: {
      ...data,
      celebratedMilestones: {
        ...data.celebratedMilestones,
        [String(year)]: [...celebrated, milestone].sort((a, b) => a - b),
      },
    },
  }
}
