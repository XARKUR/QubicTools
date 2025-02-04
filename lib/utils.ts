import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHashRate(hashrate: number): string {
  if (!hashrate) return '0 it/s'
  
  const units = ['it/s', 'Kit/s', 'Mit/s', 'Bit/s', 'Tit/s', 'Pit/s']
  let unitIndex = 0
  let value = hashrate

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000
    unitIndex++
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`
}
