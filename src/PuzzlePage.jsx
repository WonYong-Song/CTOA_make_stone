import React, { useState, useMemo, useEffect } from 'react';
import { 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Card, 
  CardContent,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import { Close, Add, Delete, ExpandMore, ExpandLess, HelpOutline } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 등급별 색상 (명도 80%)
const RARITY_COLORS = {
  '레어': '#9db3e0',      // 파란색 (명도 80%)
  '에픽': '#fcb3f0',      // 핑크색 (명도 80%)
  '슈퍼에픽': '#e86b6a',  // 빨간색 (명도 80%)
  '유니크': '#f9f28a',    // 노란색 (명도 80%)
};

// 속성별 테두리 색상 (명도 70%)
const ATTRIBUTE_BORDER_COLORS = {
  '광휘': '#ffd700',      // 금색
  '관통': '#c0c0c0',      // 은색
  '원소': '#00ffff',      // 청록색
  '파쇄': '#ff6347',      // 토마토색
  '축복': '#9370db',      // 보라색
  '낙인': '#ff1493',      // 딥핑크
  '재생': '#32cd32',      // 라임그린
  '딜러': '#4169e1',      // 로얄블루
  '스트라이커': '#ff4500', // 오렌지레드
  '서포터': '#20b2aa',    // 라이트시그린
  '전 역할군': '#daa520',  // 골든로드
};

// 등급별 칸당 점수
const RARITY_SCORES = {
  '레어': 30,
  '에픽': 60,
  '슈퍼에픽': 120,
  '유니크': 250,
};

// 속성 목록
const ATTRIBUTES = ['광휘', '관통', '원소', '파쇄', '축복', '낙인', '재생'];

// 역할군별 속성 매칭
const JOB_ATTRIBUTES = {
  '딜러': ['광휘', '관통'],
  '스트라이커': ['원소', '파쇄'],
  '서포터': ['축복', '낙인', '재생'],
};

// 초기 보드판 상태
const INITIAL_BOARD = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

// 초기 열려있는 칸 (가운데 5x3) - 닫을 수 없음
const INITIAL_OPEN_CELLS = new Set();
for (let row = 2; row < 5; row++) {
  for (let col = 1; col < 6; col++) {
    INITIAL_OPEN_CELLS.add(`${row}-${col}`);
  }
}

// 2D 배열을 좌표 배열로 변환
const shape2DToCoords = (shape2D) => {
  const coords = [];
  for (let row = 0; row < shape2D.length; row++) {
    for (let col = 0; col < shape2D[row].length; col++) {
      if (shape2D[row][col] === 1) {
        coords.push([row, col]);
      }
    }
  }
  // 정규화: 최소값을 0,0으로 만들기
  if (coords.length === 0) return [];
  const minRow = Math.min(...coords.map(c => c[0]));
  const minCol = Math.min(...coords.map(c => c[1]));
  return coords.map(([r, c]) => [r - minRow, c - minCol]);
};

// 조각 모양 데이터 (puzzle_game_rules.md 기반)
const PIECE_SHAPES = {
  1: [
    { name: '1칸', shape: [[1]] },
  ],
  2: [
    { name: '2칸 세로', shape: [[1], [1]] },
    { name: '2칸 가로', shape: [[1, 1]] },
  ],
  3: [
    { name: '3칸 가로', shape: [[1, 1, 1]] },
    { name: '3칸 세로', shape: [[1], [1], [1]] },
    { name: '3칸 L자 (좌상)', shape: [[1, 1], [1, 0]] },
    { name: '3칸 L자 (우상)', shape: [[1, 1], [0, 1]] },
    { name: '3칸 L자 (좌하)', shape: [[0, 1], [1, 1]] },
    { name: '3칸 L자 (우하)', shape: [[1, 0], [1, 1]] },
  ],
  4: [
    { name: '4칸 가로', shape: [[1, 1, 1, 1]] },
    { name: '4칸 세로', shape: [[1], [1], [1], [1]] },
    { name: '4칸 정사각형', shape: [[1, 1], [1, 1]] },
    { name: '4칸 T자 (상)', shape: [[1, 1, 1], [0, 1, 0]] },
    { name: '4칸 T자 (하)', shape: [[0, 1, 0], [1, 1, 1]] },
    { name: '4칸 T자 (좌)', shape: [[1, 0], [1, 1], [1, 0]] },
    { name: '4칸 T자 (우)', shape: [[0, 1], [1, 1], [0, 1]] },
    { name: '4칸 L자 (좌상)', shape: [[1, 0, 0], [1, 1, 1]] },
    { name: '4칸 L자 (우상)', shape: [[0, 0, 1], [1, 1, 1]] },
    { name: '4칸 L자 (좌하)', shape: [[1, 1, 1], [1, 0, 0]] },
    { name: '4칸 L자 (우하)', shape: [[1, 1, 1], [0, 0, 1]] },
    { name: '4칸 Z자 (좌)', shape: [[1, 1], [1, 0], [1, 0]] },
    { name: '4칸 Z자 (우)', shape: [[1, 1], [0, 1], [0, 1]] },
    { name: '4칸 역Z자 (좌)', shape: [[1, 0], [1, 0], [1, 1]] },
    { name: '4칸 역Z자 (우)', shape: [[0, 1], [0, 1], [1, 1]] },
  ],
  5: [
    { name: '5칸 +자', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
    { name: '5칸 L자1', shape: [[0, 1, 1], [0, 1, 0], [1, 1, 0]] },
    { name: '5칸 L자2', shape: [[1, 0, 0], [1, 1, 1], [0, 0, 1]] },
    { name: '5칸 L자3', shape: [[1, 1, 0], [0, 1, 0], [0, 1, 1]] },
    { name: '5칸 L자4', shape: [[0, 0, 1], [1, 1, 1], [1, 0, 0]] },
    { name: '5칸 T자1', shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
    { name: '5칸 T자2', shape: [[0, 0, 1], [1, 1, 1], [0, 0, 1]] },
    { name: '5칸 T자3', shape: [[0, 1, 0], [0, 1, 0], [1, 1, 1]] },
    { name: '5칸 T자4', shape: [[1, 0, 0], [1, 1, 1], [1, 0, 0]] },
    { name: '5칸 Z자1', shape: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
    { name: '5칸 Z자2', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
    { name: '5칸 Z자3', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
    { name: '5칸 Z자4', shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    { name: '5칸 U자1', shape: [[1, 0, 1], [1, 1, 1]] },
    { name: '5칸 U자2', shape: [[1, 1], [1, 0], [1, 1]] },
    { name: '5칸 U자3', shape: [[1, 1, 1], [1, 0, 1]] },
    { name: '5칸 U자4', shape: [[1, 1], [0, 1], [1, 1]] },
  ],
  8: {
    '딜러': [
      { name: '딜러 8칸1', shape: [[1, 0], [1, 1], [1, 1], [1, 1], [0, 1]] },
      { name: '딜러 8칸2', shape: [[0, 1, 1, 0], [0, 1, 1, 0], [1, 1, 1, 1]] },
      { name: '딜러 8칸3', shape: [[1, 1, 1, 1], [1, 1, 1, 1]] },
    ],
    '스트라이커': [
      { name: '스트라이커 8칸1', shape: [[0, 1, 0], [1, 1, 1], [1, 1, 1], [0, 1, 0]] },
      { name: '스트라이커 8칸2', shape: [[1, 1, 1, 1], [0, 1, 1, 0], [0, 1, 1, 0]] },
    ],
    '서포터': [
      { name: '서포터 8칸1', shape: [[0, 1, 1, 0], [1, 1, 1, 1], [0, 1, 1, 0]] },
      { name: '서포터 8칸2', shape: [[0, 1, 1, 1, 1], [1, 1, 1, 1, 0]] },
    ],
    '전 역할군': [
      { name: '전직업 8칸1', shape: [[1, 1, 1, 1], [1, 1, 1, 1]] },
      { name: '전직업 8칸2', shape: [[1, 1], [1, 1], [1, 1], [1, 1]] },
    ],
  },
};

// Material-UI 다크 테마
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
    },
    secondary: {
      main: '#34d399',
    },
    background: {
      default: '#0f172a',
      paper: '#111827',
    },
  },
});

function PuzzlePage() {
  const [job, setJob] = useState('딜러');
  
  // localStorage에서 보드판 상태를 불러오거나 초기값 사용
  const getInitialBoard = () => {
    const savedBoard = localStorage.getItem('puzzleBoard');
    if (savedBoard) {
      try {
        return JSON.parse(savedBoard);
      } catch (e) {
        console.error('저장된 보드판 상태를 불러오는 중 오류 발생:', e);
      }
    }
    return INITIAL_BOARD.map(row => [...row]);
  };
  
  const [board, setBoard] = useState(getInitialBoard);
  const [pieces, setPieces] = useState([]);
  const [selectedRarity, setSelectedRarity] = useState('레어');
  const [selectedAttribute, setSelectedAttribute] = useState('광휘');
  const [expandedAttributes, setExpandedAttributes] = useState({
    광휘: true, 관통: true, 원소: true, 파쇄: true,
    축복: true, 낙인: true, 재생: true,
    역할군_딜러: true,
  });
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showShapePopup, setShowShapePopup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // localStorage에서 조각 정보 불러오기
  useEffect(() => {
    const savedPieces = localStorage.getItem('puzzlePieces');
    if (savedPieces) {
      try {
        const parsed = JSON.parse(savedPieces);
        setPieces(parsed);
      } catch (e) {
        console.error('저장된 조각 정보를 불러오는 중 오류 발생:', e);
      }
    }
  }, []);

  // 조각 정보가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (pieces.length > 0) {
      localStorage.setItem('puzzlePieces', JSON.stringify(pieces));
    } else {
      // 조각이 없으면 localStorage에서도 제거
      localStorage.removeItem('puzzlePieces');
    }
  }, [pieces]);

  // 보드판 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('puzzleBoard', JSON.stringify(board));
  }, [board]);

  // 조각 전체 삭제
  const handleClearAllPieces = () => {
    if (window.confirm('모든 설탕유리 조각을 삭제하시겠습니까?')) {
      setPieces([]);
      localStorage.removeItem('puzzlePieces');
    }
  };

  // 인접한 칸이 열려있는지 확인
  const hasAdjacentOpenCell = (row, col, boardState) => {
    const directions = [
      [-1, 0], // 상
      [1, 0],  // 하
      [0, -1], // 좌
      [0, 1],  // 우
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 7 && newCol >= 0 && newCol < 7) {
        if (boardState[newRow][newCol] === 1) {
          return true;
        }
      }
    }
    
    return false;
  };

  // 모든 열려있는 칸이 연결되어 있는지 확인 (BFS)
  const isAllConnected = (boardState) => {
    const visited = Array(7).fill(null).map(() => Array(7).fill(false));
    const openCells = [];
    
    // 모든 열려있는 칸 찾기
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (boardState[r][c] === 1) {
          openCells.push({ row: r, col: c });
        }
      }
    }
    
    if (openCells.length === 0) return true;
    
    // BFS로 연결 확인
    const queue = [openCells[0]];
    visited[openCells[0].row][openCells[0].col] = true;
    let connectedCount = 1;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
      const { row, col } = queue.shift();
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (
          newRow >= 0 && newRow < 7 &&
          newCol >= 0 && newCol < 7 &&
          !visited[newRow][newCol] &&
          boardState[newRow][newCol] === 1
        ) {
          visited[newRow][newCol] = true;
          queue.push({ row: newRow, col: newCol });
          connectedCount++;
        }
      }
    }
    
    return connectedCount === openCells.length;
  };

  // 보드판 클릭 핸들러 (닫혀있는 칸만 열고 닫을 수 있음)
  const handleCellClick = (row, col) => {
    const cellKey = `${row}-${col}`;
    // 초기 열려있는 칸은 닫을 수 없음
    if (INITIAL_OPEN_CELLS.has(cellKey)) return;
    
    const newBoard = board.map(r => [...r]);
    const currentState = newBoard[row][col];
    
    if (currentState === 0) {
      // 닫혀있는 칸을 열려고 할 때: 인접한 칸이 열려있어야 함
      if (!hasAdjacentOpenCell(row, col, newBoard)) {
        alert('인접한 영역이 열려있어야 이 영역을 열 수 있습니다.');
        return;
      }
      newBoard[row][col] = 1;
    } else {
      // 열려있는 칸을 닫으려고 할 때: 고립된 영역이 생기지 않아야 함
      newBoard[row][col] = 0;
      if (!isAllConnected(newBoard)) {
        alert('이 영역을 닫으면 고립된 영역이 생깁니다. 닫을 수 없습니다.');
        return;
      }
    }
    
    setBoard(newBoard);
  };

  // 모두 열기 (고정 영역 제외, 인접 규칙 준수)
  const handleOpenAll = () => {
    const newBoard = board.map(r => [...r]);
    let changed = false;
    
    // 여러 번 반복하여 더 이상 열 수 있는 칸이 없을 때까지 진행
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const cellKey = `${row}-${col}`;
          // 고정 영역은 제외
          if (INITIAL_OPEN_CELLS.has(cellKey)) continue;
          // 이미 열려있으면 스킵
          if (newBoard[row][col] === 1) continue;
          // 인접한 칸이 열려있으면 열기
          if (hasAdjacentOpenCell(row, col, newBoard)) {
            newBoard[row][col] = 1;
            changed = true;
            hasMore = true;
          }
        }
      }
    }
    
    if (changed) {
      setBoard(newBoard);
    }
  };

  // 모두 닫기 (고정 영역 제외, 연결 규칙 준수)
  const handleCloseAll = () => {
    const newBoard = board.map(r => [...r]);
    let changed = false;
    
    // 여러 번 반복하여 더 이상 닫을 수 있는 칸이 없을 때까지 진행
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      // 역순으로 확인하여 가장자리부터 닫기
      const cellsToCheck = [];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const cellKey = `${row}-${col}`;
          // 고정 영역은 제외
          if (INITIAL_OPEN_CELLS.has(cellKey)) continue;
          // 이미 닫혀있으면 스킵
          if (newBoard[row][col] === 0) continue;
          cellsToCheck.push({ row, col });
        }
      }
      
      // 역순으로 확인 (가장자리부터)
      for (const { row, col } of cellsToCheck.reverse()) {
        // 임시로 닫아보고 연결 확인
        newBoard[row][col] = 0;
        if (isAllConnected(newBoard)) {
          changed = true;
          hasMore = true;
        } else {
          // 연결이 끊기면 다시 열기
          newBoard[row][col] = 1;
        }
      }
    }
    
    if (changed) {
      setBoard(newBoard);
    }
  };

  // 조각 제거 (최적화 결과 초기화)
  const handleClearResult = () => {
    setResult(null);
  };

  // 선택 가능한 조각 목록 가져오기
  const getAvailableShapes = (size) => {
    if (size === 8) {
      // 현재 역할군 조각 + 전 역할군 조각 모두 포함
      const jobShapes = PIECE_SHAPES[8][job] || [];
      const allJobShapes = PIECE_SHAPES[8]['전 역할군'] || [];
      return [...jobShapes, ...allJobShapes];
    } else {
      return PIECE_SHAPES[size] || [];
    }
  };

  // 조각 추가 (모양 클릭 시)
  const handleAddPiece = (size, shapeIndex, rarity, attribute) => {
    const availableShapes = getAvailableShapes(size);
    const selectedShape = availableShapes[shapeIndex];
    if (!selectedShape) return;

    const shapeCoords = shape2DToCoords(selectedShape.shape);
    
    // 8칸 조각의 경우, 조각 이름으로 역할군 판단
    let pieceAttribute = attribute;
    if (size === 8) {
      // 조각 이름에 "전직업" 또는 "전 역할군"이 포함되어 있으면 "전 역할군"
      if (selectedShape.name.includes('전직업') || selectedShape.name.includes('전 역할군')) {
        pieceAttribute = '전 역할군';
      } else {
        // 그 외는 현재 역할군
        pieceAttribute = job;
      }
    }
    
    const newPiece = {
      id: Date.now(),
      shape: selectedShape.name,
      shapeCoords: shapeCoords,
      size: size,
      rarity: size === 8 ? '유니크' : rarity,
      attribute: pieceAttribute,
    };
    
    setPieces([...pieces, newPiece]);
  };

  // 속성별 조각 목록 가져오기
  const getPiecesByAttribute = (attr) => {
    return pieces.filter(p => p.attribute === attr);
  };

  // 속성 접기/펼치기 토글
  const toggleAttribute = (attr) => {
    setExpandedAttributes(prev => ({
      ...prev,
      [attr]: !prev[attr],
    }));
  };

  // 조각 삭제
  const handleRemovePiece = (id) => {
    setPieces(pieces.filter(p => p.id !== id));
  };

  // 점수 계산
  const calculateScore = (placedPieces, boardState) => {
    let baseScore = 0;
    const attributeCounts = {
      광휘: 0, 관통: 0, 원소: 0, 파쇄: 0,
      축복: 0, 낙인: 0, 재생: 0,
    };

    // 기본 점수 계산
    placedPieces.forEach(piece => {
      const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
      baseScore += pieceScore;
      
      // 속성 카운트 (1~5칸 조각만)
      if (piece.size <= 5 && piece.attribute) {
        attributeCounts[piece.attribute] += piece.size;
      }
    });

    // 추가 점수 계산 (역할군과 일치하는 속성만)
    // 보너스 점수 계산 조건: 9, 12, 15, 18, 21칸 이상일 때 각각 265점씩 추가
    let bonusScore = 0;
    const jobAttributes = JOB_ATTRIBUTES[job] || [];
    
    Object.entries(attributeCounts).forEach(([attr, count]) => {
      if (jobAttributes.includes(attr)) {
        // 9, 12, 15, 18, 21칸 이상일 때 각각 265점씩 추가
        if (count >= 9) bonusScore += 265;
        if (count >= 12) bonusScore += 265;
        if (count >= 15) bonusScore += 265;
        if (count >= 18) bonusScore += 265;
        if (count >= 21) bonusScore += 265;
      }
    });

    return {
      baseScore,
      bonusScore,
      totalScore: baseScore + bonusScore,
      attributeCounts,
    };
  };

  // 조각을 특정 위치에 배치할 수 있는지 확인
  const canPlacePiece = (piece, startRow, startCol, usedCells) => {
    if (!piece.shapeCoords) return false;
    
    for (const [dr, dc] of piece.shapeCoords) {
      const row = startRow + dr;
      const col = startCol + dc;
      
      // 보드 범위 체크
      if (row < 0 || row >= 7 || col < 0 || col >= 7) return false;
      
      // 열려있는 칸인지 체크
      if (board[row][col] !== 1) return false;
      
      // 이미 사용된 칸인지 체크
      const cellKey = `${row}-${col}`;
      if (usedCells.has(cellKey)) return false;
    }
    
    return true;
  };

  // 조각을 특정 위치에 배치
  const placePiece = (piece, startRow, startCol, usedCells) => {
    const placedCells = [];
    for (const [dr, dc] of piece.shapeCoords) {
      const row = startRow + dr;
      const col = startCol + dc;
      const cellKey = `${row}-${col}`;
      usedCells.add(cellKey);
      placedCells.push({ row, col });
    }
    return placedCells;
  };

  // 조각 배치 제거
  const removePiece = (placedCells, usedCells) => {
    placedCells.forEach(({ row, col }) => {
      const cellKey = `${row}-${col}`;
      usedCells.delete(cellKey);
    });
  };

  // 최고 점수 계산 후 퍼즐 맞추기 방식으로 최적화
  const findBestCombination = () => {
    setIsCalculating(true);
    
    // 비동기로 계산하여 UI 블로킹 방지
    setTimeout(() => {
      let bestResult = {
        placedPieces: [],
        score: { baseScore: 0, bonusScore: 0, totalScore: 0 },
        usedCells: [],
      };

      // 1. 제단에서 빈칸 개수 파악
      const openCells = [];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          if (board[row][col] === 1) {
            openCells.push({ row, col });
          }
        }
      }
      const totalOpenCells = openCells.length;

      if (totalOpenCells === 0) {
        alert('열려있는 칸이 없습니다.');
        setIsCalculating(false);
        return;
      }

      // 조각을 역할군 일치/불일치로 분리
      const jobAttributes = JOB_ATTRIBUTES[job] || [];
      const allPieces = [...pieces].filter(p => p.shapeCoords);
      
      if (allPieces.length === 0) {
        alert('좌표가 입력된 설탕유리 조각이 없습니다.');
        setIsCalculating(false);
        return;
      }
      
      // 역할군과 일치하는 조각 (1~5칸 조각 중 속성이 역할군과 일치, 8칸은 현재 역할군 또는 전 역할군)
      const matchingPieces = allPieces.filter(p => {
        if (p.size === 8) {
          // 8칸은 현재 역할군 또는 전 역할군 포함
          return p.attribute === job || p.attribute === '전 역할군';
        }
        return p.size <= 5 && p.attribute && jobAttributes.includes(p.attribute);
      });
      
      // 역할군과 불일치하는 조각 (8칸은 현재 역할군과 전 역할군이 아닌 것만)
      const nonMatchingPieces = allPieces.filter(p => {
        if (p.size === 8) {
          return p.attribute !== job && p.attribute !== '전 역할군';
        }
        return p.size <= 5 && (!p.attribute || !jobAttributes.includes(p.attribute));
      });
      
      // 조각 정렬: 등급이 높은 순, 같은 등급이면 크기가 큰 순
      const sortByRarity = (a, b) => {
        const rarityOrder = { '유니크': 4, '슈퍼에픽': 3, '에픽': 2, '레어': 1 };
        const orderA = rarityOrder[a.rarity] || 0;
        const orderB = rarityOrder[b.rarity] || 0;
        if (orderA !== orderB) return orderB - orderA;
        return b.size - a.size;
      };
      
      matchingPieces.sort(sortByRarity);
      nonMatchingPieces.sort(sortByRarity);
      
      // 역할군 속성별로 조각 그룹화
      const piecesByAttribute = {};
      jobAttributes.forEach(attr => {
        piecesByAttribute[attr] = matchingPieces.filter(p => p.attribute === attr);
      });
      
      // 속성별 점수 계산 및 정렬 (점수가 높은 속성부터)
      const attributeScores = {};
      Object.keys(piecesByAttribute).forEach(attr => {
        let totalScore = 0;
        let totalSize = 0;
        piecesByAttribute[attr].forEach(piece => {
          if (totalSize < 21) {
            const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
            totalScore += pieceScore;
            totalSize += piece.size;
          }
        });
        // 보너스 점수 포함 계산
        let bonusScore = 0;
        if (totalSize >= 9) bonusScore += 265;
        if (totalSize >= 12) bonusScore += 265;
        if (totalSize >= 15) bonusScore += 265;
        if (totalSize >= 18) bonusScore += 265;
        if (totalSize >= 21) bonusScore += 265;
        attributeScores[attr] = totalScore + bonusScore;
      });
      
      // 점수가 높은 속성부터 정렬
      const sortedAttributeKeys = Object.keys(piecesByAttribute).sort((a, b) => {
        return attributeScores[b] - attributeScores[a];
      });
      
      console.log('속성별 점수 순위:', sortedAttributeKeys.map(attr => 
        `${attr}: ${attributeScores[attr]}점`
      ));
      
      // ===== 1단계: 최고 점수 계산 (우선순위 기반) =====
      const calculateOptimalTarget = () => {
        let targetBaseScore = 0;
        let targetBonusScore = 0;
        const targetPieces = [];
        const targetAttributeCounts = {};
        let usedUnique = 0;
        let usedCellCount = 0;
        
        // 우선순위 1: 역할군에 옵션이 적용되는 유니크 조각 (현재 역할군 또는 전 역할군)
        const uniquePieces = matchingPieces.filter(p => p.size === 8 && (p.attribute === job || p.attribute === '전 역할군'));
        uniquePieces.sort(sortByRarity); // 등급 높은 순
        
        for (const piece of uniquePieces) {
          if (usedUnique >= 1) break; // 유니크는 최대 1개
          if (usedCellCount + piece.size > totalOpenCells) continue;
          
          targetPieces.push(piece);
          targetBaseScore += RARITY_SCORES[piece.rarity] * piece.size;
          usedCellCount += piece.size;
          usedUnique++;
        }
        
        // 우선순위 2: 21개 모았을 때 점수가 높은 속성 조합
        // 속성별로 21칸까지 채울 때의 점수 계산 (기본 점수 + 보너스 점수)
        const attribute21Scores = {};
        jobAttributes.forEach(attr => {
          const attrPieces = piecesByAttribute[attr] || [];
          let attrBaseScore = 0;
          let attrSize = 0;
          let attrUsedUnique = usedUnique; // 이미 사용된 유니크 반영
          
          for (const piece of attrPieces) {
            // 이미 사용된 조각인지 확인 (유니크 조각 포함)
            const isUsed = targetPieces.some(p => p.id === piece.id);
            if (isUsed) continue;
            
            if (piece.rarity === '유니크' && attrUsedUnique >= 1) continue;
            if (attrSize + piece.size > 21) continue;
            
            attrBaseScore += RARITY_SCORES[piece.rarity] * piece.size;
            attrSize += piece.size;
            if (piece.rarity === '유니크') attrUsedUnique++;
          }
          
          // 21칸 달성 시 보너스 점수
          let attrBonusScore = 0;
          if (attrSize >= 21) {
            if (attrSize >= 9) attrBonusScore += 265;
            if (attrSize >= 12) attrBonusScore += 265;
            if (attrSize >= 15) attrBonusScore += 265;
            if (attrSize >= 18) attrBonusScore += 265;
            if (attrSize >= 21) attrBonusScore += 265;
          }
          
          attribute21Scores[attr] = attrBaseScore + attrBonusScore;
        });
        
        // 점수가 높은 속성부터 정렬
        const sortedBy21Score = Object.keys(attribute21Scores).sort((a, b) => {
          return attribute21Scores[b] - attribute21Scores[a];
        });
        
        // 우선순위 2: 가장 점수가 높은 속성부터 21칸까지 채우기
        for (const attr of sortedBy21Score) {
          if (targetAttributeCounts[attr] >= 21) continue;
          
          const attrPieces = piecesByAttribute[attr] || [];
          for (const piece of attrPieces) {
            // 이미 사용된 조각인지 확인
            const isUsed = targetPieces.some(p => p.id === piece.id);
            if (isUsed) continue;
            
            if (piece.rarity === '유니크' && usedUnique >= 1) continue;
            if (targetAttributeCounts[attr] + piece.size > 21) continue;
            if (usedCellCount + piece.size > totalOpenCells) continue;
            
            targetPieces.push(piece);
            targetBaseScore += RARITY_SCORES[piece.rarity] * piece.size;
            targetAttributeCounts[attr] += piece.size;
            usedCellCount += piece.size;
            
            if (piece.rarity === '유니크') {
              usedUnique++;
            }
          }
        }
        
        // 우선순위 3: 21개 속성 이후 같은 역할군의 다른 속성에서 등급이 높은 조각칸이 많은 속성으로 21을 목표로 보너스 등급 달성
        // 아직 21칸을 채우지 못한 속성들을 등급 높은 조각이 많은 순으로 정렬
        const remainingAttributes = sortedBy21Score.filter(attr => targetAttributeCounts[attr] < 21);
        
        // 각 속성의 남은 칸 수와 등급 높은 조각의 칸 수 계산
        const attributeRemainingScores = {};
        remainingAttributes.forEach(attr => {
          const attrPieces = piecesByAttribute[attr] || [];
          let highRarityCells = 0; // 슈퍼에픽 이상 조각의 칸 수
          let remainingCells = 21 - targetAttributeCounts[attr];
          
          for (const piece of attrPieces) {
            if (piece.rarity === '유니크' && usedUnique >= 1) continue;
            if (targetAttributeCounts[attr] + piece.size > 21) continue;
            
            // 이미 사용된 조각인지 확인
            const isUsed = targetPieces.some(p => p.id === piece.id);
            if (isUsed) continue;
            
            if (piece.rarity === '슈퍼에픽' || piece.rarity === '유니크') {
              highRarityCells += piece.size;
            }
          }
          
          // 등급 높은 조각 칸 수가 많은 속성 우선
          attributeRemainingScores[attr] = highRarityCells;
        });
        
        // 등급 높은 조각 칸 수가 많은 순으로 정렬
        const sortedByHighRarity = remainingAttributes.sort((a, b) => {
          return attributeRemainingScores[b] - attributeRemainingScores[a];
        });
        
        // 우선순위 3: 등급 높은 조각이 많은 속성부터 21칸까지 채우기
        for (const attr of sortedByHighRarity) {
          if (targetAttributeCounts[attr] >= 21) continue;
          
          const attrPieces = piecesByAttribute[attr] || [];
          for (const piece of attrPieces) {
            if (piece.rarity === '유니크' && usedUnique >= 1) continue;
            if (targetAttributeCounts[attr] + piece.size > 21) continue;
            if (usedCellCount + piece.size > totalOpenCells) continue;
            
            // 이미 사용된 조각인지 확인
            const isUsed = targetPieces.some(p => p.id === piece.id);
            if (isUsed) continue;
            
            targetPieces.push(piece);
            targetBaseScore += RARITY_SCORES[piece.rarity] * piece.size;
            targetAttributeCounts[attr] += piece.size;
            usedCellCount += piece.size;
            
            if (piece.rarity === '유니크') {
              usedUnique++;
            }
          }
        }
        
        // 우선순위 4: 짜투리 칸은 역할군 내에서 아무 조각으로 처리
        const remainingPieces = matchingPieces.filter(p => {
          // 이미 사용된 조각 제외
          if (targetPieces.some(used => used.id === p.id)) return false;
          // 유니크는 이미 사용했으면 제외
          if (p.rarity === '유니크' && usedUnique >= 1) return false;
          return true;
        });
        
        // 등급 높은 순으로 정렬
        remainingPieces.sort(sortByRarity);
        
        // 남은 칸을 채우기
        for (const piece of remainingPieces) {
          if (usedCellCount + piece.size > totalOpenCells) continue;
          if (piece.rarity === '유니크' && usedUnique >= 1) continue;
          
          targetPieces.push(piece);
          targetBaseScore += RARITY_SCORES[piece.rarity] * piece.size;
          
          // 속성별 칸 수 업데이트 (21칸 초과해도 추가)
          if (piece.size <= 5 && piece.attribute) {
            targetAttributeCounts[piece.attribute] = (targetAttributeCounts[piece.attribute] || 0) + piece.size;
          }
          
          usedCellCount += piece.size;
          if (piece.rarity === '유니크') {
            usedUnique++;
          }
        }
        
        // 보너스 점수 계산
        Object.entries(targetAttributeCounts).forEach(([attr, count]) => {
          if (count >= 9) targetBonusScore += 265;
          if (count >= 12) targetBonusScore += 265;
          if (count >= 15) targetBonusScore += 265;
          if (count >= 18) targetBonusScore += 265;
          if (count >= 21) targetBonusScore += 265;
        });
        
        return {
          pieces: targetPieces,
          baseScore: targetBaseScore,
          bonusScore: targetBonusScore,
          totalScore: targetBaseScore + targetBonusScore,
          attributeCounts: targetAttributeCounts,
        };
      };
      
      const target = calculateOptimalTarget();
      console.log('목표 점수:', target.totalScore, '목표 조각 수:', target.pieces.length);
      
      // 속성별 점수 순위에 따라 조각 정렬 (역할군 속성 조각만 사용)
      const sortedMatchingPieces = [];
      sortedAttributeKeys.forEach(attr => {
        matchingPieces.forEach(piece => {
          if (piece.attribute === attr) {
            sortedMatchingPieces.push(piece);
          }
        });
      });
      // 역할군 속성 조각만 사용 (불일치 조각 제외)
      const sortedAllPieces = [...sortedMatchingPieces];
      
      // ===== 2단계: 백트래킹 알고리즘 =====
      const solveWithBacktracking = (piecesToPlace) => {
        // 조각을 배치 순서로 정렬 (역할군 일치 조각 먼저, 등급 높은 순)
        const sortedTargetPieces = [...piecesToPlace].sort((a, b) => {
          const aIsMatching = jobAttributes.includes(a.attribute);
          const bIsMatching = jobAttributes.includes(b.attribute);
          if (aIsMatching !== bIsMatching) {
            return bIsMatching ? 1 : -1; // 일치하는 조각 먼저
          }
          return sortByRarity(a, b);
        });
        
        let bestPlaced = [];
        let bestScore = 0;
        let searchCount = 0;
        const MAX_BACKTRACK_SEARCH = 100000; // 탐색 제한 증가
        
        // 모든 조각 사용 (개수 제한 없음)
        // 역할군 속성 조각이 먼저 오도록 이미 정렬되어 있음
        
        // 백트래킹으로 모든 조각 배치 시도
        const backtrack = (pieceIndex, currentPlaced, localUsedCells, usedUnique) => {
          searchCount++;
          if (searchCount > MAX_BACKTRACK_SEARCH) {
            return; // 탐색 제한 초과
          }
          
          // 모든 조각을 배치했으면 점수 계산
          if (pieceIndex >= sortedTargetPieces.length) {
            const score = calculateScore(currentPlaced, board);
            if (score.totalScore > bestScore) {
              bestScore = score.totalScore;
              bestPlaced = [...currentPlaced];
            }
            return;
          }
          
          const piece = sortedTargetPieces[pieceIndex];
          
          // 유니크 제한 확인
          if (piece.rarity === '유니크' && usedUnique >= 1) {
            // 이 조각을 건너뛰기
            backtrack(pieceIndex + 1, currentPlaced, localUsedCells, usedUnique);
            return;
          }
          
          // 가능한 위치 찾기
          const possiblePositions = [];
          for (const { row, col } of openCells) {
            if (canPlacePiece(piece, row, col, localUsedCells)) {
              possiblePositions.push({ row, col });
            }
          }
          
          // 위치를 중앙에 가까운 순으로 정렬
          possiblePositions.sort((a, b) => {
            const distA = Math.abs(a.row - 3) + Math.abs(a.col - 3);
            const distB = Math.abs(b.row - 3) + Math.abs(b.col - 3);
            return distA - distB;
          });
          
          // 이 조각을 배치하지 않는 경우
          backtrack(pieceIndex + 1, currentPlaced, localUsedCells, usedUnique);
          
          // 이 조각을 배치하는 경우 (최대 2개 위치만 시도하여 성능 최적화)
          const maxPositions = Math.min(2, possiblePositions.length);
          for (let i = 0; i < maxPositions; i++) {
            if (searchCount > MAX_BACKTRACK_SEARCH) break;
            
            const { row, col } = possiblePositions[i];
            const newUsedCells = new Set(localUsedCells);
            const placedCells = placePiece(piece, row, col, newUsedCells);
            
            const newPlaced = [...currentPlaced, {
              ...piece,
              position: { row, col },
              placedCells,
            }];
            
            const newUsedUnique = usedUnique + (piece.rarity === '유니크' ? 1 : 0);
            backtrack(pieceIndex + 1, newPlaced, newUsedCells, newUsedUnique);
          }
        };
        
        const initialUsedCells = new Set();
        backtrack(0, [], initialUsedCells, 0);
        
        return bestPlaced;
      };
      
      // ===== 3단계: 분기 한정법 알고리즘 =====
      const solveWithBranchAndBound = () => {
        let bestResult = {
          placedPieces: [],
          score: { baseScore: 0, bonusScore: 0, totalScore: 0 },
        };
        
        // 현재 배치된 조각들의 속성별 칸 수 계산
        const getCurrentAttributeCounts = (placedPieces) => {
          const counts = {
            광휘: 0, 관통: 0, 원소: 0, 파쇄: 0,
            축복: 0, 낙인: 0, 재생: 0,
          };
          placedPieces.forEach(piece => {
            if (piece.size <= 5 && piece.attribute) {
              counts[piece.attribute] += piece.size;
            }
          });
          return counts;
        };
        
        // 상한(upper bound) 계산 함수
        const calculateUpperBound = (pieceIndex, currentPlaced, localUsedCells, usedUnique) => {
          const currentScore = calculateScore(currentPlaced, board);
          let upperBound = currentScore.totalScore;
          
          // 남은 조각들 중 가장 좋은 조각들을 배치했을 때의 최대 점수 추정
          const remainingPieces = sortedAllPieces.slice(pieceIndex);
          const remainingCells = new Set();
          for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
              if (board[row][col] === 1) {
                const cellKey = `${row}-${col}`;
                if (!localUsedCells.has(cellKey)) {
                  remainingCells.add(cellKey);
                }
              }
            }
          }
          
          const remainingCellCount = remainingCells.size;
          if (remainingCellCount === 0) {
            return upperBound;
          }
          
          // 남은 조각들을 점수 효율 순으로 정렬
          const pieceEfficiency = remainingPieces.map(piece => {
            const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
            return {
              piece,
              efficiency: pieceScore / piece.size,
              score: pieceScore,
              size: piece.size,
            };
          }).sort((a, b) => b.efficiency - a.efficiency);
          
          const currentAttrCounts = getCurrentAttributeCounts(currentPlaced);
          let estimatedBaseScore = currentScore.baseScore;
          let estimatedAttrCounts = { ...currentAttrCounts };
          let remainingUnique = usedUnique;
          let usedCellCount = 0;
          
          for (const { piece, score, size } of pieceEfficiency) {
            if (piece.rarity === '유니크' && remainingUnique >= 1) {
              continue;
            }
            if (usedCellCount + size > remainingCellCount) {
              continue;
            }
            if (piece.size <= 5 && piece.attribute) {
              const jobAttributes = JOB_ATTRIBUTES[job] || [];
              if (jobAttributes.includes(piece.attribute)) {
                const currentCount = estimatedAttrCounts[piece.attribute] || 0;
                if (currentCount >= 21) {
                  continue;
                }
              }
            }
            
            estimatedBaseScore += score;
            usedCellCount += size;
            if (piece.size <= 5 && piece.attribute) {
              estimatedAttrCounts[piece.attribute] = (estimatedAttrCounts[piece.attribute] || 0) + size;
            }
            if (piece.rarity === '유니크') {
              remainingUnique++;
            }
          }
          
          // 보너스 점수 추정
          let estimatedBonusScore = 0;
          Object.entries(estimatedAttrCounts).forEach(([attr, count]) => {
            const jobAttributes = JOB_ATTRIBUTES[job] || [];
            if (jobAttributes.includes(attr)) {
              if (count >= 9) estimatedBonusScore += 265;
              if (count >= 12) estimatedBonusScore += 265;
              if (count >= 15) estimatedBonusScore += 265;
              if (count >= 18) estimatedBonusScore += 265;
              if (count >= 21) estimatedBonusScore += 265;
            }
          });
          
          return estimatedBaseScore + estimatedBonusScore;
        };
        
        // 우선순위 큐 노드
        class Node {
          constructor(pieceIndex, placedPieces, usedCells, usedUnique, score) {
            this.pieceIndex = pieceIndex;
            this.placedPieces = placedPieces;
            this.usedCells = usedCells;
            this.usedUnique = usedUnique;
            this.score = score;
            this.upperBound = calculateUpperBound(pieceIndex, placedPieces, usedCells, usedUnique);
          }
        }
        
        // 우선순위 큐
        const priorityQueue = [];
        const pushNode = (node) => {
          priorityQueue.push(node);
          priorityQueue.sort((a, b) => b.upperBound - a.upperBound);
        };
        const popNode = () => priorityQueue.shift();
        
        // 초기 노드
        const initialUsedCells = new Set();
        const initialNode = new Node(0, [], initialUsedCells, 0, { baseScore: 0, bonusScore: 0, totalScore: 0 });
        pushNode(initialNode);
        
        let searchCount = 0;
        const MAX_SEARCH = 500000;
        
        // 분기 한정법 실행
        while (priorityQueue.length > 0 && searchCount < MAX_SEARCH) {
          searchCount++;
          const node = popNode();
          
          if (node.upperBound <= bestResult.score.totalScore) {
            continue;
          }
          
          if (node.pieceIndex >= sortedAllPieces.length) {
            const score = calculateScore(node.placedPieces, board);
            if (score.totalScore > bestResult.score.totalScore) {
              bestResult = {
                placedPieces: [...node.placedPieces],
                score,
              };
            }
            continue;
          }
          
          const piece = sortedAllPieces[node.pieceIndex];
          const currentAttrCounts = getCurrentAttributeCounts(node.placedPieces);
          
          if (piece.rarity === '유니크' && node.usedUnique >= 1) {
            const skipNode = new Node(
              node.pieceIndex + 1,
              [...node.placedPieces],
              new Set(node.usedCells),
              node.usedUnique,
              node.score
            );
            if (skipNode.upperBound > bestResult.score.totalScore) {
              pushNode(skipNode);
            }
            continue;
          }
          
          // 배치하지 않는 경우
          const skipNode = new Node(
            node.pieceIndex + 1,
            [...node.placedPieces],
            new Set(node.usedCells),
            node.usedUnique,
            node.score
          );
          if (skipNode.upperBound > bestResult.score.totalScore) {
            pushNode(skipNode);
          }
          
          // 배치하는 경우
          if (piece.shapeCoords) {
            let shouldSkipPiece = false;
            if (piece.size <= 5 && piece.attribute) {
              const jobAttributes = JOB_ATTRIBUTES[job] || [];
              if (jobAttributes.includes(piece.attribute)) {
                const currentCount = currentAttrCounts[piece.attribute] || 0;
                if (currentCount >= 21) {
                  shouldSkipPiece = true;
                }
              }
            }
            
            if (!shouldSkipPiece) {
              const possiblePositions = [];
              for (const { row, col } of openCells) {
                if (canPlacePiece(piece, row, col, node.usedCells)) {
                  possiblePositions.push({ row, col });
                }
              }
              
              possiblePositions.sort((a, b) => {
                const distA = Math.abs(a.row - 3) + Math.abs(a.col - 3);
                const distB = Math.abs(b.row - 3) + Math.abs(b.col - 3);
                return distA - distB;
              });
              
              const maxPositions = Math.min(3, possiblePositions.length);
              for (let i = 0; i < maxPositions; i++) {
                if (searchCount >= MAX_SEARCH) break;
                
                const { row, col } = possiblePositions[i];
                const newUsedCells = new Set(node.usedCells);
                const placedCells = placePiece(piece, row, col, newUsedCells);
                const newPlaced = [...node.placedPieces, {
                  ...piece,
                  position: { row, col },
                  placedCells,
                }];
                const testAttrCounts = getCurrentAttributeCounts(newPlaced);
                
                let canPlace = true;
                if (piece.size <= 5 && piece.attribute) {
                  const jobAttributes = JOB_ATTRIBUTES[job] || [];
                  if (jobAttributes.includes(piece.attribute)) {
                    const newCount = testAttrCounts[piece.attribute] || 0;
                    if (newCount > 21) {
                      canPlace = false;
                    }
                  }
                }
                
                if (canPlace) {
                  const newScore = calculateScore(newPlaced, board);
                  const newUsedUnique = node.usedUnique + (piece.rarity === '유니크' ? 1 : 0);
                  const placeNode = new Node(
                    node.pieceIndex + 1,
                    newPlaced,
                    newUsedCells,
                    newUsedUnique,
                    newScore
                  );
                  
                  if (placeNode.upperBound > bestResult.score.totalScore) {
                    pushNode(placeNode);
                  }
                }
              }
            }
          }
        }
        
        return bestResult;
      };
      
      // ===== 3단계: A* 알고리즘 (휴리스틱 기반) =====
      const solveWithAStar = () => {
        let bestResult = {
          placedPieces: [],
          score: { baseScore: 0, bonusScore: 0, totalScore: 0 },
        };
        
        // 현재 배치된 조각들의 속성별 칸 수 계산
        const getCurrentAttributeCounts = (placedPieces) => {
          const counts = {
            광휘: 0, 관통: 0, 원소: 0, 파쇄: 0,
            축복: 0, 낙인: 0, 재생: 0,
          };
          placedPieces.forEach(piece => {
            if (piece.size <= 5 && piece.attribute) {
              counts[piece.attribute] += piece.size;
            }
          });
          return counts;
        };
        
        // 휴리스틱 함수: 남은 조각들로 얻을 수 있는 최대 점수 추정
        const heuristic = (pieceIndex, currentPlaced, localUsedCells, usedUnique) => {
          const remainingPieces = sortedAllPieces.slice(pieceIndex);
          const remainingCells = new Set();
          for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
              if (board[row][col] === 1) {
                const cellKey = `${row}-${col}`;
                if (!localUsedCells.has(cellKey)) {
                  remainingCells.add(cellKey);
                }
              }
            }
          }
          
          const remainingCellCount = remainingCells.size;
          if (remainingCellCount === 0) return 0;
          
          // 남은 조각들을 점수 효율 순으로 정렬
          const pieceEfficiency = remainingPieces.map(piece => {
            const pieceScore = RARITY_SCORES[piece.rarity] * piece.size;
            return {
              piece,
              efficiency: pieceScore / piece.size,
              score: pieceScore,
              size: piece.size,
            };
          }).sort((a, b) => b.efficiency - a.efficiency);
          
          const currentAttrCounts = getCurrentAttributeCounts(currentPlaced);
          let estimatedBaseScore = 0;
          let estimatedAttrCounts = { ...currentAttrCounts };
          let remainingUnique = usedUnique;
          let usedCellCount = 0;
          
          for (const { piece, score, size } of pieceEfficiency) {
            if (piece.rarity === '유니크' && remainingUnique >= 1) continue;
            if (usedCellCount + size > remainingCellCount) continue;
            
            if (piece.size <= 5 && piece.attribute) {
              const jobAttributes = JOB_ATTRIBUTES[job] || [];
              if (jobAttributes.includes(piece.attribute)) {
                const currentCount = estimatedAttrCounts[piece.attribute] || 0;
                if (currentCount >= 21) continue;
              }
            }
            
            estimatedBaseScore += score;
            usedCellCount += size;
            if (piece.size <= 5 && piece.attribute) {
              estimatedAttrCounts[piece.attribute] = (estimatedAttrCounts[piece.attribute] || 0) + size;
            }
            if (piece.rarity === '유니크') {
              remainingUnique++;
            }
          }
          
          // 보너스 점수 추정
          let estimatedBonusScore = 0;
          Object.entries(estimatedAttrCounts).forEach(([attr, count]) => {
            const jobAttributes = JOB_ATTRIBUTES[job] || [];
            if (jobAttributes.includes(attr)) {
              if (count >= 9) estimatedBonusScore += 265;
              if (count >= 12) estimatedBonusScore += 265;
              if (count >= 15) estimatedBonusScore += 265;
              if (count >= 18) estimatedBonusScore += 265;
              if (count >= 21) estimatedBonusScore += 265;
            }
          });
          
          return estimatedBaseScore + estimatedBonusScore;
        };
        
        // A* 노드
        class AStarNode {
          constructor(pieceIndex, placedPieces, usedCells, usedUnique, score) {
            this.pieceIndex = pieceIndex;
            this.placedPieces = placedPieces;
            this.usedCells = usedCells;
            this.usedUnique = usedUnique;
            this.score = score;
            this.g = score.totalScore; // 실제 점수
            this.h = heuristic(pieceIndex, placedPieces, usedCells, usedUnique); // 휴리스틱
            this.f = this.g + this.h; // f = g + h
          }
        }
        
        // 우선순위 큐 (f 값이 큰 순, 최대 점수를 찾기 위해)
        // f = g + h (현재 점수 + 추정 남은 점수)
        const openSet = [];
        const pushNode = (node) => {
          openSet.push(node);
          openSet.sort((a, b) => {
            if (b.f !== a.f) return b.f - a.f; // f 값이 큰 순 (최대 점수 우선)
            return b.g - a.g; // 같으면 현재 점수(g)가 큰 순
          });
        };
        const popNode = () => openSet.shift();
        
        // 초기 노드
        const initialUsedCells = new Set();
        const initialNode = new AStarNode(0, [], initialUsedCells, 0, { baseScore: 0, bonusScore: 0, totalScore: 0 });
        pushNode(initialNode);
        
        let searchCount = 0;
        const MAX_SEARCH = 100000; // 탐색 제한 (더 빠르게)
        
        // A* 실행
        while (openSet.length > 0 && searchCount < MAX_SEARCH) {
          searchCount++;
          const node = popNode();
          
          // 모든 조각을 확인한 경우 (개수 제한 없음)
          if (node.pieceIndex >= sortedAllPieces.length) {
            const score = calculateScore(node.placedPieces, board);
            if (score.totalScore > bestResult.score.totalScore) {
              bestResult = {
                placedPieces: [...node.placedPieces],
                score,
              };
            }
            continue;
          }
          
          const piece = sortedAllPieces[node.pieceIndex];
          const currentAttrCounts = getCurrentAttributeCounts(node.placedPieces);
          
          // 유니크 제한 확인
          if (piece.rarity === '유니크' && node.usedUnique >= 1) {
            const skipNode = new AStarNode(
              node.pieceIndex + 1,
              [...node.placedPieces],
              new Set(node.usedCells),
              node.usedUnique,
              node.score
            );
            pushNode(skipNode);
            continue;
          }
          
          // 배치하지 않는 경우
          const skipNode = new AStarNode(
            node.pieceIndex + 1,
            [...node.placedPieces],
            new Set(node.usedCells),
            node.usedUnique,
            node.score
          );
          pushNode(skipNode);
          
          // 배치하는 경우
          if (piece.shapeCoords) {
            let shouldSkipPiece = false;
            if (piece.size <= 5 && piece.attribute) {
              const jobAttributes = JOB_ATTRIBUTES[job] || [];
              if (jobAttributes.includes(piece.attribute)) {
                const currentCount = currentAttrCounts[piece.attribute] || 0;
                if (currentCount >= 21) {
                  shouldSkipPiece = true;
                }
              }
            }
            
            if (!shouldSkipPiece) {
              const possiblePositions = [];
              for (const { row, col } of openCells) {
                if (canPlacePiece(piece, row, col, node.usedCells)) {
                  possiblePositions.push({ row, col });
                }
              }
              
              possiblePositions.sort((a, b) => {
                const distA = Math.abs(a.row - 3) + Math.abs(a.col - 3);
                const distB = Math.abs(b.row - 3) + Math.abs(b.col - 3);
                return distA - distB;
              });
              
              // 최대 2개 위치만 시도 (성능 최적화)
              const maxPositions = Math.min(2, possiblePositions.length);
              for (let i = 0; i < maxPositions; i++) {
                if (searchCount >= MAX_SEARCH) break;
                
                const { row, col } = possiblePositions[i];
                const newUsedCells = new Set(node.usedCells);
                const placedCells = placePiece(piece, row, col, newUsedCells);
                const newPlaced = [...node.placedPieces, {
                  ...piece,
                  position: { row, col },
                  placedCells,
                }];
                const testAttrCounts = getCurrentAttributeCounts(newPlaced);
                
                let canPlace = true;
                if (piece.size <= 5 && piece.attribute) {
                  const jobAttributes = JOB_ATTRIBUTES[job] || [];
                  if (jobAttributes.includes(piece.attribute)) {
                    const newCount = testAttrCounts[piece.attribute] || 0;
                    if (newCount > 21) {
                      canPlace = false;
                    }
                  }
                }
                
                if (canPlace) {
                  const newScore = calculateScore(newPlaced, board);
                  const newUsedUnique = node.usedUnique + (piece.rarity === '유니크' ? 1 : 0);
                  const placeNode = new AStarNode(
                    node.pieceIndex + 1,
                    newPlaced,
                    newUsedCells,
                    newUsedUnique,
                    newScore
                  );
                  pushNode(placeNode);
                }
              }
            }
          }
        }
        
        return bestResult;
      };
      
      // ===== 4단계: 알고리즘 실행 및 비교 =====
      console.log('A* 알고리즘 실행 중...');
      const aStarResult = solveWithAStar();
      aStarResult.usedCells = Array.from(new Set(aStarResult.placedPieces.flatMap(p => 
        p.placedCells.map(c => `${c.row}-${c.col}`)
      )));
      aStarResult.algorithm = 'A* (휴리스틱)';
      
      console.log('제한된 백트래킹 알고리즘 실행 중...');
      let backtrackingResult = {
        placedPieces: [],
        score: { baseScore: 0, bonusScore: 0, totalScore: 0 },
        usedCells: [],
        algorithm: '백트래킹',
      };
      
      // 목표 조합으로 제한된 백트래킹 시도 (최대 10회만)
      let currentPieces = [...target.pieces];
      let attemptCount = 0;
      const MAX_ATTEMPTS = 10; // 시도 횟수 대폭 감소
      
      while (attemptCount < MAX_ATTEMPTS && currentPieces.length > 0) {
        attemptCount++;
        const placedPieces = solveWithBacktracking(currentPieces);
        
        if (placedPieces.length > 0) {
          const score = calculateScore(placedPieces, board);
          
          if (score.totalScore > backtrackingResult.score.totalScore) {
            backtrackingResult = {
              placedPieces: placedPieces,
              score,
              usedCells: Array.from(new Set(placedPieces.flatMap(p => 
                p.placedCells.map(c => `${c.row}-${c.col}`)
              ))),
              algorithm: '백트래킹',
            };
            
            if (score.totalScore >= target.totalScore * 0.95) {
              console.log(`백트래킹: 목표 점수에 근접했습니다. (${score.totalScore}/${target.totalScore})`);
              break;
            }
          }
        }
        
        const currentScore = placedPieces.length > 0 ? calculateScore(placedPieces, board).totalScore : 0;
        const shouldRemovePiece = placedPieces.length < currentPieces.length || 
                                  currentScore < target.totalScore * 0.8;
        
        if (shouldRemovePiece && currentPieces.length > 1) {
          const sortedForRemoval = [...currentPieces].sort((a, b) => {
            const rarityOrder = { '유니크': 4, '슈퍼에픽': 3, '에픽': 2, '레어': 1 };
            const orderA = rarityOrder[a.rarity] || 0;
            const orderB = rarityOrder[b.rarity] || 0;
            if (orderA !== orderB) return orderA - orderB;
            return a.size - b.size;
          });
          
          const pieceToRemove = sortedForRemoval[0];
          if (pieceToRemove) {
            currentPieces = currentPieces.filter(p => p.id !== pieceToRemove.id);
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
      console.log(`A* 결과: ${aStarResult.score.totalScore}점`);
      console.log(`백트래킹 결과: ${backtrackingResult.score.totalScore}점`);
      
      // 두 결과 중 점수가 높은 것을 선택
      if (aStarResult.score.totalScore > backtrackingResult.score.totalScore) {
        bestResult = aStarResult;
        console.log('A* 알고리즘이 더 높은 점수를 달성했습니다.');
      } else {
        bestResult = backtrackingResult;
        console.log('백트래킹이 더 높은 점수를 달성했습니다.');
      }
      
      // 최종 결과가 없으면 빈 결과 반환
      if (bestResult.placedPieces.length === 0) {
        console.warn('퍼즐을 맞출 수 있는 조합을 찾지 못했습니다.');
      }
      
      setResult(bestResult);
      setIsCalculating(false);
    }, 100);
  };

  // 조각 크기별 사용 가능한 등급 가져오기
  const getAvailableRarities = (pieceSize) => {
    if (pieceSize === 8) {
      return ['유니크'];
    } else if (pieceSize === 5) {
      return ['슈퍼에픽'];
    } else if (pieceSize === 4) {
      return ['에픽', '슈퍼에픽'];
    } else if (pieceSize >= 1 && pieceSize <= 3) {
      return ['레어', '에픽', '슈퍼에픽'];
    }
    return ['레어', '에픽', '슈퍼에픽', '유니크'];
  };

  // 조각 모양 렌더링
  const renderShape = (shape2D, rarity, size = 20) => {
    return (
      <div style={{ display: 'inline-block', fontFamily: 'monospace' }}>
        {shape2D.map((row, rIdx) => (
          <div key={rIdx} style={{ lineHeight: 1, display: 'flex' }}>
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  margin: '1px',
                  background: cell === 1 ? (RARITY_COLORS[rarity] || '#5c7cc4') : 'transparent',
                  border: `1px solid ${cell === 1 ? RARITY_COLORS[rarity] : 'var(--border)'}`,
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  // 팝업 컴포넌트
  const Popup = ({ isOpen, onClose, title, children, maxWidth = '600px' }) => {
    if (!isOpen) return null;
    
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: maxWidth,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{title}</h2>
            <button
              className="btn"
              onClick={onClose}
              style={{ padding: '8px 12px', fontSize: '18px', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="container" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1.2fr', 
        gap: '20px',
        gridTemplateRows: 'auto 1fr'
      }}>
        {/* 상단: 역할군 선택 */}
        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h5" component="h2">역할군 선택</Typography>
            <IconButton
              onClick={() => setShowHelp(true)}
              color="primary"
              size="small"
            >
              <HelpOutline />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {['딜러', '스트라이커', '서포터'].map(j => (
              <Button
                key={j}
                variant={job === j ? 'contained' : 'outlined'}
                onClick={() => {
                  setJob(j);
                  // 역할군 변경 시 해당 역할군 섹션 초기화
                  const key = `역할군_${j}`;
                  if (!expandedAttributes[key]) {
                    setExpandedAttributes(prev => ({
                      ...prev,
                      [key]: true,
                    }));
                  }
                }}
                sx={{ flex: 1 }}
              >
                {j}
              </Button>
            ))}
          </Box>
        </section>

      {/* 왼쪽: 잊혀진 기억의 제단 */}
      <section className="panel">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h5" component="h2">잊혀진 기억의 제단</Typography>
          {/* 제단 조작 버튼 */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleClearResult}
              disabled={!result}
            >
              조각 제거
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenAll}
            >
              모두 열기
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCloseAll}
            >
              모두 닫기
            </Button>
          </Box>
        </Box>
        
        {/* 제단 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          padding: '12px',
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const cellKey = `${rowIdx}-${colIdx}`;
              const isInitial = INITIAL_OPEN_CELLS.has(cellKey);
              const isUsed = result?.usedCells.includes(cellKey);
              
              // 어떤 조각이 이 칸을 사용하는지 찾기
              const pieceInfo = result?.placedPieces.find(p => 
                p.placedCells?.some(c => c.row === rowIdx && c.col === colIdx)
              );
              
              // 같은 조각에 속한 인접 칸 확인
              const isSamePiece = (targetRow, targetCol, currentPiece) => {
                if (!currentPiece) return false;
                return currentPiece.placedCells?.some(c => c.row === targetRow && c.col === targetCol);
              };
              
              // 다른 조각이나 빈 공간인지 확인
              const isOtherPieceOrEmpty = (targetRow, targetCol) => {
                if (targetRow < 0 || targetRow >= 7 || targetCol < 0 || targetCol >= 7) return true;
                if (board[targetRow][targetCol] !== 1) return true; // 닫혀있는 칸
                
                const targetCellKey = `${targetRow}-${targetCol}`;
                const isTargetUsed = result?.usedCells.includes(targetCellKey);
                
                if (!isTargetUsed) return true; // 사용되지 않은 칸
                
                // 다른 조각인지 확인
                const targetPiece = result?.placedPieces.find(p => 
                  p.placedCells?.some(c => c.row === targetRow && c.col === targetCol)
                );
                
                return !pieceInfo || !targetPiece || pieceInfo.id !== targetPiece.id;
              };
              
              const currentPiece = pieceInfo;
              const topSame = isSamePiece(rowIdx - 1, colIdx, currentPiece);
              const bottomSame = isSamePiece(rowIdx + 1, colIdx, currentPiece);
              const leftSame = isSamePiece(rowIdx, colIdx - 1, currentPiece);
              const rightSame = isSamePiece(rowIdx, colIdx + 1, currentPiece);
              
              // border 스타일 결정
              const borderStyle = isInitial ? '#3b82f6' : 'var(--border)';
              const borderWidth = isUsed ? '8px' : '1px';
              // 속성별 테두리 색상 사용 (속성이 있으면 속성 색상, 없으면 기본 초록색)
              const attributeBorderColor = currentPiece?.attribute 
                ? (ATTRIBUTE_BORDER_COLORS[currentPiece.attribute] || '#62856F')
                : '#62856F';
              const borderColor = isUsed && currentPiece 
                ? attributeBorderColor // 속성별 색상으로 조각 경계 표시
                : borderStyle;
              
              // 스타일 객체 생성
              const cellStyle = {
                aspectRatio: '1/1',
                borderRadius: '6px',
                background: cell === 1
                  ? (isUsed ? (RARITY_COLORS[pieceInfo?.rarity] || RARITY_COLORS['에픽']) : '#1e293b')
                  : '#0b1220',
                cursor: isInitial ? 'default' : 'pointer',
                opacity: cell === 1 ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                position: 'relative',
                boxSizing: 'border-box',
              };
              
              // border 설정
              if (isUsed && currentPiece) {
                // 조각이 배치된 칸: 같은 조각이 아닌 방향에만 border
                // 다른 조각이나 빈 공간과의 경계에만 border 표시
                const topBorder = !topSame && isOtherPieceOrEmpty(rowIdx - 1, colIdx);
                const bottomBorder = !bottomSame && isOtherPieceOrEmpty(rowIdx + 1, colIdx);
                const leftBorder = !leftSame && isOtherPieceOrEmpty(rowIdx, colIdx - 1);
                const rightBorder = !rightSame && isOtherPieceOrEmpty(rowIdx, colIdx + 1);
                
                cellStyle.borderTop = topBorder ? `${borderWidth} solid ${borderColor}` : 'none';
                cellStyle.borderBottom = bottomBorder ? `${borderWidth} solid ${borderColor}` : 'none';
                cellStyle.borderLeft = leftBorder ? `${borderWidth} solid ${borderColor}` : 'none';
                cellStyle.borderRight = rightBorder ? `${borderWidth} solid ${borderColor}` : 'none';
              } else {
                // 사용되지 않은 칸: 기본 border
                cellStyle.border = `1px solid ${borderStyle}`;
              }
              
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  style={cellStyle}
                  title={
                    isInitial 
                      ? '초기 열려있는 칸 (닫을 수 없음)' 
                      : isUsed && pieceInfo
                        ? `${pieceInfo.rarity} · ${pieceInfo.attribute} (${pieceInfo.size}칸)`
                        : cell === 1 
                          ? '열려있음' 
                          : '닫혀있음'
                  }
                >
                  {cell === 0 ? (
                    <span style={{ 
                      fontSize: '16px',
                      opacity: 0.6,
                    }}>
                      🔒
                    </span>
                  ) : isUsed && pieceInfo && (
                    <span style={{ 
                      color: '#fff', 
                      fontWeight: 'bold',
                      textShadow: '0 0 2px rgba(0,0,0,0.8)',
                      fontSize: '8px',
                      lineHeight: 1,
                      textAlign: 'center',
                      wordBreak: 'keep-all',
                    }}>
                      {pieceInfo.attribute && pieceInfo.attribute.length <= 3 
                        ? pieceInfo.attribute 
                        : pieceInfo.attribute?.substring(0, 2)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 결과 표시 */}
        {result && (
          <Card sx={{ mt: 2.5 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
                조합 결과
              </Typography>
              <Typography variant="h4" sx={{ mb: 1.5, fontWeight: 'bold' }}>
                총 점수: {result.score.totalScore.toLocaleString()}점
              </Typography>
              {result.algorithm && (
                <Chip
                  label={`사용 알고리즘: ${result.algorithm}`}
                  color="primary"
                  size="small"
                  sx={{ mb: 1.5 }}
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                기본 점수: {result.score.baseScore.toLocaleString()}점
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                보너스 점수: {result.score.bonusScore.toLocaleString()}점
              </Typography>
              <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
                속성별 칸 수
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {ATTRIBUTES.map(attr => {
                  const count = result.score.attributeCounts?.[attr] || 0;
                  if (count === 0) return null;
                  const jobAttributes = JOB_ATTRIBUTES[job] || [];
                  const isMatching = jobAttributes.includes(attr);
                  return (
                    <Chip
                      key={attr}
                      label={`${attr}: ${count}칸`}
                      size="small"
                      color={isMatching ? 'primary' : 'default'}
                      sx={{ fontSize: '11px' }}
                    />
                  );
                })}
              </Box>
              {/* 유니크 조각 별도 표기 */}
              {result.placedPieces.filter(p => p.rarity === '유니크').length > 0 && (
                <>
                  <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    유니크 조각
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {result.placedPieces
                      .filter(p => p.rarity === '유니크')
                      .map((piece, idx) => (
                        <Chip
                          key={idx}
                          label={`${piece.attribute}: ${piece.size}칸`}
                          size="small"
                          color="warning"
                          sx={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                      ))}
                  </Box>
                </>
              )}
              <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
                배치된 설탕유리 조각: {result.placedPieces.length}개
              </Typography>
              <Box sx={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {result.placedPieces.map((piece, idx) => (
                  <Typography key={idx} variant="caption" color="text.secondary">
                    {piece.shape} ({piece.size}칸) - {piece.rarity} · {piece.attribute}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 오른쪽: 설탕유리 조각 정보 */}
      <section className="panel">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h5" component="h2">설탕유리 조각 설정</Typography>
          {/* 설탕유리 조각 모양 선택 버튼 */}
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setShowShapePopup(true)}
          >
            설탕유리 조각 모양 선택하기
          </Button>
        </Box>

        {/* 속성별 설탕유리 조각 목록 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="overline" color="text.secondary">
            소유한 설탕유리 조각 ({pieces.length}개)
          </Typography>
          {pieces.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Delete />}
              onClick={handleClearAllPieces}
            >
              전체 삭제
            </Button>
          )}
        </Box>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {/* 1~5칸 조각: 속성별로 표시 */}
          {ATTRIBUTES.map(attr => {
            const attrPieces = getPiecesByAttribute(attr).filter(p => p.size <= 5);
            // 빈 섹션은 접혀있을 때만 숨김
            if (attrPieces.length === 0 && !expandedAttributes[attr]) return null;
            
            return (
              <div key={attr} style={{ marginBottom: 8 }}>
                <div
                  onClick={() => toggleAttribute(attr)}
                  style={{
                    padding: '8px',
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: 14 }}>
                    {attr} ({attrPieces.length}개)
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {expandedAttributes[attr] ? '▼' : '▶'}
                  </span>
                </div>
                {expandedAttributes[attr] && (
                  <div style={{ 
                    marginTop: 4, 
                    padding: '8px',
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}>
                    {attrPieces.length === 0 ? (
                      <div className="label" style={{ textAlign: 'center', padding: '8px' }}>
                        설탕유리 조각이 없습니다
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '8px',
                      }}>
                        {attrPieces.map(piece => (
                          <div
                            key={piece.id}
                            className="card"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px',
                              gap: '4px',
                              position: 'relative',
                            }}
                          >
                            {renderShape(
                              getAvailableShapes(piece.size).find(s => s.name === piece.shape)?.shape || [[1]],
                              piece.rarity,
                              20
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Delete />}
                              onClick={() => handleRemovePiece(piece.id)}
                              fullWidth
                              sx={{ mt: 0.5 }}
                            >
                              삭제
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 8칸 조각: 역할군별로 표시 */}
          {pieces.filter(p => p.size === 8).length > 0 && (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <div
                onClick={() => {
                  const key = `역할군_${job}`;
                  setExpandedAttributes(prev => ({
                    ...prev,
                    [key]: !prev[key],
                  }));
                }}
                style={{
                  padding: '8px',
                  background: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>
                  {job} (8칸) ({pieces.filter(p => p.size === 8 && p.attribute === job).length}개)
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {expandedAttributes[`역할군_${job}`] ? '▼' : '▶'}
                </span>
              </div>
              {expandedAttributes[`역할군_${job}`] && (
                <div style={{ 
                  marginTop: 4, 
                  padding: '8px',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}>
                  {pieces.filter(p => p.size === 8 && p.attribute === job).length === 0 ? (
                    <div className="label" style={{ textAlign: 'center', padding: '8px' }}>
                      조각이 없습니다
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '8px',
                    }}>
                      {pieces.filter(p => p.size === 8 && p.attribute === job).map(piece => (
                        <div
                          key={piece.id}
                          className="card"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            gap: '4px',
                            position: 'relative',
                          }}
                        >
                          {renderShape(
                            getAvailableShapes(8).find(s => s.name === piece.shape)?.shape || [[1]],
                            piece.rarity,
                            18
                          )}
                          <button
                            className="btn"
                            onClick={() => handleRemovePiece(piece.id)}
                            style={{ padding: '4px 8px', fontSize: 10, width: '100%' }}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 조합 버튼 */}
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={findBestCombination}
          disabled={pieces.length === 0 || isCalculating}
          sx={{ mt: 2.5, py: 1.75 }}
        >
          {isCalculating ? '계산 중...' : '잊혀진 기억의 제단 최적화'}
        </Button>
      </section>

      {/* 설탕유리 조각 모양 선택 팝업 */}
      <Dialog
        open={showShapePopup}
        onClose={() => setShowShapePopup(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              maxHeight: '80vh',
              background: 'rgba(17, 24, 39, 0.95)',
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">설탕유리 조각 모양 선택</Typography>
          <IconButton
            onClick={() => setShowShapePopup(false)}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
        }}>
          {/* 등급 선택 및 속성 선택 (좌우 배치) */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 2, 
            mb: 2, 
            flexShrink: 0,
            marginBottom: 1,
            marginTop: 1
          }}>
            {/* 등급 선택 (드랍박스) */}
            <FormControl fullWidth>
              <InputLabel>등급 선택</InputLabel>
              <Select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                label="등급 선택"
              >
                {['레어', '에픽', '슈퍼에픽', '유니크'].map(rarity => (
                  <MenuItem key={rarity} value={rarity}>{rarity}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                설탕유리 조각 크기에 따라 사용 가능한 등급이 달라집니다
              </Typography>
            </FormControl>

            {/* 속성 선택 (드랍박스) */}
            <FormControl fullWidth>
              <InputLabel>속성 선택</InputLabel>
              <Select
                value={selectedAttribute}
                onChange={(e) => setSelectedAttribute(e.target.value)}
                label="속성 선택"
              >
                {ATTRIBUTES.map(attr => (
                  <MenuItem key={attr} value={attr}>{attr}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 구분선 */}
          <Divider sx={{ mb: 2, flexShrink: 0 }} />

          {/* 설탕유리 조각 선택 영역 (스크롤 가능) */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}>

          {/* 선택한 등급에 따라 표시할 조각 크기 결정 */}
          {(() => {
            let sizesToShow = [];
            
            if (selectedRarity === '레어') {
              // 레어: 1~3칸만
              sizesToShow = [1, 2, 3];
            } else if (selectedRarity === '에픽') {
              // 에픽: 1~4칸
              sizesToShow = [1, 2, 3, 4];
            } else if (selectedRarity === '슈퍼에픽') {
              // 슈퍼에픽: 1~5칸
              sizesToShow = [1, 2, 3, 4, 5];
            } else if (selectedRarity === '유니크') {
              // 유니크: 8칸만
              sizesToShow = [8];
            } else {
              sizesToShow = [1, 2, 3, 4, 5, 8];
            }

            return (
              <>
                {/* 1~5칸 조각 */}
                {sizesToShow.filter(size => size <= 5).map(size => {
                  const availableRarities = getAvailableRarities(size);
                  // 선택한 등급이 이 크기에서 사용 가능한지 확인
                  if (!availableRarities.includes(selectedRarity)) {
                    return null;
                  }
                  
                  return (
                    <div key={size} style={{ marginBottom: 24 }}>
                      <div className="label" style={{ marginBottom: 12, fontWeight: 'bold', fontSize: '14px' }}>
                        {size}칸
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                        gap: '12px' 
                      }}>
                        {getAvailableShapes(size).map((shape, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleAddPiece(size, idx, selectedRarity, selectedAttribute);
                            }}
                            style={{
                              padding: '12px',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: 'var(--panel-2)',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--panel)';
                              e.currentTarget.style.borderColor = RARITY_COLORS[selectedRarity];
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--panel-2)';
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {renderShape(shape.shape, selectedRarity, 20)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* 8칸 조각 (유니크만) - 현재 역할군 + 전 역할군 조각 표시 */}
                {sizesToShow.includes(8) && (
                  <div style={{ marginTop: sizesToShow.filter(s => s <= 5).length > 0 ? 20 : 0 }}>
                    <div className="label" style={{ marginBottom: 12, fontWeight: 'bold', fontSize: '14px' }}>
                      8칸 설탕유리 조각 (유니크) - {job} 역할군 + 전 역할군
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {getAvailableShapes(8).map((shape, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            handleAddPiece(8, idx, '유니크', job);
                          }}
                          style={{
                            padding: '12px',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'var(--panel-2)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--panel)';
                            e.currentTarget.style.borderColor = RARITY_COLORS['유니크'];
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--panel-2)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {renderShape(shape.shape, '유니크', 16)}
                          <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
                            {shape.name}
                          </div>
                          <div style={{ fontSize: 9, color: RARITY_COLORS['유니크'], fontWeight: 'bold' }}>
                            유니크
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* 도움말 Dialog */}
      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">사용 방법</Typography>
          <IconButton
            onClick={() => setShowHelp(false)}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 기본 사용법 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                1. 기본 사용법
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>역할군 선택</strong>: 딜러, 스트라이커, 서포터 중 하나를 선택합니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>잊혀진 기억의 제단</strong>: 닫혀있는 칸(🔒)을 클릭하여 열 수 있습니다. 인접한 열려있는 칸이 있어야 열 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>설탕유리 조각 추가</strong>: "설탕유리 조각 모양 선택하기" 버튼을 클릭하여 조각을 추가합니다.
              </Typography>
            </Box>

            <Divider />

            {/* 조각 추가 방법 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                2. 설탕유리 조각 추가 방법
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 팝업에서 <strong>등급</strong>과 <strong>속성</strong>을 선택합니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 원하는 조각 모양을 클릭하면 조각이 추가됩니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 조각은 자동으로 localStorage에 저장되어 다음에 접속해도 유지됩니다.
              </Typography>
            </Box>

            <Divider />

            {/* 점수 계산 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                3. 점수 계산 방식
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>기본 점수</strong>: 등급별 칸당 점수 × 조각 크기
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>보너스 점수</strong>: 역할군과 일치하는 속성의 칸수가 9, 12, 15, 18, 21칸 이상일 때 각각 265점씩 추가
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 예시: 스트라이커 기준 원소 21칸 → 5개 보너스 (1,325점), 파쇄 9칸 → 1개 보너스 (265점)
              </Typography>
            </Box>

            <Divider />

            {/* 조각 제한 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                4. 조각 사용 제한
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>유니크 조각</strong>: 최대 1개만 사용 가능
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>그 외 등급 조각</strong>: 총 17개까지 사용 가능
              </Typography>
            </Box>

            <Divider />

            {/* 최적화 기능 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                5. 최적화 기능
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • "잊혀진 기억의 제단 최적화" 버튼을 클릭하면 최고 점수를 얻을 수 있는 조합을 자동으로 찾습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 최적화 결과는 제단에 색상으로 표시되며, "조각 제거" 버튼으로 초기화할 수 있습니다.
              </Typography>
            </Box>

            <Divider />

            {/* 기타 기능 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                6. 기타 기능
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>모두 열기/닫기</strong>: 제단의 모든 칸을 한 번에 열거나 닫을 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • <strong>전체 삭제</strong>: 모든 설탕유리 조각을 한 번에 삭제할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 조각 정보는 브라우저에 자동 저장되어 다음에 접속해도 유지됩니다.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </main>
    </ThemeProvider>
  );
}

export default PuzzlePage;

