// 백트래킹 + 휴리스틱 최적화 알고리즘
// 전략적 점수 최대화를 위한 퍼즐 조각 배치 최적화

export function findBestCombinationWithBacktracking(
  board,
  pieces,
  job,
  jobAttributes,
  RARITY_SCORES,
  canPlacePiece,
  placePiece,
  calculateScore
) {
  const openCells = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col] === 1) {
        openCells.push({ row, col });
      }
    }
  }
  const totalOpenCells = openCells.length;

  console.log('=== 전략적 점수 최대화 알고리즘 시작 ===');
  console.log(`역할군: ${job}`);
  console.log(`역할군 속성: ${jobAttributes.join(', ')}`);
  console.log(`열린 칸 수: ${totalOpenCells}개`);

  // 조각 분류
  const validPieces = pieces.filter(p => p.shapeCoords);
  
  // 역할군 일치 조각 (보너스 받을 수 있는 조각)
  const matchingPieces = validPieces.filter(p => {
    if (p.size === 8) {
      return p.attribute === job || p.attribute === '전 역할군';
    }
    return p.size <= 5 && p.attribute && jobAttributes.includes(p.attribute);
  });
  
  // 역할군 불일치 조각 (단, 유니크는 제외 - 자기 직업군 유니크만 사용)
  const nonMatchingPieces = validPieces.filter(p => {
    if (p.size === 8) {
      // 8칸(유니크) 조각은 자기 직업군이 아니면 사용 안함
      return false;
    }
    return !matchingPieces.includes(p);
  });

  console.log(`역할군 일치 조각: ${matchingPieces.length}개`);
  console.log(`역할군 불일치 조각 (1~5칸): ${nonMatchingPieces.length}개`);
  
  // 사용 가능한 유니크 조각 확인
  const availableUniquePieces = matchingPieces.filter(p => p.size === 8);
  if (availableUniquePieces.length > 0) {
    console.log(`\n✅ 사용 가능한 유니크 조각:`);
    availableUniquePieces.forEach(p => {
      if (p.attribute === '전 역할군') {
        console.log(`  - ${p.attribute} (${p.shape}) - 모든 역할군 사용 가능`);
      } else {
        console.log(`  - ${p.attribute} (${p.shape}) - ${job} 전용`);
      }
    });
  } else {
    console.log(`\n⚠️ ${job} 역할군에 맞는 유니크 조각이 없습니다.`);
  }
  
  // 제외된 유니크 조각 확인
  const excludedUniquePieces = validPieces.filter(p => 
    p.size === 8 && p.attribute !== job && p.attribute !== '전 역할군'
  );
  if (excludedUniquePieces.length > 0) {
    console.log(`\n❌ 제외된 유니크 조각 (역할군 불일치):`);
    excludedUniquePieces.forEach(p => {
      console.log(`  - ${p.attribute} (${p.shape}) - ${job}에서 사용 불가`);
    });
  }

  // 속성별로 21개 달성 시 예상 점수 계산 (전략적 우선순위)
  const attributePriority = {};
  jobAttributes.forEach(attr => {
    const attrPieces = matchingPieces.filter(p => 
      p.size <= 5 && p.attribute === attr
    ).sort((a, b) => {
      const scoreA = RARITY_SCORES[a.rarity];
      const scoreB = RARITY_SCORES[b.rarity];
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.size - a.size;
    });

    let totalCells = 0;
    let totalScore = 0;
    
    for (const piece of attrPieces) {
      if (totalCells >= 21) break;
      const cellsToAdd = Math.min(piece.size, 21 - totalCells);
      totalCells += cellsToAdd;
      totalScore += RARITY_SCORES[piece.rarity] * cellsToAdd;
    }

    // 보너스 점수 계산
    let bonusScore = 0;
    if (totalCells >= 9) bonusScore += 265;
    if (totalCells >= 12) bonusScore += 265;
    if (totalCells >= 15) bonusScore += 265;
    if (totalCells >= 18) bonusScore += 265;
    if (totalCells >= 21) bonusScore += 265;

    attributePriority[attr] = {
      totalScore: totalScore + bonusScore,
      totalCells,
      pieces: attrPieces,
    };
  });

  // 속성을 예상 점수 순으로 정렬
  const sortedAttributes = Object.keys(attributePriority).sort((a, b) => 
    attributePriority[b].totalScore - attributePriority[a].totalScore
  );

  console.log('속성별 예상 점수 (21개 달성 시):');
  sortedAttributes.forEach(attr => {
    console.log(`  ${attr}: ${attributePriority[attr].totalScore}점 (${attributePriority[attr].totalCells}칸)`);
  });

  // 조각 우선순위 정렬 (전략적)
  const sortedPieces = [];
  
  // 1단계: 역할군 일치 유니크 조각 (8칸) 최우선
  const uniqueMatchingPieces = matchingPieces
    .filter(p => p.size === 8)
    .sort((a, b) => {
      // 현재 역할군이 '전 역할군'보다 우선
      if (a.attribute === job && b.attribute !== job) return -1;
      if (a.attribute !== job && b.attribute === job) return 1;
      return 0;
    });
  sortedPieces.push(...uniqueMatchingPieces);

  // 2단계: 속성별로 21개 달성 우선순위에 따라 1~5칸 조각 정렬
  sortedAttributes.forEach(attr => {
    const attrPieces = attributePriority[attr].pieces;
    sortedPieces.push(...attrPieces);
  });

  // 3단계: 역할군 불일치 조각 (점수 효율 순)
  const sortedNonMatching = nonMatchingPieces.sort((a, b) => {
    const effA = RARITY_SCORES[a.rarity];
    const effB = RARITY_SCORES[b.rarity];
    if (effA !== effB) return effB - effA;
    return b.size - a.size;
  });
  sortedPieces.push(...sortedNonMatching);

  console.log(`조각 정렬 완료: 총 ${sortedPieces.length}개`);

  // 상한 계산 (가지치기용) - 보너스 점수를 고려한 최적 추정
  const calculateUpperBound = (currentScore, remainingPieces, remainingCells, currentAttributeCounts, usedUnique) => {
    if (remainingPieces.length === 0 || remainingCells <= 0) {
      return currentScore;
    }
    
    let estimatedScore = currentScore;
    let estimatedAttrCounts = { ...currentAttributeCounts };
    let estimatedUnique = usedUnique;
    let cellsUsed = 0;
    
    // 남은 조각을 효율적으로 배치했을 때의 최대 점수 추정
    for (const piece of remainingPieces) {
      if (piece.rarity === '유니크' && estimatedUnique >= 1) continue;
      if (cellsUsed + piece.size > remainingCells) continue;
      
      estimatedScore += RARITY_SCORES[piece.rarity] * piece.size;
      cellsUsed += piece.size;
      
      // 속성별 칸 수 업데이트 (1~5칸 조각만, 역할군 일치 시)
      if (piece.size <= 5 && piece.attribute && jobAttributes.includes(piece.attribute)) {
        estimatedAttrCounts[piece.attribute] = (estimatedAttrCounts[piece.attribute] || 0) + piece.size;
      }
      
      if (piece.rarity === '유니크') estimatedUnique++;
    }
    
    // 보너스 점수 계산 (속성별)
    let bonusScore = 0;
    Object.entries(estimatedAttrCounts).forEach(([attr, count]) => {
      if (jobAttributes.includes(attr)) {
        // 9, 12, 15, 18, 21칸 달성 시 각각 265점
        if (count >= 21) bonusScore += 265 * 5;
        else if (count >= 18) bonusScore += 265 * 4;
        else if (count >= 15) bonusScore += 265 * 3;
        else if (count >= 12) bonusScore += 265 * 2;
        else if (count >= 9) bonusScore += 265;
      }
    });
    
    return estimatedScore + bonusScore;
  };

  let bestScore = 0;
  let bestPlacement = [];
  let bestAttributeCounts = {};
  let searchCount = 0;
  const MAX_SEARCH = 500000;
  const startTime = Date.now();
  const MAX_TIME = 10000; // 10초

  // 백트래킹 (전략적 점수 최대화)
  const backtrack = (pieceIndex, currentPlaced, usedCells, currentAttributeCounts, usedUnique) => {
    searchCount++;
    
    if (Date.now() - startTime > MAX_TIME || searchCount > MAX_SEARCH) {
      return;
    }
    
    const currentScore = calculateScore(currentPlaced, board).totalScore;
    
    // 가지치기: 상한 계산
    const remainingPieces = sortedPieces.slice(pieceIndex);
    const remainingCells = totalOpenCells - usedCells.size;
    const upperBound = calculateUpperBound(
      currentScore,
      remainingPieces,
      remainingCells,
      currentAttributeCounts,
      usedUnique
    );
    
    if (upperBound <= bestScore) {
      return; // 가지치기: 이 경로로는 최고 점수 달성 불가
    }
    
    // 최고 점수 갱신
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestPlacement = [...currentPlaced];
      bestAttributeCounts = { ...currentAttributeCounts };
      
      const bonusInfo = [];
      Object.entries(currentAttributeCounts).forEach(([attr, count]) => {
        if (jobAttributes.includes(attr) && count > 0) {
          bonusInfo.push(`${attr}:${count}칸`);
        }
      });
      console.log(`✨ 새로운 최고 점수: ${bestScore}점 (조각 ${currentPlaced.length}개, ${bonusInfo.join(', ')})`);
    }
    
    if (pieceIndex >= sortedPieces.length || remainingCells <= 0) {
      return;
    }
    
    const piece = sortedPieces[pieceIndex];
    
    // 유니크 제한 (1개만 사용 가능)
    if (piece.rarity === '유니크' && usedUnique >= 1) {
      backtrack(pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
      return;
    }
    
    // 역할군 일치 여부 확인
    const isMatchingPiece = (piece.size === 8 && (piece.attribute === job || piece.attribute === '전 역할군')) ||
                           (piece.size <= 5 && piece.attribute && jobAttributes.includes(piece.attribute));
    
    // 전략적 스킵 판단: 역할군 일치 조각은 우선 배치
    let shouldSkipFirst = false; // 기본적으로 배치를 먼저 시도
    
    if (isMatchingPiece && piece.size <= 5) {
      // 역할군 일치 조각은 적극적으로 배치
      const currentCount = currentAttributeCounts[piece.attribute] || 0;
      
      // 이미 21개 달성했으면 건너뛰기
      if (currentCount >= 21) {
        backtrack(pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
        return;
      }
      
      // 21개 이하면 건너뛰기를 최소화 (배치 우선)
      shouldSkipFirst = false;
    } else if (!isMatchingPiece) {
      // 역할군 불일치 조각은 건너뛰기를 먼저 고려
      shouldSkipFirst = true;
    }
    
    // 배치 가능한 위치 찾기
    const possiblePositions = [];
    for (const { row, col } of openCells) {
      if (canPlacePiece(piece, row, col, usedCells)) {
        possiblePositions.push({ row, col });
      }
    }
    
    if (possiblePositions.length === 0) {
      // 배치 불가능하면 건너뛰기
      backtrack(pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
      return;
    }
    
    // 중앙에 가까운 위치 우선 (휴리스틱)
    possiblePositions.sort((a, b) => {
      const distA = Math.abs(a.row - 3) + Math.abs(a.col - 3);
      const distB = Math.abs(b.row - 3) + Math.abs(b.col - 3);
      return distA - distB;
    });
    
    // 최대 탐색 위치 수 (중요한 조각은 더 많은 위치 시도)
    let maxPositions = 2;
    if (piece.size === 8) {
      maxPositions = 3; // 유니크는 더 신중하게
    } else if (isMatchingPiece && piece.size <= 5) {
      // 역할군 일치 조각은 더 많은 위치 시도
      const currentCount = currentAttributeCounts[piece.attribute] || 0;
      maxPositions = 3;
      
      // 보너스 경계(9, 12, 15, 18, 21)에 가까우면 모든 위치 시도
      if ([8, 11, 14, 17, 20].some(threshold => 
        Math.abs((currentCount + piece.size) - threshold) <= 1
      )) {
        maxPositions = Math.min(5, possiblePositions.length);
      }
    }
    maxPositions = Math.min(maxPositions, possiblePositions.length);
    
    // 건너뛰기와 배치 순서 결정
    if (shouldSkipFirst) {
      // 역할군 불일치 조각: 건너뛰기 먼저 시도
      backtrack(pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
    }
    
    // 이 조각을 배치하는 경우
    for (let i = 0; i < maxPositions; i++) {
      if (Date.now() - startTime > MAX_TIME || searchCount > MAX_SEARCH) {
        return;
      }
      
      const { row, col } = possiblePositions[i];
      const newUsedCells = new Set(usedCells);
      const placedCells = placePiece(piece, row, col, newUsedCells);
      
      const newPlaced = [...currentPlaced, {
        ...piece,
        position: { row, col },
        placedCells,
      }];
      
      const newAttributeCounts = { ...currentAttributeCounts };
      if (piece.size <= 5 && piece.attribute && jobAttributes.includes(piece.attribute)) {
        newAttributeCounts[piece.attribute] = (newAttributeCounts[piece.attribute] || 0) + piece.size;
      }
      
      const newUsedUnique = usedUnique + (piece.rarity === '유니크' ? 1 : 0);
      
      backtrack(pieceIndex + 1, newPlaced, newUsedCells, newAttributeCounts, newUsedUnique);
    }
    
    // 역할군 일치 조각은 배치 후에 건너뛰기 시도 (선택적)
    if (!shouldSkipFirst) {
      backtrack(pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
    }
  };

  // 초기 상태
  const initialAttributeCounts = {
    광휘: 0, 관통: 0, 원소: 0, 파쇄: 0,
    축복: 0, 낙인: 0, 재생: 0,
  };
  
  console.log('\n🎯 백트래킹 알고리즘 실행 시작...');
  
  backtrack(0, [], new Set(), initialAttributeCounts, 0);
  
  const elapsedTime = (Date.now() - startTime) / 1000;
  console.log('\n=== 최적화 완료 ===');
  console.log(`📊 탐색 횟수: ${searchCount.toLocaleString()}회`);
  console.log(`⏱️ 소요 시간: ${elapsedTime.toFixed(2)}초`);
  console.log(`🏆 최고 점수: ${bestScore.toLocaleString()}점`);
  console.log(`🧩 배치된 조각: ${bestPlacement.length}개`);
  
  if (bestPlacement.length > 0) {
    console.log('\n📈 속성별 칸 수:');
    const bonusDetails = [];
    Object.entries(bestAttributeCounts).forEach(([attr, count]) => {
      if (jobAttributes.includes(attr) && count > 0) {
        let bonus = 0;
        if (count >= 21) bonus = 265 * 5;
        else if (count >= 18) bonus = 265 * 4;
        else if (count >= 15) bonus = 265 * 3;
        else if (count >= 12) bonus = 265 * 2;
        else if (count >= 9) bonus = 265;
        
        console.log(`  ${attr}: ${count}칸 (보너스 ${bonus}점)`);
        bonusDetails.push({ attr, count, bonus });
      }
    });
    
    const totalBonus = bonusDetails.reduce((sum, d) => sum + d.bonus, 0);
    console.log(`💰 총 보너스 점수: ${totalBonus.toLocaleString()}점`);
    
    // 유니크 조각 확인
    const uniquePieces = bestPlacement.filter(p => p.size === 8);
    if (uniquePieces.length > 0) {
      console.log(`⭐ 유니크 조각 사용: ${uniquePieces[0].attribute} (${uniquePieces[0].shape})`);
    }
  }
  
  return {
    placedPieces: bestPlacement,
    score: bestScore,
  };
}

