/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    approved: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    none: 'bg-gray-100 text-gray-800',
    partial: 'bg-blue-100 text-blue-800',
    full: 'bg-green-100 text-green-800',
  }
  
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice()
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0])
  return newArray
}

export function removeDuplicates<T>(array: T[], key?: keyof T): T[] {
  if (key) {
    return array.filter((item, index, self) =>
      index === self.findIndex(t => t[key] === item[key])
    )
  }
  return Array.from(new Set(array))
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return array.sort((a, b) => {
    const aValue = a[key]
    const bValue = b[key]
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function isObjectEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0
}

export function getQueryParam(param: string): string | null {
  if (typeof window === 'undefined') return null
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}

export function setQueryParam(param: string, value: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set(param, value)
  window.history.pushState({}, '', url.toString())
}

export function removeQueryParam(param: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete(param)
  window.history.pushState({}, '', url.toString())
}

export function generateGradient(from: string, to: string): string {
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Check if the number is valid
  if (cleaned.length < 10) return phone
  
  // Format based on length
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length > 10) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4')
  }
  
  return phone
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function unslugify(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607',
    '#FF006E', '#8338EC', '#3A86FF', '#38B000', '#F15BB5'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat('en-US').format(number)
}

export function percentage(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100)
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadFile(content: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}// lib/utils.ts (update with dark mode classes)

// Add color utilities for dark mode
export const statusColors = {
  draft: { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-800 text-gray-200' },
  published: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900 text-green-200' },
  locked: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900 text-blue-200' },
  deadline_reached: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900 text-yellow-200' },
  revealed: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900 text-purple-200' },
  closed: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900 text-indigo-200' },
  cancelled: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900 text-red-200' }
} as const

export const workflowColors = {
  open: { 
    light: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    dark: 'bg-emerald-900/20 text-emerald-300 border-emerald-700'
  },
  closed: { 
    light: 'bg-blue-500/10 text-blue-700 border-blue-300',
    dark: 'bg-blue-900/20 text-blue-300 border-blue-700'
  }
} as const;
// lib/utils.ts (add if not present)
export const categoryColors = {
  freelance: { 
    light: 'bg-emerald-500/20 text-emerald-800 border-emerald-300',
    dark: 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
  },
  professional: { 
    light: 'bg-blue-500/20 text-blue-800 border-blue-300',
    dark: 'bg-blue-900/30 text-blue-300 border-blue-700'
  }
} as const;

