import React, { useState, useEffect, useCallback } from 'react';
import useDrawStore from '../store/useDrawStore';
import ShippingFormModal from './ShippingFormModal';


function ResultReveal({ results, onFinish, onConfettiChange }) {
    // eslint-disable-next-line
    const { displayMode,themeColor  } = useDrawStore();
    const [revealed, setRevealed] = useState([]);
    // eslint-disable-next-line
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const HIGH_COLOR = '#fff9b2'; // 원하는 컬러

    const isHighRank = (item) => item.rank === 1 || item.rank === 2;

    // 전체 요약용 그룹화
    const groupedResults = results.reduce((acc, item) => {
        const key = `${item.rank}-${item.name}`;
        if (!acc[key]) {
            acc[key] = { ...item, count: 1 };
        } else {
            acc[key].count += 1;
        }
        return acc;
    }, {});
    const summary = Object.values(groupedResults).sort((a, b) => a.rank - b.rank);
    const needsShipping = summary.some((r) => r.requiresShipping);

    const renderLabel = (item) => {
        if (displayMode === 'rank') return `${item.rank}등`;
        if (displayMode === 'prize') return `${item.name}`;
        return `${item.rank}등 - ${item.name}`;
    };

    const handleReveal = useCallback((index) => {
        const item = results[index];
        if (!item) return;

        if (isHighRank(item)) {
        onConfettiChange?.(true); // 상위에서 컨페티 켜기
        }

        setTimeout(() => {
        setRevealed((prev) => (prev.includes(index) ? prev : [...prev, index]));
        }, isHighRank(item) ? 500 : 0);
    }, [results, onConfettiChange]);

    const handleShowSummary = () => {
        setShowSummary(true);
    };

    useEffect(() => {
        // 자동 reveal for 일반 등수
        if (currentIndex < results.length) {
            const item = results[currentIndex];
            if (!isHighRank(item)) {
                handleReveal(currentIndex);
            }
        }
    }, [currentIndex, results, handleReveal]);

    const handleFinish = () => {
        onConfettiChange?.(false); // 종료 시 컨페티 끄기
        onFinish();           // 외부 종료 콜백 호출
    };

    // 언마운트 시 혹시 켜져 있으면 끄기 (안전)
    useEffect(() => {
        return () => onConfettiChange?.(false);
    }, [onConfettiChange]);

    return (
        <div className="draw-contents">
            {!showSummary ? (
                <div>
                    <h2>당첨 결과</h2>
                    <ul>
                        {results.map((r, i) => {
                            const isHigh = isHighRank(r);
                            const isRevealed = revealed.includes(i);
                            return (
                                <li
                                key={i}
                                className={`fade-in rank-${r.rank} ${isHigh ? 'high high-bg' : ''}`}
                                data-rank={r.rank}
                                data-label={renderLabel(r)}
                                style={{ '--fade-index': i, 'background-color': isHigh ? HIGH_COLOR : '#f5f7f9', 'color': isHigh ? '#000000' : undefined }}
                                >
                                    {isHigh && !isRevealed ? (
                                        <div className="pulse" onClick={() => handleReveal(i)}>
                                            <span>♥</span>
                                        </div>
                                    ) : (
                                        <span className={isHigh ? 'reveal-text' : ''}>
                                            {renderLabel(r)}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <button className={`go-draw no-capture`} onClick={handleShowSummary} style={{ width: 260 }}>
                        전체 결과 보기
                    </button>
                </div>
            ) : (
                <div>
                    <h2 className="draw-result">전체 당첨 결과</h2>
                    <ul>
                        {summary.map((r, i) => (
                            <li key={i}>
                                {renderLabel(r)} ({r.count}개)
                            </li>
                        ))}
                    </ul>

                    {needsShipping && (
                        <button
                            className={`go-draw no-capture`}
                            onClick={() => setShowShippingModal(true)}
                        >
                            배송 정보 입력하기
                        </button>
                    )}

                    <button className={`go-draw no-capture`} onClick={handleFinish}>
                        확인 완료
                    </button>
                </div>
            )}

            {showShippingModal && (
                <ShippingFormModal
                    prizes={summary}
                    onClose={() => setShowShippingModal(false)}
                />
            )}
        </div>
    );
}

export default ResultReveal;
