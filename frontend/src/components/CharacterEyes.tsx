import { useRef } from 'react'

interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  mouseX: number
  mouseY: number
  forceLookX?: number
  forceLookY?: number
}

export function Pupil({ size = 12, maxDistance = 5, pupilColor = 'black', mouseX, mouseY, forceLookX, forceLookY }: PupilProps) {
  const pupilRef = useRef<HTMLDivElement>(null)

  let x = 0
  let y = 0
  if (forceLookX !== undefined && forceLookY !== undefined) {
    x = forceLookX
    y = forceLookY
  } else if (pupilRef.current) {
    const pupil = pupilRef.current.getBoundingClientRect()
    const pupilCenterX = pupil.left + pupil.width / 2
    const pupilCenterY = pupil.top + pupil.height / 2
    const deltaX = mouseX - pupilCenterX
    const deltaY = mouseY - pupilCenterY
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
    const angle = Math.atan2(deltaY, deltaX)
    x = Math.cos(angle) * distance
    y = Math.sin(angle) * distance
  }

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  )
}

interface EyeBallProps {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  mouseX: number
  mouseY: number
  forceLookX?: number
  forceLookY?: number
}

export function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = 'black',
  isBlinking = false,
  mouseX,
  mouseY,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const eyeRef = useRef<HTMLDivElement>(null)

  let x = 0
  let y = 0
  if (forceLookX !== undefined && forceLookY !== undefined) {
    x = forceLookX
    y = forceLookY
  } else if (eyeRef.current) {
    const eye = eyeRef.current.getBoundingClientRect()
    const eyeCenterX = eye.left + eye.width / 2
    const eyeCenterY = eye.top + eye.height / 2
    const deltaX = mouseX - eyeCenterX
    const deltaY = mouseY - eyeCenterY
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
    const angle = Math.atan2(deltaY, deltaX)
    x = Math.cos(angle) * distance
    y = Math.sin(angle) * distance
  }

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${x}px, ${y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}