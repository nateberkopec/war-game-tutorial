import * as THREE from 'three'
import { Rank, Suit, CARD_WIDTH, CARD_HEIGHT } from './card'

/**
 * Texture resolution (pixels per world unit).
 */
const TEXTURE_SCALE = 256

/**
 * Card texture dimensions in pixels.
 */
const TEXTURE_WIDTH = Math.round(CARD_WIDTH * TEXTURE_SCALE)
const TEXTURE_HEIGHT = Math.round(CARD_HEIGHT * TEXTURE_SCALE)

/**
 * Suit symbols and colors.
 */
const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '\u2665',   // Filled heart
  diamonds: '\u2666', // Filled diamond
  clubs: '\u2663',    // Filled club
  spades: '\u2660'    // Filled spade
}

const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#e63946',
  diamonds: '#e63946',
  clubs: '#1d3557',
  spades: '#1d3557'
}

/**
 * Cache for generated textures.
 */
const textureCache = new Map<string, THREE.CanvasTexture>()
let backTextureCache: THREE.CanvasTexture | null = null

/**
 * Generate a texture for a card face.
 * Uses Canvas 2D to draw rank and suit.
 */
export function generateCardFaceTexture(rank: Rank, suit: Suit): THREE.CanvasTexture {
  const cacheKey = `${rank}-${suit}`
  const cached = textureCache.get(cacheKey)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_WIDTH
  canvas.height = TEXTURE_HEIGHT

  const ctx = canvas.getContext('2d')!
  
  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
  
  // Draw border
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 2
  ctx.strokeRect(4, 4, TEXTURE_WIDTH - 8, TEXTURE_HEIGHT - 8)
  
  const color = SUIT_COLORS[suit]
  const symbol = SUIT_SYMBOLS[suit]
  
  // Draw corner rank and suit (top-left)
  ctx.fillStyle = color
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(rank, 16, 12)
  ctx.font = '28px Arial'
  ctx.fillText(symbol, 18, 48)
  
  // Draw corner rank and suit (bottom-right, inverted)
  ctx.save()
  ctx.translate(TEXTURE_WIDTH, TEXTURE_HEIGHT)
  ctx.rotate(Math.PI)
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(rank, 16, 12)
  ctx.font = '28px Arial'
  ctx.fillText(symbol, 18, 48)
  ctx.restore()
  
  // Draw center symbol(s)
  drawCenterPips(ctx, rank, suit)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  
  textureCache.set(cacheKey, texture)
  return texture
}

/**
 * Draw the center pip layout for a card.
 */
function drawCenterPips(ctx: CanvasRenderingContext2D, rank: Rank, suit: Suit): void {
  const symbol = SUIT_SYMBOLS[suit]
  const color = SUIT_COLORS[suit]
  ctx.fillStyle = color
  
  const centerX = TEXTURE_WIDTH / 2
  const centerY = TEXTURE_HEIGHT / 2
  
  // Face cards draw a large letter in the center
  if (rank === 'J' || rank === 'Q' || rank === 'K') {
    ctx.font = 'bold 80px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(rank, centerX, centerY)
    
    // Small suits in corners of center area
    ctx.font = '32px Arial'
    ctx.fillText(symbol, centerX - 60, centerY - 80)
    ctx.fillText(symbol, centerX + 60, centerY + 80)
    return
  }
  
  // Ace draws a large symbol
  if (rank === 'A') {
    ctx.font = '100px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(symbol, centerX, centerY)
    return
  }
  
  // Number cards draw pip patterns
  const pipSize = 40
  ctx.font = `${pipSize}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const numPips = parseInt(rank, 10)
  const positions = getPipPositions(numPips)
  
  for (const pos of positions) {
    const x = centerX + pos.x * 50
    const y = centerY + pos.y * 70
    
    ctx.save()
    if (pos.inverted) {
      ctx.translate(x, y)
      ctx.rotate(Math.PI)
      ctx.fillText(symbol, 0, 0)
    } else {
      ctx.fillText(symbol, x, y)
    }
    ctx.restore()
  }
}

/**
 * Get pip positions for number cards.
 * Positions are relative to center, normalized to [-1, 1] range.
 */
interface PipPosition {
  x: number
  y: number
  inverted?: boolean
}

function getPipPositions(count: number): PipPosition[] {
  switch (count) {
    case 2:
      return [
        { x: 0, y: -1 },
        { x: 0, y: 1, inverted: true }
      ]
    case 3:
      return [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1, inverted: true }
      ]
    case 4:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    case 5:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: 0, y: 0 },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    case 6:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: -0.6, y: 0 },
        { x: 0.6, y: 0 },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    case 7:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: 0, y: -0.5 },
        { x: -0.6, y: 0 },
        { x: 0.6, y: 0 },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    case 8:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: 0, y: -0.5 },
        { x: -0.6, y: 0 },
        { x: 0.6, y: 0 },
        { x: 0, y: 0.5, inverted: true },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    case 9:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: -0.6, y: -0.33 },
        { x: 0.6, y: -0.33 },
        { x: 0, y: 0 },
        { x: -0.6, y: 0.33, inverted: true },
        { x: 0.6, y: 0.33, inverted: true },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    case 10:
      return [
        { x: -0.6, y: -1 },
        { x: 0.6, y: -1 },
        { x: 0, y: -0.66 },
        { x: -0.6, y: -0.33 },
        { x: 0.6, y: -0.33 },
        { x: -0.6, y: 0.33, inverted: true },
        { x: 0.6, y: 0.33, inverted: true },
        { x: 0, y: 0.66, inverted: true },
        { x: -0.6, y: 1, inverted: true },
        { x: 0.6, y: 1, inverted: true }
      ]
    default:
      return []
  }
}

/**
 * Generate the card back texture.
 * Creates a simple pattern design.
 */
export function generateCardBackTexture(): THREE.CanvasTexture {
  if (backTextureCache) return backTextureCache

  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_WIDTH
  canvas.height = TEXTURE_HEIGHT

  const ctx = canvas.getContext('2d')!
  
  // Dark blue background
  ctx.fillStyle = '#1d3557'
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
  
  // Draw border
  ctx.strokeStyle = '#f1faee'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, TEXTURE_WIDTH - 16, TEXTURE_HEIGHT - 16)
  
  // Inner border
  ctx.strokeStyle = '#a8dadc'
  ctx.lineWidth = 2
  ctx.strokeRect(16, 16, TEXTURE_WIDTH - 32, TEXTURE_HEIGHT - 32)
  
  // Diamond pattern
  ctx.fillStyle = '#457b9d'
  const patternSize = 20
  const startX = 30
  const startY = 30
  const endX = TEXTURE_WIDTH - 30
  const endY = TEXTURE_HEIGHT - 30
  
  for (let y = startY; y < endY; y += patternSize * 2) {
    for (let x = startX; x < endX; x += patternSize * 2) {
      const offsetX = ((y - startY) / (patternSize * 2)) % 2 === 0 ? 0 : patternSize
      drawDiamond(ctx, x + offsetX, y, patternSize * 0.4)
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  
  backTextureCache = texture
  return texture
}

/**
 * Draw a small diamond shape.
 */
function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.beginPath()
  ctx.moveTo(cx, cy - size)
  ctx.lineTo(cx + size, cy)
  ctx.lineTo(cx, cy + size)
  ctx.lineTo(cx - size, cy)
  ctx.closePath()
  ctx.fill()
}

/**
 * Clear the texture cache and release memory.
 */
export function clearTextureCache(): void {
  for (const texture of textureCache.values()) {
    texture.dispose()
  }
  textureCache.clear()
  
  if (backTextureCache) {
    backTextureCache.dispose()
    backTextureCache = null
  }
}

/**
 * Generate all card face textures for a standard deck.
 * Useful for pre-loading.
 */
export function preloadAllTextures(): void {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  
  for (const suit of suits) {
    for (const rank of ranks) {
      generateCardFaceTexture(rank, suit)
    }
  }
  
  generateCardBackTexture()
}
