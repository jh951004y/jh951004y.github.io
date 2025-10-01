// DrawPage.jsx
import React, { useEffect, useState } from 'react';
import useDrawStore from '../store/useDrawStore';
import ResultReveal from './ResultReveal';
import './css/draw.css';
import { Plus, Minus } from 'lucide-react';
import { getAuth, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import Confetti from 'react-confetti';

function DrawPage() {
    const {
        prizes,
        isClosed,
        loadFromFirebase,
        updatePrize,
        saveToFirebase,
    } = useDrawStore();

    const [isLoading, setIsLoading] = useState(true);
    const [drawCount, setDrawCount] = useState(1);
    const [results, setResults] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [confettiOn, setConfettiOn] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            await loadFromFirebase();
            setIsLoading(false);
        };
        fetchData();
    }, [loadFromFirebase]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await getIdTokenResult(user);
                setIsAdmin(token.claims.isAdmin === true);
            } else {
                setIsAdmin(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const totalRemaining = prizes.reduce((sum, p) => sum + p.remaining, 0);
    const isFinished = totalRemaining === 0;
    const isUnavailable = isFinished || isClosed;

    const buildDrawPool = () => {
        const pool = [];
        prizes.forEach((prize) => {
            for (let i = 0; i < prize.remaining; i++) {
                pool.push(prize.rank);
            }
        });
        return pool;
    };

    const getPrizeByRank = (rank) => prizes.find((p) => p.rank === rank);

    const draw = () => {
        const pool = buildDrawPool();

        if (pool.length < drawCount) {
            alert('남은 상품 수량보다 더 많이 뽑을 수 없습니다!');
            return;
        }

        const drawnRanks = [];
        const updatedPrizes = [...prizes];

        for (let i = 0; i < drawCount; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const selectedRank = pool[randomIndex];
            drawnRanks.push(selectedRank);
            const firstIndex = pool.indexOf(selectedRank);
            pool.splice(firstIndex, 1);
            const target = updatedPrizes.find((p) => p.rank === selectedRank);
            if (target) {
                target.remaining -= 1;
            }
        }

        updatedPrizes.forEach((p, index) => {
            updatePrize(index, {
                ...prizes[index],
                remaining: p.remaining
            });
        });
        saveToFirebase();

        const fullResults = drawnRanks.map(rank => {
            const prize = getPrizeByRank(rank);
            return {
                rank,
                name: prize.name,
                requiresShipping: prize.requiresShipping || false
            };
        });

        setResults(fullResults);
        setShowResult(true);
    };

    const reset = () => {
        setShowResult(false);
        setResults([]);
        setConfettiOn(false);
    };

    return (
        <div className={`draw`}>
            {/* draw 바로 아래에서 컨페티 렌더 */}
            {confettiOn && (
                <Confetti
                className="no-capture confetti-canvas"
                numberOfPieces={120}
                gravity={0.3}
                />
            )}
            <div className="copy no-capture">Copyright 2025. Dingdongsun. All rights reserved.</div>
            <h1 className='logo'>Hani World</h1>
            <div className='draw-wrapper'>
                {isLoading ? (
                    <div></div>
                ) : showResult ? (
                    <ResultReveal
                        results={results}
                        onFinish={reset}
                        onConfettiChange={setConfettiOn} 
                    />
                ) : (
                    <div className='draw-contents'>
                        {isUnavailable ? (
                            <div>럭키드로우가 마감되었습니다.</div>
                        ) : (
                            <>
                                {totalRemaining <= 50 && (
                                    <div className="remaining-warning">
                                        럭키 드로우가 {totalRemaining}개 남았습니다.
                                    </div>
                                )}
                                <div className='draw-row'>
                                    <div className="draw-count-control">
                                        <button className='minus' onClick={() => setDrawCount((prev) => Math.max(1, prev - 1))}><Minus color='#ff84b0'/></button>
                                        <input type="number" min="1" max="100" value={drawCount} onChange={(e) => setDrawCount(Number(e.target.value))} style={{fontWeight: 'bold'}} />
                                        <button className='plus' onClick={() => setDrawCount((prev) => Math.min(100, prev + 1))}><Plus color='#ff84b0'/></button>
                                    </div>
                                </div>
                                <button className={`go-draw`} onClick={draw} disabled={!isAdmin} style={{width: 260}}>
                                    Draw!
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <a href={isAdmin ? '/#/admin' : '/#/admin-login'} className="go-admin no-capture">
                {isAdmin ? '관리자 페이지로 이동' : '관리자로 로그인'}
            </a>
            <div className="cr c1"></div>
            <div className="cr c2"></div>
        </div>
    );
}

export default DrawPage;
