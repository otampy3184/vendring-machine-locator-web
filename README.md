# VendingMachine Locator Web

VendingMachine Locator (自販機まっぷ) のWebアプリケーション版です。

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.x
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Testing**: Jest + React Testing Library

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.local.example`をコピーして`.env.local`を作成し、必要な値を設定してください。

```bash
cp .env.local.example .env.local
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

## テスト

### ユニットテストの実行
```bash
npm test
```

### テストのウォッチモード
```bash
npm run test:watch
```

### カバレッジレポート
```bash
npm run test:coverage
```

## 開発状況

現在、フロントエンド実装が完了し、MVPレベルの機能が動作する状態になりました。バックエンドサービス、ビジネスロジック、UIコンポーネントすべての実装が完了しています。

### 実装済み
- ✅ プロジェクト構造
- ✅ TypeScript設定
- ✅ Jest設定
- ✅ 全ユニットテスト（143個、96.5%合格）
- ✅ Firebase設定・初期化
- ✅ 認証サービス（AuthService）- Google認証対応
- ✅ Firestoreサービス（VendingMachineService）- CRUD操作
- ✅ 画像サービス（ImageService）- アップロード、EXIF抽出
- ✅ 位置情報サービス（LocationService）- 現在地取得、距離計算
- ✅ ユーティリティ関数（距離計算、バリデーション）
- ✅ カスタムフック（useAuth、useMachines）
- ✅ UIコンポーネント
  - ✅ レイアウト・ナビゲーション
  - ✅ Google Maps統合（@googlemaps/js-api-loader使用）
  - ✅ 自動販売機マーカー表示
  - ✅ 自動販売機追加フォーム
  - ✅ フィルターパネル
  - ✅ 詳細カード
  - ✅ 認証ボタン
  - ✅ ローディング・エラー表示
- ✅ ページ実装（ホームページ）
- ✅ レスポンシブデザイン

### 主な機能
- 🗺️ Google Maps上での自動販売機位置表示
- 📍 現在地の取得と距離計算
- ➕ 認証済みユーザーによる自動販売機の追加
- 🏷️ 種類・稼働状態によるフィルタリング
- 📷 画像アップロード（EXIF位置情報抽出対応）
- 🗑️ 自動販売機の削除
- 📱 モバイル対応レスポンシブデザイン

### 技術的な特徴
- Next.js 14 App Routerを使用
- Google Maps APIの完全統合
- Firebase Authentication/Firestore/Storage連携
- TypeScriptによる型安全性
- TailwindCSSによるスタイリング

### 未実装
- ❌ 統合テスト
- ❌ E2Eテスト
- ❌ PWA対応
- ❌ オフライン機能

### テスト結果
```
Test Suites: 1 failed, 7 passed, 8 total
Tests:       5 failed, 138 passed, 143 total
```

## ビルド

### プロダクションビルド
```bash
npm run build
```

### プロダクションサーバーの起動
```bash
npm start
```

## デプロイ

### Vercel
```bash
vercel
```

### Firebase Hosting
```bash
firebase deploy
```