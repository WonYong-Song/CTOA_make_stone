# 보드 게임 시뮬레이터 (GitHub Pages 배포 안내)

이 저장소는 `GAME_RULES.md` 규칙을 따르는 Vite + React 앱입니다. GitHub Pages에서 동작하도록 `vite.config.js`에 `base: './'`을 설정했습니다.

## 파일 구조

- `index.html`: Vite 진입 HTML (`/src/main.jsx` 로드)
- `GAME_RULES.md`: 게임 규칙 문서
- `README.md`: 배포 및 사용 안내
- `src/`: React 컴포넌트와 로직
  - `src/App.jsx`, `src/main.jsx`, `src/game.js`, `src/styles.css`
  - 게임 화면 + 확률 계산 페이지(토글)

## 로컬에서 열기

- 코드 에디터에서 `index.html`을 더블 클릭하거나, 정적 서버로 서빙합니다.
- macOS: Finder에서 `index.html` 열기 또는 아래 명령 사용:

```bash
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080/index.html
```

## GitHub Pages 배포

### gh-pages를 사용한 배포 (권장)

1. GitHub에 새 저장소를 만든 뒤, 현재 프로젝트를 푸시합니다.

```bash
git init
git add .
git commit -m "init: board game simulator"
git branch -M main
git remote add origin git@github.com:<YOUR_ID>/<REPO>.git
git push -u origin main
```

2. 의존성 설치 및 배포:

```bash
npm install
npm run deploy
```

`npm run deploy` 명령은 다음을 수행합니다:
- `predeploy` 스크립트가 자동으로 실행되어 `npm run build`를 실행합니다.
- 빌드된 `dist` 폴더의 내용이 `gh-pages` 브랜치에 자동으로 푸시됩니다.

3. GitHub 웹에서 Settings → Pages로 이동합니다.
- Source: `Deploy from a branch` 선택
- Branch: `gh-pages` 선택
- Folder: `/ (root)` 선택
- Save 클릭

4. 배포 완료 후 몇 분 후에 `https://<YOUR_ID>.github.io/<REPO>/`에서 사이트를 확인할 수 있습니다.

**참고**: 
- `package.json`의 `homepage` 필드에 올바른 GitHub Pages URL이 설정되어 있어야 합니다.
- 이후 코드를 수정하고 배포하려면 다시 `npm run deploy`를 실행하면 됩니다.

### 수동 배포 (대안)

직접 배포하고 싶다면:

```bash
npm i
npm run build
# dist 폴더의 내용을 gh-pages 브랜치에 수동으로 푸시
```

## 커스터마이즈

- 보상 모드: `src/game.js`의 `REWARD_MODES` 수정
- 스타일: `src/styles.css` 수정
- 기능 확장: `src/game.js`/`src/App.jsx` 확장

## 브라우저 호환성

- 최신 Chrome/Edge/Firefox/Safari 권장
- 네트워크 환경에서 `unpkg.com`에 접근 가능해야 합니다.

---

MIT License

