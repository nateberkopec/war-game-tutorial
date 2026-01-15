/**
 * Debug page entry point - displays all cards for texture debugging.
 */

import * as THREE from 'three'
import { SUITS, RANKS } from './engine/deck'
import type { Suit, Rank } from './engine/types'
import {
  generateCardFaceTexture,
  generateCardBackTexture,
  CardMesh,
  CARD_WIDTH,
  CARD_HEIGHT,
} from './ui'

// =============================================================================
// 2D Card Grid (Canvas Textures)
// =============================================================================

function render2DCards(): void {
  const container = document.getElementById('cards-container')
  if (!container) return

  // Render each suit
  for (const suit of SUITS) {
    const suitSection = document.createElement('div')
    
    const header = document.createElement('h2')
    header.textContent = suit.charAt(0).toUpperCase() + suit.slice(1)
    suitSection.appendChild(header)
    
    const row = document.createElement('div')
    row.className = 'suit-row'
    
    for (const rank of RANKS) {
      const cardContainer = document.createElement('div')
      cardContainer.className = 'card-container'
      
      // Generate texture and extract canvas
      const texture = generateCardFaceTexture(rank as Rank, suit as Suit)
      const canvas = texture.image as HTMLCanvasElement
      
      // Create a copy of the canvas for display
      const displayCanvas = document.createElement('canvas')
      displayCanvas.width = canvas.width
      displayCanvas.height = canvas.height
      displayCanvas.style.width = '80px'
      displayCanvas.style.height = `${80 * (CARD_HEIGHT / CARD_WIDTH)}px`
      displayCanvas.style.borderRadius = '4px'
      displayCanvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      
      const ctx = displayCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, 0)
      
      cardContainer.appendChild(displayCanvas)
      
      const label = document.createElement('span')
      label.className = 'card-label'
      label.textContent = `${rank}${getSuitSymbol(suit as Suit)}`
      cardContainer.appendChild(label)
      
      row.appendChild(cardContainer)
    }
    
    suitSection.appendChild(row)
    container.appendChild(suitSection)
  }
}

function renderCardBack(): void {
  const container = document.getElementById('card-back-container')
  if (!container) return
  
  const texture = generateCardBackTexture()
  const canvas = texture.image as HTMLCanvasElement
  
  const displayCanvas = document.createElement('canvas')
  displayCanvas.width = canvas.width
  displayCanvas.height = canvas.height
  displayCanvas.style.width = '120px'
  displayCanvas.style.height = `${120 * (CARD_HEIGHT / CARD_WIDTH)}px`
  displayCanvas.style.borderRadius = '6px'
  displayCanvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
  
  const ctx = displayCanvas.getContext('2d')!
  ctx.drawImage(canvas, 0, 0)
  
  container.appendChild(displayCanvas)
}

function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
  }
  return symbols[suit]
}

// =============================================================================
// 3D Preview Scene
// =============================================================================

function setup3DPreview(): void {
  const container = document.getElementById('app')
  if (!container) return

  // Scene setup
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x16213e)

  // Camera
  const aspect = container.clientWidth / container.clientHeight
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100)
  camera.position.set(0, 8, 12)
  camera.lookAt(0, 0, 0)

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  // Create cards in a grid
  const cards: CardMesh[] = []
  const backTexture = generateCardBackTexture()
  
  const cols = 13
  const rows = 4
  const spacing = CARD_WIDTH * 1.2
  const startX = -((cols - 1) * spacing) / 2
  const startZ = -((rows - 1) * CARD_HEIGHT * 1.2) / 2

  let cardIndex = 0
  for (let row = 0; row < rows; row++) {
    const suit = SUITS[row] as Suit
    for (let col = 0; col < cols; col++) {
      const rank = RANKS[col] as Rank
      
      const faceTexture = generateCardFaceTexture(rank, suit)
      const card = new CardMesh({
        rank,
        suit,
        faceTexture,
        backTexture,
      })
      
      card.position.set(startX + col * spacing, 0, startZ + row * CARD_HEIGHT * 1.2)
      card.rotation.x = -Math.PI / 2 // Lay flat on table
      card.setFaceUp(true)
      
      scene.add(card)
      cards.push(card)
      cardIndex++
    }
  }

  // Animation state
  let rotating = false
  let allFaceUp = true
  let rotationAngle = 0

  // Controls
  const rotateBtn = document.getElementById('rotate-btn')
  rotateBtn?.addEventListener('click', () => {
    rotating = !rotating
    rotateBtn.textContent = rotating ? 'Stop Rotation' : 'Toggle Rotation'
  })

  const flipBtn = document.getElementById('flip-btn')
  flipBtn?.addEventListener('click', () => {
    allFaceUp = !allFaceUp
    cards.forEach((card) => card.setFaceUp(allFaceUp))
    flipBtn.textContent = allFaceUp ? 'Flip All Cards' : 'Show Faces'
  })

  // Animation loop
  function animate(): void {
    requestAnimationFrame(animate)

    if (rotating) {
      rotationAngle += 0.005
      camera.position.x = Math.sin(rotationAngle) * 14
      camera.position.z = Math.cos(rotationAngle) * 14
      camera.lookAt(0, 0, 0)
    }

    renderer.render(scene, camera)
  }

  animate()

  // Handle resize
  window.addEventListener('resize', () => {
    const width = container.clientWidth
    const height = container.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  })
}

// =============================================================================
// Initialize
// =============================================================================

function init(): void {
  render2DCards()
  renderCardBack()
  setup3DPreview()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
