'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GameState, Player, Screen } from '@/lib/types';
import { CATEGORIES, TIER_LABELS, TIER_POINTS, MAX_PLAYERS, TOTAL_CATEGORIES } from '@/lib/categories';
import ResetModal from '@/components/ResetModal';
import Confetti from '@/components/Confetti';

const GOLD = '#D4A843';
const PANEL = '#161616';
const BORDER = '#2A2A2A';
const MUTED = '#777';

const SESSION_KEY = 'oscar26-me';

function getPlayerScore(player: Player, results: Record<string, string>): number {
  let score = 0;
  for (const cat of CATEGORIES) {
    if (results[cat.id] && player.predictions[cat.id] === results[cat.id]) {
      score += TIER_POINTS[cat.tier];
    }
  }
  return score;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myName, setMyName] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [screen, setScreen] = useState<Screen>('join');
  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [localPredictions, setLocalPredictions] = useState<Record<string, string>>({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [liveTab, setLiveTab] = useState<'all' | 'mark' | 'category'>('all');
  const [confirmLock, setConfirmLock] = useState(false);
  const [viewingPicks, setViewingPicks] = useState(false);
  const [celebration, setCelebration] = useState<{ names: string[]; category: string } | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  // Fetch initial state
  useEffect(() => {
    const fetchState = async () => {
      const { data } = await supabase
        .from('game_state')
        .select('*')
        .eq('id', 'main')
        .single();
      if (data) setGameState(data as GameState);
    };
    fetchState();

    // Realtime subscription
    const channel = supabase
      .channel('game-state-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state', filter: 'id=eq.main' },
        (payload) => {
          const newState = payload.new as GameState;
          setGameState(newState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Session persistence — restore nickname from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) setMyName(saved);
  }, []);

  // Track whether we've restored predictions from the server
  const hasRestoredPredictions = useRef(false);

  // Determine screen based on game state and player status
  useEffect(() => {
    if (!gameState || !myName) {
      setScreen('join');
      return;
    }
    const me = gameState.players.find((p) => p.name === myName);
    if (!me) {
      // Name is in localStorage but not in game — clear it
      localStorage.removeItem(SESSION_KEY);
      setMyName('');
      setScreen('join');
      return;
    }
    const allLocked = gameState.players.length === MAX_PLAYERS && gameState.players.every((p) => p.lockedIn);
    if (allLocked && !viewingPicks) {
      setScreen('live');
    } else if (allLocked && viewingPicks) {
      setScreen('predict');
    } else if (me.lockedIn) {
      setScreen('waiting');
    } else {
      setScreen('predict');
      // Restore predictions from server on first load (e.g. returning user)
      if (!hasRestoredPredictions.current && Object.keys(me.predictions).length > 0) {
        hasRestoredPredictions.current = true;
        setLocalPredictions(me.predictions);
      }
    }
  }, [gameState, myName, viewingPicks]);

  const updateGameState = useCallback(async (players: Player[], results?: Record<string, string>) => {
    const update: { players: Player[]; results?: Record<string, string>; updated_at: string } = {
      players,
      updated_at: new Date().toISOString(),
    };
    if (results !== undefined) update.results = results;
    await supabase.from('game_state').update(update).eq('id', 'main');
  }, []);

  const handleJoin = async () => {
    const name = nicknameInput.trim();
    if (!name || !gameState) return;
    if (gameState.players.length >= MAX_PLAYERS) return;
    if (gameState.players.some((p) => p.name === name)) return;
    const newPlayer: Player = { name, predictions: {}, lockedIn: false };
    const newPlayers = [...gameState.players, newPlayer];
    localStorage.setItem(SESSION_KEY, name);
    setMyName(name);
    setNicknameInput('');
    // Optimistically update local state so screen transitions immediately
    setGameState({ ...gameState, players: newPlayers });
    await updateGameState(newPlayers);
  };

  const handleSelectNominee = async (categoryId: string, nominee: string) => {
    if (!gameState || !myName) return;
    const newPredictions = { ...localPredictions, [categoryId]: nominee };
    setLocalPredictions(newPredictions);
    // Save to supabase
    const newPlayers = gameState.players.map((p) =>
      p.name === myName ? { ...p, predictions: newPredictions } : p
    );
    await updateGameState(newPlayers);
  };

  const handleLockIn = async () => {
    if (!gameState || !myName) return;
    const newPlayers = gameState.players.map((p) =>
      p.name === myName ? { ...p, lockedIn: true } : p
    );
    await updateGameState(newPlayers);
    setConfirmLock(false);
  };

  const handleMarkWinner = async (categoryId: string, nominee: string) => {
    if (!gameState) return;
    const newResults = { ...gameState.results, [categoryId]: nominee };
    // Check who got it right for celebration
    const correctPlayers = gameState.players.filter((p) => p.predictions[categoryId] === nominee);
    if (correctPlayers.length > 0) {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      setCelebration({ names: correctPlayers.map((p) => p.name), category: cat?.name || '' });
      setTimeout(() => setCelebration(null), 4000);
    }
    await updateGameState(gameState.players, newResults);
  };

  const handleUndoWinner = async (categoryId: string) => {
    if (!gameState) return;
    const newResults = { ...gameState.results };
    delete newResults[categoryId];
    await updateGameState(gameState.players, newResults);
  };

  const handleReset = async () => {
    await supabase
      .from('game_state')
      .update({ players: [], results: {}, updated_at: new Date().toISOString() })
      .eq('id', 'main');
    localStorage.removeItem(SESSION_KEY);
    setMyName('');
    setLocalPredictions({});
    setScreen('join');
    setShowResetModal(false);
    setConfirmLock(false);
    setLiveTab('all');
    setCurrentCatIndex(0);
  };

  const pickedCount = Object.keys(localPredictions).length;
  const currentCat = CATEGORIES[currentCatIndex];

  // Scroll active pill into view
  useEffect(() => {
    if (pillsRef.current) {
      const active = pillsRef.current.querySelector('[data-active="true"]');
      if (active) {
        active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentCatIndex]);

  const containerStyle: React.CSSProperties = {
    maxWidth: 520,
    margin: '0 auto',
    padding: '20px 16px',
    minHeight: '100vh',
    fontFamily: "'Outfit', sans-serif",
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700,
  };

  // ─── JOIN SCREEN ───
  if (screen === 'join') {
    return (
      <div style={containerStyle}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '40px 0 30px' }}>
          <div style={{ fontSize: 64 }}>🏆</div>
          <p style={{ color: GOLD, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginTop: 12 }}>
            98th Academy Awards
          </p>
          <h1 style={{ ...headingStyle, fontSize: 48, color: GOLD, marginTop: 4 }}>Oscar Night</h1>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>March 15, 2026</p>
        </div>

        {/* Nickname input */}
        {(!gameState || gameState.players.length < MAX_PLAYERS) && !myName && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Enter your nickname"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={16}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
              }}
            />
            <button
              onClick={handleJoin}
              style={{
                padding: '12px 24px',
                background: GOLD,
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Join
            </button>
          </div>
        )}

        {/* Player lobby */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Players
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
              const player = gameState?.players[i];
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    background: player ? PANEL : 'transparent',
                    border: player ? `1px solid ${BORDER}` : `2px dashed ${BORDER}`,
                    borderRadius: 10,
                    textAlign: 'center',
                  }}
                >
                  {player ? (
                    <>
                      <div style={{ fontSize: 24 }}>🎬</div>
                      <p style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: player.name === myName ? GOLD : '#fff' }}>
                        {player.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, opacity: 0.3 }}>👤</div>
                      <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Waiting…</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scoring explainer */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ ...headingStyle, fontSize: 20, color: GOLD, marginBottom: 12 }}>Scoring</h3>
          {[1, 2, 3].map((tier) => (
            <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: tier < 3 ? `1px solid ${BORDER}` : 'none' }}>
              <div>
                <span style={{ fontSize: 13, color: MUTED }}>Tier {tier}</span>
                <span style={{ fontSize: 14, marginLeft: 8 }}>{TIER_LABELS[tier]}</span>
              </div>
              <span style={{ color: GOLD, fontWeight: 600 }}>+{TIER_POINTS[tier]} pt{TIER_POINTS[tier] > 1 ? 's' : ''}</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>
            Predict the winner for each category. Harder picks score more!
          </p>
        </div>

        {/* Reset button */}
        <button
          onClick={() => setShowResetModal(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            color: MUTED,
            fontSize: 13,
          }}
        >
          Reset Everything
        </button>

        {showResetModal && <ResetModal onSuccess={handleReset} onClose={() => setShowResetModal(false)} />}
      </div>
    );
  }

  // ─── PREDICT SCREEN ───
  if (screen === 'predict') {
    const me = gameState?.players.find((p) => p.name === myName);
    const isReadOnly = !!me?.lockedIn;
    return (
      <div style={containerStyle}>
        {/* Back to scoreboard (read-only mode) */}
        {isReadOnly && (
          <button
            onClick={() => setViewingPicks(false)}
            style={{
              marginBottom: 16,
              padding: '10px 16px',
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              color: GOLD,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Back to Scoreboard
          </button>
        )}
        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: MUTED }}>Your predictions</span>
            <span style={{ fontSize: 13, color: GOLD, fontWeight: 500 }}>{pickedCount} / {TOTAL_CATEGORIES}</span>
          </div>
          <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(pickedCount / TOTAL_CATEGORIES) * 100}%`, background: GOLD, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Category pills */}
        <div
          ref={pillsRef}
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 12,
            marginBottom: 16,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CATEGORIES.map((cat, i) => {
            const isActive = i === currentCatIndex;
            const isPicked = !!localPredictions[cat.id];
            return (
              <button
                key={cat.id}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => setCurrentCatIndex(i)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: isActive ? `1px solid ${GOLD}` : `1px solid ${BORDER}`,
                  background: isActive ? GOLD : 'transparent',
                  color: isActive ? '#000' : isPicked ? GOLD : MUTED,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {isPicked && !isActive && <span style={{ fontSize: 10, opacity: 0.6 }}>✓</span>}
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Current category */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <h2 style={{ ...headingStyle, fontSize: 24, color: '#fff' }}>{currentCat.name}</h2>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                background: `${GOLD}22`,
                color: GOLD,
                fontWeight: 500,
              }}
            >
              Tier {currentCat.tier} · +{TIER_POINTS[currentCat.tier]}pt{TIER_POINTS[currentCat.tier] > 1 ? 's' : ''}
            </span>
          </div>

          {/* Nominees */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {currentCat.nominees.map((nominee) => {
              const isSelected = localPredictions[currentCat.id] === nominee;
              return (
                <button
                  key={nominee}
                  onClick={() => !isReadOnly && handleSelectNominee(currentCat.id, nominee)}
                  style={{
                    padding: '14px 16px',
                    background: isSelected ? `${GOLD}15` : PANEL,
                    border: isSelected ? `1px solid ${GOLD}` : `1px solid ${BORDER}`,
                    borderRadius: 10,
                    color: isSelected ? GOLD : '#E0E0E0',
                    fontSize: 15,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s',
                    cursor: isReadOnly ? 'default' : 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: isSelected ? `2px solid ${GOLD}` : `2px solid ${BORDER}`,
                      background: isSelected ? GOLD : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 11,
                      color: '#000',
                    }}
                  >
                    {isSelected && '✓'}
                  </span>
                  {nominee}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setCurrentCatIndex(Math.max(0, currentCatIndex - 1))}
            disabled={currentCatIndex === 0}
            style={{
              flex: 1,
              padding: '12px',
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              color: currentCatIndex === 0 ? MUTED : '#fff',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrentCatIndex(Math.min(TOTAL_CATEGORIES - 1, currentCatIndex + 1))}
            disabled={currentCatIndex === TOTAL_CATEGORIES - 1}
            style={{
              flex: 1,
              padding: '12px',
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              color: currentCatIndex === TOTAL_CATEGORIES - 1 ? MUTED : '#fff',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Next →
          </button>
        </div>

        {/* Lock In */}
        {pickedCount === TOTAL_CATEGORIES && (
          <div style={{ marginBottom: 20 }}>
            {!confirmLock ? (
              <button
                onClick={() => setConfirmLock(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: GOLD,
                  color: '#000',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                🔒 Lock In My Picks
              </button>
            ) : (
              <div style={{ background: PANEL, border: `1px solid ${GOLD}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 15, marginBottom: 12 }}>Lock in your picks? You can&apos;t change them after this.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfirmLock(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'transparent',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      color: MUTED,
                      fontSize: 14,
                    }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleLockIn}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: GOLD,
                      color: '#000',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Confirm Lock In
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── WAITING SCREEN ───
  if (screen === 'waiting') {
    const lockedCount = gameState?.players.filter((p) => p.lockedIn).length || 0;
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '40px 0 30px' }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <h2 style={{ ...headingStyle, fontSize: 28, color: GOLD, marginTop: 12 }}>Picks Locked In!</h2>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>
            {lockedCount}/{MAX_PLAYERS} locked in — picks reveal when all {MAX_PLAYERS} are ready
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {gameState?.players.map((player) => (
            <div
              key={player.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500, color: player.name === myName ? GOLD : '#fff' }}>
                {player.name}
              </span>
              <span style={{ fontSize: 20 }}>{player.lockedIn ? '🔒' : '⏳'}</span>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: MAX_PLAYERS - (gameState?.players.length || 0) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                padding: '16px',
                border: `2px dashed ${BORDER}`,
                borderRadius: 10,
                textAlign: 'center',
                color: MUTED,
                fontSize: 13,
              }}
            >
              Waiting for player…
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── LIVE SCREEN ───
  if (screen === 'live' && gameState) {
    const players = gameState.players;
    const results = gameState.results;
    const scores = players.map((p) => getPlayerScore(p, results));
    const maxScore = Math.max(...scores);

    return (
      <div style={containerStyle}>
        {celebration && <Confetti names={celebration.names} category={celebration.category} />}

        {/* Scoreboard */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {players.map((player, i) => (
            <div
              key={player.name}
              style={{
                flex: 1,
                padding: '16px 8px',
                background: PANEL,
                border: `1px solid ${scores[i] === maxScore && maxScore > 0 ? GOLD : BORDER}`,
                borderRadius: 10,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18 }}>{scores[i] === maxScore && maxScore > 0 ? '👑' : '🎬'}</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: player.name === myName ? GOLD : '#fff', marginTop: 4 }}>
                {player.name}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: GOLD, ...headingStyle, marginTop: 4 }}>{scores[i]}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {([['all', 'All Picks'], ['mark', 'Mark Winners'], ['category', 'By Category']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLiveTab(key)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: liveTab === key ? GOLD : PANEL,
                color: liveTab === key ? '#000' : MUTED,
                border: `1px solid ${liveTab === key ? GOLD : BORDER}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: liveTab === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* All Picks Tab */}
        {liveTab === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CATEGORIES.map((cat) => {
              const winner = results[cat.id];
              return (
                <div key={cat.id} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</h3>
                    <span style={{ fontSize: 10, color: MUTED }}>Tier {cat.tier}</span>
                  </div>
                  {players.map((player) => {
                    const pick = player.predictions[cat.id];
                    const correct = winner && pick === winner;
                    const wrong = winner && pick !== winner;
                    return (
                      <div
                        key={player.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderTop: `1px solid ${BORDER}`,
                        }}
                      >
                        <span style={{ fontSize: 12, color: MUTED, width: 70, flexShrink: 0 }}>{player.name}</span>
                        <span style={{ fontSize: 13, flex: 1, color: correct ? '#4CAF50' : wrong ? '#666' : '#E0E0E0' }}>
                          {pick || '—'}
                        </span>
                        {winner && (
                          <span style={{ fontSize: 14, marginLeft: 4 }}>{correct ? '✓' : '✗'}</span>
                        )}
                      </div>
                    );
                  })}
                  {winner && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: `${GOLD}15`, borderRadius: 6, fontSize: 12, color: GOLD }}>
                      🏆 {winner}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mark Winners Tab */}
        {liveTab === 'mark' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CATEGORIES.map((cat) => {
              const winner = results[cat.id];
              return (
                <div key={cat.id} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</h3>
                      <span style={{ fontSize: 10, color: MUTED }}>+{TIER_POINTS[cat.tier]}pt{TIER_POINTS[cat.tier] > 1 ? 's' : ''}</span>
                    </div>
                    {winner && (
                      <button
                        onClick={() => handleUndoWinner(cat.id)}
                        style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', textDecoration: 'underline' }}
                      >
                        Undo
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cat.nominees.map((nominee) => {
                      const isWinner = winner === nominee;
                      const isGreyed = winner && !isWinner;
                      return (
                        <button
                          key={nominee}
                          onClick={() => !winner && handleMarkWinner(cat.id, nominee)}
                          disabled={!!winner}
                          style={{
                            padding: '10px 12px',
                            background: isWinner ? `${GOLD}20` : 'transparent',
                            border: isWinner ? `1px solid ${GOLD}` : `1px solid ${BORDER}`,
                            borderRadius: 8,
                            color: isWinner ? GOLD : isGreyed ? '#444' : '#E0E0E0',
                            fontSize: 13,
                            textAlign: 'left',
                            cursor: winner ? 'default' : 'pointer',
                            opacity: isGreyed ? 0.5 : 1,
                          }}
                        >
                          {isWinner && '🏆 '}{nominee}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* By Category Tab */}
        {liveTab === 'category' && (
          <div>
            {[1, 2, 3].map((tier) => {
              const tierCats = CATEGORIES.filter((c) => c.tier === tier);
              return (
                <div key={tier} style={{ marginBottom: 20 }}>
                  <h3 style={{ ...headingStyle, fontSize: 16, color: GOLD, marginBottom: 8 }}>
                    Tier {tier} — {TIER_LABELS[tier]} (+{TIER_POINTS[tier]}pt{TIER_POINTS[tier] > 1 ? 's' : ''})
                  </h3>
                  <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', padding: '8px 12px', borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ flex: 2, fontSize: 11, color: MUTED }}>Category</span>
                      {players.map((p) => (
                        <span key={p.name} style={{ flex: 1, fontSize: 11, color: MUTED, textAlign: 'center' }}>{p.name}</span>
                      ))}
                    </div>
                    {tierCats.map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          padding: '8px 12px',
                          borderBottom: `1px solid ${BORDER}`,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ flex: 2, fontSize: 12 }}>{cat.name}</span>
                        {players.map((p) => {
                          const winner = results[cat.id];
                          const correct = winner && p.predictions[cat.id] === winner;
                          return (
                            <span
                              key={p.name}
                              style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: 13,
                                fontWeight: correct ? 600 : 400,
                                color: !winner ? MUTED : correct ? '#4CAF50' : '#555',
                              }}
                            >
                              {!winner ? '—' : correct ? `+${TIER_POINTS[cat.tier]}` : '0'}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Totals */}
            <div style={{ background: PANEL, border: `1px solid ${GOLD}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 2, fontSize: 14, fontWeight: 600, color: GOLD }}>Total</span>
              {players.map((p, i) => (
                <span key={p.name} style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: GOLD, ...headingStyle }}>
                  {scores[i]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* View picks + Reset buttons */}
        <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => setViewingPicks(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
            }}
          >
            View My Picks
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              color: MUTED,
              fontSize: 13,
            }}
          >
            Reset Game
          </button>
        </div>

        {showResetModal && <ResetModal onSuccess={handleReset} onClose={() => setShowResetModal(false)} />}
      </div>
    );
  }

  // Loading state
  return (
    <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: MUTED }}>Loading…</p>
    </div>
  );
}
