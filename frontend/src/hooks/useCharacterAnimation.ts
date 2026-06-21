import { useState, useEffect, useRef } from 'react'

type CharPos = { faceX: number; faceY: number; bodySkew: number }
const DEFAULT_POS: CharPos = { faceX: 0, faceY: 0, bodySkew: 0 }

export function useCharacterAnimation(password: string, showPassword: boolean, isTyping: boolean) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)

  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  const [allPositions, setAllPositions] = useState({
    purple: DEFAULT_POS,
    black: DEFAULT_POS,
    yellow: DEFAULT_POS,
    orange: DEFAULT_POS,
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const computePosition = (ref: React.RefObject<HTMLDivElement | null>): CharPos => {
      if (!ref.current) return DEFAULT_POS
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 3
      const deltaX = mouse.x - centerX
      const deltaY = mouse.y - centerY
      return {
        faceX: Math.max(-15, Math.min(15, deltaX / 20)),
        faceY: Math.max(-10, Math.min(10, deltaY / 30)),
        bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
      }
    }

    setAllPositions({
      purple: computePosition(purpleRef),
      black: computePosition(blackRef),
      yellow: computePosition(yellowRef),
      orange: computePosition(orangeRef),
    })
  }, [mouse])

  useEffect(() => {
    let active = true
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000
    const scheduleBlink = () => {
      const t = setTimeout(() => {
        if (!active) return
        setIsPurpleBlinking(true)
        setTimeout(() => {
          if (!active) return
          setIsPurpleBlinking(false)
          scheduleBlink()
        }, 150)
      }, getRandomBlinkInterval())
      return t
    }
    const timeout = scheduleBlink()
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    let active = true
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000
    const scheduleBlink = () => {
      const t = setTimeout(() => {
        if (!active) return
        setIsBlackBlinking(true)
        setTimeout(() => {
          if (!active) return
          setIsBlackBlinking(false)
          scheduleBlink()
        }, 150)
      }, getRandomBlinkInterval())
      return t
    }
    const timeout = scheduleBlink()
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!isTyping) return
    const timer1 = setTimeout(() => setIsLookingAtEachOther(true), 0)
    const timer2 = setTimeout(() => setIsLookingAtEachOther(false), 800)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isTyping])

  useEffect(() => {
    if (!(password.length > 0 && showPassword)) return
    let active = true
    const schedulePeek = () => {
      const t = setTimeout(() => {
        if (!active) return
        setIsPurplePeeking(true)
        setTimeout(() => {
          if (!active) return
          setIsPurplePeeking(false)
        }, 800)
      }, Math.random() * 3000 + 2000)
      return t
    }
    const firstPeek = schedulePeek()
    return () => {
      active = false
      clearTimeout(firstPeek)
    }
  }, [password, showPassword])

  return {
    mouse,
    purpleRef,
    blackRef,
    yellowRef,
    orangeRef,
    purplePos: allPositions.purple,
    blackPos: allPositions.black,
    yellowPos: allPositions.yellow,
    orangePos: allPositions.orange,
    isPurpleBlinking,
    isBlackBlinking,
    isLookingAtEachOther,
    isPurplePeeking,
  }
}