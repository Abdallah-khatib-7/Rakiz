import type { RefObject } from 'react'
import { Pupil, EyeBall } from './CharacterEyes'

type CharPos = { faceX: number; faceY: number; bodySkew: number }

export function CharacterScene({
  purpleRef,
  blackRef,
  yellowRef,
  orangeRef,
  purplePos,
  blackPos,
  yellowPos,
  orangePos,
  mouse,
  isTyping,
  isLookingAtEachOther,
  isPurpleBlinking,
  isBlackBlinking,
  isPurplePeeking,
  password,
  showPassword,
}: {
  purpleRef: RefObject<HTMLDivElement | null>
  blackRef: RefObject<HTMLDivElement | null>
  yellowRef: RefObject<HTMLDivElement | null>
  orangeRef: RefObject<HTMLDivElement | null>
  purplePos: CharPos
  blackPos: CharPos
  yellowPos: CharPos
  orangePos: CharPos
  mouse: { x: number; y: number }
  isTyping: boolean
  isLookingAtEachOther: boolean
  isPurpleBlinking: boolean
  isBlackBlinking: boolean
  isPurplePeeking: boolean
  password: string
  showPassword: boolean
}) {
  const passwordVisible = password.length > 0 && showPassword

  return (
    <div className="relative" style={{ width: '550px', height: '400px' }}>
      <div
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '70px',
          width: '180px',
          height: isTyping || (password.length > 0 && !showPassword) ? '440px' : '400px',
          backgroundColor: 'var(--color-bullion)',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: passwordVisible
            ? 'skewX(0deg)'
            : isTyping || (password.length > 0 && !showPassword)
              ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
              : `skewX(${purplePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: passwordVisible ? '20px' : isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`,
            top: passwordVisible ? '35px' : isLookingAtEachOther ? '65px' : `${40 + purplePos.faceY}px`,
          }}
        >
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            eyeColor="white"
            pupilColor="#1a1a1a"
            isBlinking={isPurpleBlinking}
            mouseX={mouse.x}
            mouseY={mouse.y}
            forceLookX={passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            eyeColor="white"
            pupilColor="#1a1a1a"
            isBlinking={isPurpleBlinking}
            mouseX={mouse.x}
            mouseY={mouse.y}
            forceLookX={passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
        </div>
      </div>

      <div
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '240px',
          width: '120px',
          height: '310px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: passwordVisible
            ? 'skewX(0deg)'
            : isLookingAtEachOther
              ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
              : isTyping || (password.length > 0 && !showPassword)
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                : `skewX(${blackPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: passwordVisible ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
            top: passwordVisible ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`,
          }}
        >
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            eyeColor="white"
            pupilColor="#1a1a1a"
            isBlinking={isBlackBlinking}
            mouseX={mouse.x}
            mouseY={mouse.y}
            forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            eyeColor="white"
            pupilColor="#1a1a1a"
            isBlinking={isBlackBlinking}
            mouseX={mouse.x}
            mouseY={mouse.y}
            forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      <div
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '0px',
          width: '240px',
          height: '200px',
          zIndex: 3,
          backgroundColor: 'var(--color-bone)',
          borderRadius: '120px 120px 0 0',
          transform: passwordVisible ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: passwordVisible ? '50px' : `${82 + (orangePos.faceX || 0)}px`,
            top: passwordVisible ? '85px' : `${90 + (orangePos.faceY || 0)}px`,
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
        </div>
      </div>

      <div
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '310px',
          width: '140px',
          height: '230px',
          backgroundColor: 'var(--color-bullion-bright)',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: passwordVisible ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: passwordVisible ? '20px' : `${52 + (yellowPos.faceX || 0)}px`,
            top: passwordVisible ? '35px' : `${40 + (yellowPos.faceY || 0)}px`,
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
        </div>
        <div
          className="absolute w-20 h-[4px] bg-[#1a1a1a] rounded-full transition-all duration-200 ease-out"
          style={{
            left: passwordVisible ? '10px' : `${40 + (yellowPos.faceX || 0)}px`,
            top: passwordVisible ? '88px' : `${88 + (yellowPos.faceY || 0)}px`,
          }}
        />
      </div>
    </div>
  )
}