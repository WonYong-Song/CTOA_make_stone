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

  // ===== 전략적 목표 조합 계산 (백트래킹 전) =====
  console.log('\n🎯 전략적 목표 조합 계산 중...');
  
  const calculateOptimalStrategy = () => {
    const strategy = {
      targetPieces: [],
      uniquePiece: null,
      attributeTargets: {}, // 각 속성별 목표 칸 수와 조각 리스트
      remainingPieces: [],
      expectedScore: 0,
    };
    
    let usedPieceIds = new Set();
    let totalUsedCells = 0;
    
    // 1단계: 유니크 조각 결정
    const jobUniquePieces = matchingPieces.filter(p => p.size === 8 && p.attribute === job);
    const allJobUniquePieces = matchingPieces.filter(p => p.size === 8 && p.attribute === '전 역할군');
    
    let bestUniqueScore = 0;
    let bestUniquePiece = null;
    
    // 역할군 전용 유니크 평가
    for (const piece of jobUniquePieces) {
      const score = RARITY_SCORES[piece.rarity] * piece.size; // 2000점
      if (score > bestUniqueScore) {
        bestUniqueScore = score;
        bestUniquePiece = piece;
      }
    }
    
    // 전 역할군 유니크 평가
    for (const piece of allJobUniquePieces) {
      const score = RARITY_SCORES[piece.rarity] * piece.size; // 2000점
      if (score > bestUniqueScore) {
        bestUniqueScore = score;
        bestUniquePiece = piece;
      }
    }
    
    if (bestUniquePiece) {
      strategy.uniquePiece = bestUniquePiece;
      strategy.targetPieces.push(bestUniquePiece);
      usedPieceIds.add(bestUniquePiece.id);
      totalUsedCells += 8;
      strategy.expectedScore += bestUniqueScore;
      console.log(`  ✅ 유니크 선택: ${bestUniquePiece.attribute} (+${bestUniqueScore}점)`);
    }
    
    // 2단계: 속성별 21칸 달성 전략
    // 각 속성별로 고등급 조각 칸 수 계산
    const attributeRarityScores = {};
    jobAttributes.forEach(attr => {
      const attrPieces = matchingPieces.filter(p => 
        p.size <= 5 && p.attribute === attr && !usedPieceIds.has(p.id)
      );
      
      // 고등급 조각 우선 정렬
      attrPieces.sort((a, b) => {
        const scoreA = RARITY_SCORES[a.rarity];
        const scoreB = RARITY_SCORES[b.rarity];
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.size - a.size;
      });
      
      // 21칸 달성 시 예상 점수 계산 (정확히 21칸 이하로 조합)
      let cells = 0;
      let baseScore = 0;
      let highRarityCells = 0; // 슈퍼에픽 이상
      const piecesFor21 = [];
      
      for (const piece of attrPieces) {
        if (cells >= 21) break;
        
        // 21칸을 초과하지 않는 조각만 추가
        if (cells + piece.size <= 21) {
          cells += piece.size;
          baseScore += RARITY_SCORES[piece.rarity] * piece.size;
          piecesFor21.push(piece);
          
          if (piece.rarity === '슈퍼에픽' || piece.rarity === '유니크') {
            highRarityCells += piece.size;
          }
        }
      }
      
      // 21칸에 최대한 가깝게 채우기 위해 작은 조각들로 보완
      if (cells < 21) {
        const usedIds = new Set(piecesFor21.map(p => p.id));
        const remainingPieces = attrPieces.filter(p => !usedIds.has(p.id));
        
        for (const piece of remainingPieces) {
          if (cells + piece.size <= 21) {
            cells += piece.size;
            baseScore += RARITY_SCORES[piece.rarity] * piece.size;
            piecesFor21.push(piece);
            
            if (piece.rarity === '슈퍼에픽' || piece.rarity === '유니크') {
              highRarityCells += piece.size;
            }
          }
        }
      }
      
      // 21칸 달성 시 보너스 점수
      let bonusScore = 0;
      if (cells >= 21) bonusScore = 265 * 5; // 1325점
      else if (cells >= 18) bonusScore = 265 * 4;
      else if (cells >= 15) bonusScore = 265 * 3;
      else if (cells >= 12) bonusScore = 265 * 2;
      else if (cells >= 9) bonusScore = 265;
      
      attributeRarityScores[attr] = {
        totalScore: baseScore + bonusScore,
        baseScore,
        bonusScore,
        cells,
        pieces: piecesFor21,
        highRarityCells,
        efficiency: (baseScore + bonusScore) / Math.max(cells, 1),
      };
    });
    
    // 점수 효율이 높은 속성부터 21칸 달성
    const sortedByEfficiency = Object.keys(attributeRarityScores).sort((a, b) => {
      const effA = attributeRarityScores[a];
      const effB = attributeRarityScores[b];
      
      // 1순위: 총 점수
      if (effA.totalScore !== effB.totalScore) {
        return effB.totalScore - effA.totalScore;
      }
      
      // 2순위: 고등급 조각 칸 수
      return effB.highRarityCells - effA.highRarityCells;
    });
    
    console.log(`  📊 속성별 우선순위:`);
    sortedByEfficiency.forEach((attr, idx) => {
      const info = attributeRarityScores[attr];
      console.log(`    ${idx + 1}. ${attr}: ${info.totalScore}점 (${info.cells}칸, 고등급 ${info.highRarityCells}칸)`);
    });
    
    // 3단계: 우선순위에 따라 속성별 21칸 달성
    for (const attr of sortedByEfficiency) {
      const attrInfo = attributeRarityScores[attr];
      
      // 칸 수 체크
      const remainingCells = totalOpenCells - totalUsedCells;
      if (attrInfo.cells === 0) {
        console.log(`  ⚠️ ${attr}: 사용 가능한 조각이 없습니다.`);
        continue;
      }
      
      if (attrInfo.cells > remainingCells) {
        console.log(`  ⚠️ ${attr}: 칸 부족 (필요: ${attrInfo.cells}, 남은 칸: ${remainingCells})`);
        
        // 부분적으로라도 추가 시도
        if (remainingCells >= 9) {
          const partialPieces = [];
          let partialCells = 0;
          
          for (const piece of attrInfo.pieces) {
            if (partialCells + piece.size <= remainingCells) {
              partialPieces.push(piece);
              partialCells += piece.size;
            }
          }
          
          if (partialCells >= 9) {
            strategy.attributeTargets[attr] = {
              targetCells: partialCells,
              pieces: partialPieces,
              expectedScore: attrInfo.baseScore * (partialCells / attrInfo.cells),
            };
            
            partialPieces.forEach(piece => {
              strategy.targetPieces.push(piece);
              usedPieceIds.add(piece.id);
              totalUsedCells += piece.size;
              strategy.expectedScore += RARITY_SCORES[piece.rarity] * piece.size;
            });
            
            console.log(`  ⚠️ ${attr}: 부분 달성 목표 (${partialCells}칸, 조각 ${partialPieces.length}개)`);
          }
        }
        continue;
      }
      
      // 이 속성의 조각들 추가
      strategy.attributeTargets[attr] = {
        targetCells: attrInfo.cells,
        pieces: attrInfo.pieces,
        expectedScore: attrInfo.totalScore,
      };
      
      attrInfo.pieces.forEach(piece => {
        strategy.targetPieces.push(piece);
        usedPieceIds.add(piece.id);
        totalUsedCells += piece.size;
        strategy.expectedScore += RARITY_SCORES[piece.rarity] * piece.size;
      });
      
      strategy.expectedScore += attrInfo.bonusScore;
      
      const achievementStr = attrInfo.cells >= 21 ? '21칸 달성' : `${attrInfo.cells}칸`;
      console.log(`  ✅ ${attr}: ${achievementStr} 목표 (조각 ${attrInfo.pieces.length}개, +${attrInfo.totalScore.toLocaleString()}점)`);
      
      // 칸이 많이 남았으면 다음 속성도 시도
      if (totalUsedCells + 9 > totalOpenCells) {
        console.log(`  ℹ️ 남은 칸이 부족하여 추가 속성 배치 중단`);
        break;
      }
    }
    
    // 4단계: 남은 칸에 역할군 일치 고등급 조각 채우기
    const remainingCells = totalOpenCells - totalUsedCells;
    if (remainingCells > 0) {
      console.log(`  📦 남은 칸 ${remainingCells}개를 역할군 일치 조각으로 처리 중...`);
      
      // 사용하지 않은 역할군 일치 조각들만 사용
      const unusedMatchingPieces = matchingPieces.filter(p => !usedPieceIds.has(p.id));
      
      // 고등급 순으로 정렬
      unusedMatchingPieces.sort((a, b) => {
        const scoreA = RARITY_SCORES[a.rarity];
        const scoreB = RARITY_SCORES[b.rarity];
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.size - a.size;
      });
      
      let filledCells = 0;
      for (const piece of unusedMatchingPieces) {
        if (filledCells + piece.size > remainingCells) continue;
        
        strategy.targetPieces.push(piece);
        strategy.remainingPieces.push(piece);
        usedPieceIds.add(piece.id);
        filledCells += piece.size;
        
        const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
        strategy.expectedScore += pieceScore;
        
        // 속성별 추가 보너스 체크
        if (piece.size <= 5 && piece.attribute) {
          const currentTarget = strategy.attributeTargets[piece.attribute];
          if (currentTarget) {
            currentTarget.targetCells = Math.min(currentTarget.targetCells + piece.size, 30);
          }
        }
      }
      
      if (filledCells > 0) {
        console.log(`  ✅ 역할군 일치 조각 ${strategy.remainingPieces.length}개 추가 (+${filledCells}칸)`);
      }
      
      // 남은 칸이 아직 있고 역할군 불일치 조각이 있으면 2단계용으로 표시
      const stillRemainingCells = remainingCells - filledCells;
      if (stillRemainingCells > 0) {
        console.log(`  ℹ️ 역할군 일치 조각으로 ${stillRemainingCells}칸 남음 (2단계에서 역할군 불일치 조각 고려)`);
      }
    }
    
  console.log(`\n  🎯 목표 조합: ${strategy.targetPieces.length}개 조각 (모두 역할군 일치 ✅)`);
  console.log(`  💰 예상 점수: ${strategy.expectedScore.toLocaleString()}점`);
  
  // 목표 조합이 모두 역할군 일치 조각인지 확인
  const allMatching = strategy.targetPieces.every(p => 
    matchingPieces.some(mp => mp.id === p.id)
  );
  
  if (!allMatching) {
    console.warn('⚠️ 경고: 목표 조합에 역할군 불일치 조각이 포함되었습니다!');
  }
  
  return strategy;
  };
  
  const optimalStrategy = calculateOptimalStrategy();

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
  const MAX_SEARCH = 1000000; // 백만 번 탐색 (50만 → 100만)
  const startTime = Date.now();
  const MAX_TIME = 15000; // 15초 (10초 → 15초)
  
  // 1단계: 역할군 일치 조각만 사용
  const matchingTargetPieces = optimalStrategy.targetPieces.filter(p => 
    matchingPieces.some(mp => mp.id === p.id)
  );
  
  // 2단계: 역할군 불일치 조각 (필요시)
  const nonMatchingTargetPieces = optimalStrategy.targetPieces.filter(p => 
    !matchingPieces.some(mp => mp.id === p.id)
  );
  
  console.log(`\n🎯 1단계: 역할군 일치 조각만으로 배치 시도 (${matchingTargetPieces.length}개)...`);
  if (nonMatchingTargetPieces.length > 0) {
    console.log(`   (필요시 2단계에서 역할군 불일치 조각 ${nonMatchingTargetPieces.length}개 추가 시도)`);
  }

  // 백트래킹 (목표 조합 배치)
  const backtrack = (targetPiecesToPlace, pieceIndex, currentPlaced, usedCells, currentAttributeCounts, usedUnique) => {
    searchCount++;
    
    if (Date.now() - startTime > MAX_TIME || searchCount > MAX_SEARCH) {
      return;
    }
    
    const currentScore = calculateScore(currentPlaced, board).totalScore;
    
    // 가지치기: 상한 계산 (더 관대하게 - 1단계에서는 충분히 탐색)
    const remainingPieces = targetPiecesToPlace.slice(pieceIndex);
    const remainingCells = totalOpenCells - usedCells.size;
    const upperBound = calculateUpperBound(
      currentScore,
      remainingPieces,
      remainingCells,
      currentAttributeCounts,
      usedUnique
    );
    
    // 1단계(역할군 일치)에서는 가지치기를 더 관대하게
    const isPhase1 = targetPiecesToPlace.every(p => matchingPieces.some(mp => mp.id === p.id));
    const pruneThreshold = isPhase1 ? bestScore * 0.95 : bestScore; // 1단계는 95% 이상이면 탐색
    
    if (upperBound < pruneThreshold) {
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
      console.log(`  ✨ 최고 점수 갱신: ${bestScore.toLocaleString()}점 (조각 ${currentPlaced.length}/${targetPiecesToPlace.length}개, ${bonusInfo.join(', ')})`);
    }
    
    if (pieceIndex >= targetPiecesToPlace.length || remainingCells <= 0) {
      return;
    }
    
    const piece = targetPiecesToPlace[pieceIndex];
    
    // 유니크 제한 (1개만 사용 가능)
    if (piece.rarity === '유니크' && usedUnique >= 1) {
      backtrack(targetPiecesToPlace, pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
      return;
    }
    
    // 목표 조합의 조각들은 모두 전략적으로 선택되었으므로
    // 가능한 한 모두 배치하는 것이 최적
    // 단, 유연성을 위해 건너뛰기 옵션은 유지
    
    // 속성별 21칸 제한 확인 (목표 조합에서 이미 고려했지만 이중 체크)
    if (piece.size <= 5 && piece.attribute && jobAttributes.includes(piece.attribute)) {
      const currentCount = currentAttributeCounts[piece.attribute] || 0;
      const targetInfo = optimalStrategy.attributeTargets[piece.attribute];
      
      // 목표 칸 수를 초과하면 건너뛰기
      if (targetInfo && currentCount >= targetInfo.targetCells) {
        backtrack(targetPiecesToPlace, pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
        return;
      }
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
      backtrack(targetPiecesToPlace, pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
      return;
    }
    
    // 중앙에 가까운 위치 우선 (휴리스틱)
    possiblePositions.sort((a, b) => {
      const distA = Math.abs(a.row - 3) + Math.abs(a.col - 3);
      const distB = Math.abs(b.row - 3) + Math.abs(b.col - 3);
      return distA - distB;
    });
    
    // 최대 탐색 위치 수 (1단계는 더 깊이 탐색)
    let maxPositions = 5; // 기본값 증가 (3 → 5)
    
    if (piece.size === 8) {
      maxPositions = 8; // 유니크는 매우 신중하게 (5 → 8)
    } else if (piece.size <= 5 && piece.attribute && jobAttributes.includes(piece.attribute)) {
      const currentCount = currentAttributeCounts[piece.attribute] || 0;
      
      // 보너스 경계(9, 12, 15, 18, 21)에 가까우면 더 많은 위치 시도
      const nextCount = currentCount + piece.size;
      if ([9, 12, 15, 18, 21].some(threshold => 
        Math.abs(nextCount - threshold) <= 3
      )) {
        maxPositions = Math.min(10, possiblePositions.length); // 매우 중요한 조각 (7 → 10)
      } else {
        maxPositions = Math.min(7, possiblePositions.length); // 역할군 일치 조각은 더 탐색
      }
    }
    maxPositions = Math.min(maxPositions, possiblePositions.length);
    
    // 이 조각을 배치하는 경우 (우선 시도)
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
      
      backtrack(targetPiecesToPlace, pieceIndex + 1, newPlaced, newUsedCells, newAttributeCounts, newUsedUnique);
    }
    
    // 선택적으로 건너뛰기 시도 (유연성 확보)
    // 1단계(역할군 일치)에서는 건너뛰기를 최소화하여 최대한 많이 배치
    const isMatchingPiece = matchingPieces.some(mp => mp.id === piece.id);
    
    // 건너뛰기 허용 조건:
    // 1. 역할군 불일치 조각이거나
    // 2. 낮은 등급(레어)이고 아직 충분한 점수가 있는 경우
    const shouldAllowSkip = !isMatchingPiece || 
      (piece.rarity === '레어' && currentPlaced.length > 0);
    
    if (piece.size !== 8 && shouldAllowSkip) {
      backtrack(targetPiecesToPlace, pieceIndex + 1, currentPlaced, usedCells, currentAttributeCounts, usedUnique);
    }
  };

  // 초기 상태
  const initialAttributeCounts = {
    광휘: 0, 관통: 0, 원소: 0, 파쇄: 0,
    축복: 0, 낙인: 0, 재생: 0,
  };
  
  // 1단계: 역할군 일치 조각만으로 백트래킹
  searchCount = 0;
  const phase1StartTime = Date.now();
  backtrack(matchingTargetPieces, 0, [], new Set(), initialAttributeCounts, 0);
  const phase1Duration = ((Date.now() - phase1StartTime) / 1000).toFixed(2);
  
  const phase1Score = bestScore;
  const phase1Placement = [...bestPlacement];
  const phase1AttributeCounts = { ...bestAttributeCounts };
  const phase1UsedCells = phase1Placement.reduce((sum, p) => sum + p.placedCells.length, 0);
  const phase1SearchCount = searchCount;
  
  console.log(`\n✅ 1단계 완료: ${phase1Score.toLocaleString()}점 (${phase1SearchCount.toLocaleString()}회 탐색, ${phase1Duration}초)`);
  console.log(`   - 배치된 조각: ${phase1Placement.length}/${matchingTargetPieces.length}개 (모두 역할군 일치 ✅)`);
  console.log(`   - 사용된 칸: ${phase1UsedCells}/${totalOpenCells}칸`);
  
  // 속성별 배치 상황
  const phase1AttributeStatus = jobAttributes
    .map(attr => {
      const count = phase1AttributeCounts[attr] || 0;
      if (count >= 21) return `${attr} 21✅`;
      if (count >= 18) return `${attr} 18`;
      if (count >= 15) return `${attr} 15`;
      if (count >= 12) return `${attr} 12`;
      if (count >= 9) return `${attr} 9`;
      return count > 0 ? `${attr} ${count}` : null;
    })
    .filter(Boolean);
  
  if (phase1AttributeStatus.length > 0) {
    console.log(`   - 속성 현황: ${phase1AttributeStatus.join(', ')}`);
  }
  
  // 역할군 일치 조각으로 모든 칸을 채웠는지 확인
  if (phase1UsedCells === totalOpenCells) {
    console.log(`   🎉 역할군 일치 조각만으로 모든 칸을 채웠습니다!`);
  } else {
    console.log(`   ⚠️ 남은 칸: ${totalOpenCells - phase1UsedCells}칸`);
  }
  
  // 2단계: 역할군 불일치 조각 추가 시도 (1단계에서 칸이 남은 경우만)
  if (phase1UsedCells < totalOpenCells && nonMatchingTargetPieces.length > 0 && phase1Placement.length > 0) {
    const phase1UsedCellsSet = new Set(
      phase1Placement.flatMap(p => p.placedCells.map(c => `${c.row}-${c.col}`))
    );
    const remainingCells = totalOpenCells - phase1UsedCells;
    const canFitMorePieces = nonMatchingTargetPieces.some(p => p.size <= remainingCells);
    
    if (canFitMorePieces && remainingCells > 0) {
      console.log(`\n🎯 2단계: 남은 칸(${remainingCells}칸)에 역할군 불일치 조각 추가 시도...`);
      console.log(`   ℹ️ 역할군 일치 조각만으로는 모든 칸을 채우지 못했습니다.`);
      
      // 1단계 결과에서 시작하여 역할군 불일치 조각만 추가
      let phase2Placement = [...phase1Placement];
      let phase2UsedCells = new Set(phase1UsedCellsSet);
      let phase2Score = phase1Score;
      let addedCount = 0;
      
      // 역할군 불일치 조각을 등급 높은 순으로 시도
      const sortedNonMatching = [...nonMatchingTargetPieces].sort((a, b) => {
        const scoreA = RARITY_SCORES[a.rarity];
        const scoreB = RARITY_SCORES[b.rarity];
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.size - a.size;
      });
      
      for (const piece of sortedNonMatching) {
        if (phase2UsedCells.size + piece.size > totalOpenCells) continue;
        
        // 배치 가능한 위치 찾기
        let placed = false;
        for (const { row, col } of openCells) {
          if (canPlacePiece(piece, row, col, phase2UsedCells)) {
            const placedCells = placePiece(piece, row, col, phase2UsedCells);
            
            phase2Placement.push({
              ...piece,
              position: { row, col },
              placedCells,
            });
            
            const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
            phase2Score += pieceScore;
            addedCount++;
            placed = true;
            
            console.log(`  ➕ ${piece.rarity} ${piece.attribute} ${piece.size}칸 (+${pieceScore}점)`);
            break;
          }
        }
        
        if (!placed) continue;
      }
      
      // 2단계 결과가 더 좋으면 적용
      if (phase2Score > phase1Score) {
        bestScore = phase2Score;
        bestPlacement = phase2Placement;
        // 속성 카운트 재계산
        const finalScore = calculateScore(bestPlacement, board);
        bestAttributeCounts = finalScore.attributeCounts;
        
        console.log(`✅ 2단계 완료: ${addedCount}개 조각 추가 → ${phase2Score.toLocaleString()}점 (+${(phase2Score - phase1Score).toLocaleString()}점)`);
      } else {
        console.log(`ℹ️ 2단계 완료: 추가 조각이 점수 향상에 도움이 안됨 (1단계 결과 유지)`);
        // 1단계 결과 확실히 복원
        bestScore = phase1Score;
        bestPlacement = phase1Placement;
        bestAttributeCounts = phase1AttributeCounts;
      }
    } else if (remainingCells === 0) {
      console.log(`\n✨ 역할군 일치 조각만으로 모든 칸을 채웠습니다! (2단계 불필요)`);
    } else {
      console.log(`\nℹ️ 2단계 생략: 남은 칸(${remainingCells}칸)에 맞는 역할군 불일치 조각이 없습니다.`);
    }
  } else if (phase1UsedCells === totalOpenCells) {
    console.log(`\n✨ 역할군 일치 조각만으로 모든 칸을 완벽하게 채웠습니다! 🎉`);
  } else if (nonMatchingTargetPieces.length === 0) {
    console.log(`\n✨ 역할군 일치 조각만으로 최적화 완료!`);
  }
  
  // ===== 후처리: 남은 칸 채우기 =====
  console.log('\n🔧 후처리: 남은 칸 채우기...');
  const usedPieceIds = new Set(bestPlacement.map(p => p.id));
  const usedCellsSet = new Set(bestPlacement.flatMap(p => 
    p.placedCells.map(c => `${c.row}-${c.col}`)
  ));
  const remainingCells = totalOpenCells - usedCellsSet.size;
  
  if (remainingCells > 0) {
    console.log(`  📦 남은 칸: ${remainingCells}개`);
    
    // 사용하지 않은 모든 조각 (역할군 일치 우선)
    const unusedPieces = [...matchingPieces, ...nonMatchingPieces]
      .filter(p => !usedPieceIds.has(p.id))
      .sort((a, b) => {
        // 1순위: 크기가 남은 칸 이하
        const aFits = a.size <= remainingCells ? 1 : 0;
        const bFits = b.size <= remainingCells ? 1 : 0;
        if (aFits !== bFits) return bFits - aFits;
        
        // 2순위: 역할군 일치
        const aMatches = matchingPieces.includes(a) ? 1 : 0;
        const bMatches = matchingPieces.includes(b) ? 1 : 0;
        if (aMatches !== bMatches) return bMatches - aMatches;
        
        // 3순위: 등급
        const scoreA = RARITY_SCORES[a.rarity];
        const scoreB = RARITY_SCORES[b.rarity];
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // 4순위: 크기 (작은 것부터 - 남은 칸에 맞추기)
        return a.size - b.size;
      });
    
    let filledCount = 0;
    let addedScore = 0;
    
    for (const piece of unusedPieces) {
      if (usedCellsSet.size + piece.size > totalOpenCells) continue;
      
      // 배치 가능한 위치 찾기
      let placed = false;
      for (const { row, col } of openCells) {
        if (canPlacePiece(piece, row, col, usedCellsSet)) {
          const placedCells = placePiece(piece, row, col, usedCellsSet);
          
          bestPlacement.push({
            ...piece,
            position: { row, col },
            placedCells,
          });
          
          // 속성 카운트 업데이트
          if (piece.size <= 5 && piece.attribute && jobAttributes.includes(piece.attribute)) {
            bestAttributeCounts[piece.attribute] = (bestAttributeCounts[piece.attribute] || 0) + piece.size;
          }
          
          const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
          addedScore += pieceScore;
          filledCount++;
          placed = true;
          
          console.log(`  ✅ 추가: ${piece.rarity} ${piece.attribute} ${piece.size}칸 (+${pieceScore}점)`);
          break;
        }
      }
      
      if (!placed) continue;
    }
    
    if (filledCount > 0) {
      // 전체 점수 재계산
      const finalScore = calculateScore(bestPlacement, board);
      bestScore = finalScore.totalScore;
      bestAttributeCounts = finalScore.attributeCounts;
      
      console.log(`  🎉 ${filledCount}개 조각 추가 완료 (총 +${addedScore}점, 최종 점수: ${bestScore.toLocaleString()}점)`);
    } else {
      console.log(`  ℹ️ 남은 칸에 배치 가능한 조각이 없습니다.`);
    }
  } else {
    console.log(`  ✨ 모든 칸이 채워졌습니다!`);
  }
  
  const elapsedTime = (Date.now() - startTime) / 1000;
  console.log('\n=== ✅ 최적화 완료 ===');
  console.log(`⏱️ 총 소요 시간: ${elapsedTime.toFixed(2)}초`);
  console.log(`🎯 목표 점수: ${optimalStrategy.expectedScore.toLocaleString()}점`);
  console.log(`🏆 최종 점수: ${bestScore.toLocaleString()}점`);
  console.log(`🧩 배치된 조각: ${bestPlacement.length}개`);
  
  // 역할군별 조각 통계
  const matchingCount = bestPlacement.filter(p => 
    matchingPieces.some(mp => mp.id === p.id)
  ).length;
  const nonMatchingCount = bestPlacement.length - matchingCount;
  
  if (nonMatchingCount > 0) {
    console.log(`   - 역할군 일치: ${matchingCount}개`);
    console.log(`   - 역할군 불일치: ${nonMatchingCount}개`);
  } else {
    console.log(`   - 모두 역할군 일치 조각 ✅`);
  }
  
  if (bestPlacement.length > 0) {
    console.log('\n📈 최종 속성별 칸 수:');
    const bonusDetails = [];
    Object.entries(bestAttributeCounts).forEach(([attr, count]) => {
      if (jobAttributes.includes(attr) && count > 0) {
        let bonus = 0;
        if (count >= 21) bonus = 265 * 5;
        else if (count >= 18) bonus = 265 * 4;
        else if (count >= 15) bonus = 265 * 3;
        else if (count >= 12) bonus = 265 * 2;
        else if (count >= 9) bonus = 265;
        
        const targetInfo = optimalStrategy.attributeTargets[attr];
        const targetStr = targetInfo ? ` (목표: ${targetInfo.targetCells}칸)` : '';
        console.log(`  ${attr}: ${count}칸${targetStr} → 보너스 ${bonus.toLocaleString()}점`);
        bonusDetails.push({ attr, count, bonus });
      }
    });
    
    const totalBonus = bonusDetails.reduce((sum, d) => sum + d.bonus, 0);
    const baseScore = bestScore - totalBonus;
    console.log(`\n💎 기본 점수: ${baseScore.toLocaleString()}점`);
    console.log(`💰 보너스 점수: ${totalBonus.toLocaleString()}점`);
    
    // 유니크 조각 확인
    const uniquePieces = bestPlacement.filter(p => p.size === 8);
    if (uniquePieces.length > 0) {
      console.log(`⭐ 유니크 조각: ${uniquePieces[0].attribute} (${uniquePieces[0].shape})`);
    }
  }
  
  return {
    placedPieces: bestPlacement,
    score: bestScore,
  };
}

