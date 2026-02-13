import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

export const Route = createFileRoute('/')({ component: Home })

const COMBINATION = [3, 1, 7, 9] as const
const DIAL_MIN = 0
const DIAL_MAX = 9

function wrapDialValue(value: number) {
  const range = DIAL_MAX - DIAL_MIN + 1
  return ((value - DIAL_MIN + range) % range) + DIAL_MIN
}

function Home() {
  const [dialValues, setDialValues] = useState<number[]>(() => COMBINATION.map(() => 0))
  const [activeDialIndex, setActiveDialIndex] = useState(0)
  const [turnStateByDial, setTurnStateByDial] = useState<number[]>(() => COMBINATION.map(() => 0))
  const [isUnlocked, setIsUnlocked] = useState(false)

  const dialButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const audioContextRef = useRef<AudioContext | null>(null)

  const isCombinationMatched = useMemo(
    () => dialValues.every((value, index) => value === COMBINATION[index]),
    [dialValues],
  )

  const focusDial = (dialIndex: number) => {
    dialButtonRefs.current[dialIndex]?.focus()
  }

  const setDialValue = (dialIndex: number, nextValue: number) => {
    if (isUnlocked) {
      return
    }

    setDialValues((previous) => {
      const next = [...previous]
      const currentValue = next[dialIndex]
      const wrappedValue = wrapDialValue(nextValue)
      next[dialIndex] = wrappedValue

      setTurnStateByDial((previousTurn) => {
        const nextTurn = [...previousTurn]
        nextTurn[dialIndex] = wrappedValue === currentValue ? 0 : wrappedValue > currentValue ? 1 : -1
        return nextTurn
      })

      return next
    })
  }

  const stepDial = (dialIndex: number, delta: number) => {
    if (isUnlocked) {
      return
    }

    setDialValues((previous) => {
      const next = [...previous]
      next[dialIndex] = wrapDialValue(next[dialIndex] + delta)
      return next
    })

    setTurnStateByDial((previousTurn) => {
      const nextTurn = [...previousTurn]
      nextTurn[dialIndex] = delta >= 0 ? 1 : -1
      return nextTurn
    })
  }

  const moveActiveDial = (delta: number) => {
    const size = COMBINATION.length
    const nextIndex = ((activeDialIndex + delta + size) % size + size) % size
    setActiveDialIndex(nextIndex)
    focusDial(nextIndex)
  }

  const applyInputDigit = (dialIndex: number, digit: number) => {
    setDialValue(dialIndex, digit)
    const nextIndex = Math.min(dialIndex + 1, COMBINATION.length - 1)
    setActiveDialIndex(nextIndex)
    if (nextIndex !== dialIndex) {
      focusDial(nextIndex)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTurnStateByDial(COMBINATION.map(() => 0))
    }, 170)

    return () => clearTimeout(timeout)
  }, [dialValues])

  const playUnlockSound = () => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) {
      return
    }

    const context = audioContextRef.current ?? new AudioContextConstructor()
    audioContextRef.current = context

    if (context.state === 'suspended') {
      void context.resume()
    }

    const now = context.currentTime

    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.72), context.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.22
    }

    const noiseSource = context.createBufferSource()
    noiseSource.buffer = noiseBuffer

    const sweepFilter = context.createBiquadFilter()
    sweepFilter.type = 'bandpass'
    sweepFilter.frequency.setValueAtTime(240, now)
    sweepFilter.frequency.exponentialRampToValueAtTime(1450, now + 0.66)
    sweepFilter.Q.setValueAtTime(1.8, now)

    const sweepGain = context.createGain()
    sweepGain.gain.setValueAtTime(0.0001, now)
    sweepGain.gain.exponentialRampToValueAtTime(0.022, now + 0.12)
    sweepGain.gain.exponentialRampToValueAtTime(0.002, now + 0.62)
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72)

    noiseSource.connect(sweepFilter)
    sweepFilter.connect(sweepGain)
    sweepGain.connect(context.destination)
    noiseSource.start(now)
    noiseSource.stop(now + 0.72)

    const clunk = context.createOscillator()
    clunk.type = 'triangle'
    clunk.frequency.setValueAtTime(120, now + 0.6)
    clunk.frequency.exponentialRampToValueAtTime(78, now + 0.75)

    const clunkGain = context.createGain()
    clunkGain.gain.setValueAtTime(0.0001, now + 0.59)
    clunkGain.gain.exponentialRampToValueAtTime(0.05, now + 0.62)
    clunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82)

    clunk.connect(clunkGain)
    clunkGain.connect(context.destination)
    clunk.start(now + 0.59)
    clunk.stop(now + 0.84)
  }

  const unlockLock = () => {
    if (isUnlocked) {
      return
    }

    playUnlockSound()
    setIsUnlocked(true)
  }

  const onDialKeyDown = (
    dialIndex: number,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      moveActiveDial(event.shiftKey ? -1 : 1)
      return
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault()
      applyInputDigit(dialIndex, Number(event.key))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      stepDial(dialIndex, 1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      stepDial(dialIndex, -1)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveActiveDial(-1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveActiveDial(1)
      return
    }

    if (event.key === 'Backspace') {
      event.preventDefault()
      setDialValue(dialIndex, 0)
      if (dialIndex > 0) {
        const previousDial = dialIndex - 1
        setActiveDialIndex(previousDial)
        focusDial(previousDial)
      }
      return
    }

    if (event.key === 'Enter' && isCombinationMatched) {
      event.preventDefault()
      unlockLock()
    }
  }

  return (
    <main className="lock-page">
      <div className="lock-stage">
        <section className="vault-content" aria-hidden={!isUnlocked}>
          <div className="vault-ui-card">
            <p className="vault-ui-kicker">Unlocked Interface</p>
            <h1 className="vault-ui-title">Control Center</h1>
            <p className="vault-ui-copy">The side doors pull away to reveal the application underneath.</p>
          </div>
          <div className={`vault-bottom ${isUnlocked ? 'vault-bottom--visible' : ''}`.trim()}>
            <button
              type="button"
              className="vault-relock-button"
              onClick={() => setIsUnlocked(false)}
              disabled={!isUnlocked}
            >
              Lock again
            </button>
          </div>
        </section>

        <section className={`lock-shell ${isUnlocked ? 'lock-shell--open' : ''}`}>
          <div className="lock-sheet" aria-hidden={isUnlocked}>
            <div className="lock-sheet-wing lock-sheet-wing--left" />
            <div className="lock-sheet-wing lock-sheet-wing--right">
              <div className="lock-panel">
                <div className="dial-row" role="group" aria-label="Combination dials">
                  {dialValues.map((value, dialIndex) => {
                    const farPreviousDigit = wrapDialValue(value - 2)
                    const previousDigit = wrapDialValue(value - 1)
                    const nextDigit = wrapDialValue(value + 1)
                    const farNextDigit = wrapDialValue(value + 2)
                    const isActive = dialIndex === activeDialIndex
                    const turnClass =
                      turnStateByDial[dialIndex] > 0
                        ? 'dial-window--turn-up'
                        : turnStateByDial[dialIndex] < 0
                          ? 'dial-window--turn-down'
                          : ''

                    return (
                      <button
                        key={dialIndex}
                        ref={(node) => {
                          dialButtonRefs.current[dialIndex] = node
                        }}
                        type="button"
                        className={`dial-window ${isActive ? 'dial-window--active' : 'dial-window--idle'} ${turnClass}`.trim()}
                        onClick={() => {
                          setActiveDialIndex(dialIndex)
                        }}
                        onKeyDown={(event) => onDialKeyDown(dialIndex, event)}
                        aria-label={`Dial ${dialIndex + 1}, value ${value}`}
                      >
                        <span className="dial-digit dial-digit--muted dial-digit--far">{farPreviousDigit}</span>
                        <span className="dial-digit dial-digit--muted dial-digit--near">{previousDigit}</span>
                        <span className="dial-digit dial-digit--active">
                          {value}
                        </span>
                        <span className="dial-digit dial-digit--muted dial-digit--near">{nextDigit}</span>
                        <span className="dial-digit dial-digit--muted dial-digit--far">{farNextDigit}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="dial-helper">Type digits or use arrow keys.</p>
              </div>
                <button
                  type="button"
                  className={`lock-open-button lock-open-button--door ${isCombinationMatched ? 'lock-open-button--ready' : ''}`.trim()}
                  onClick={unlockLock}
                  disabled={!isCombinationMatched || isUnlocked}
                  aria-label="Open lock"
                >
                OPEN
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
