'use client';

import { useState, useRef, useEffect } from 'react';

const GOLD = '#D4A843';
const PANEL = '#161616';
const BORDER = '#2A2A2A';
const MUTED = '#777';
const CORRECT_CODE = '2026';

interface ResetModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function ResetModal({ onSuccess, onClose }: ResetModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check code when all 4 digits entered
    if (value && index === 3) {
      const code = newDigits.join('');
      if (code === CORRECT_CODE) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setDigits(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }, 1500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 32,
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: GOLD, marginBottom: 8 }}>
          Enter Passcode
        </h3>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>
          This will reset the entire game for everyone.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 52,
                height: 60,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 600,
                background: '#0D0D0D',
                border: `2px solid ${error ? '#E53935' : digit ? GOLD : BORDER}`,
                borderRadius: 10,
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: '#E53935', fontSize: 13, marginBottom: 12 }}>
            Wrong code — try again
          </p>
        )}

        <p style={{ color: MUTED, fontSize: 11 }}>Hint: the year of the ceremony</p>

        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: '10px 24px',
            background: 'transparent',
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            color: MUTED,
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
