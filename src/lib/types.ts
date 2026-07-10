/**
 * 共通型定義
 * 各コンポーネント間で受け渡す Prisma ベースの型を集約
 */

import type { Prediction } from "@prisma/client";

/** TimelineCard / MarketFeed に渡される予想情報 */
export type TimelineCardPrediction = Pick<
    Prediction,
    | "id"
    | "title"
    | "price"
    | "placeName"
    | "raceNumber"
    | "isPrivate"
    | "publishType"
    | "externalUrl"
    | "betsPublic"
    | "viewCount"
    | "isSettled"
    | "isHit"
    | "refundAmount"
    | "createdAt"
    | "authorId"
    | "raceDate"
    | "deadlineAt"
> & {
    /** 見解・分析（commentary）が書かれているか。本文はアンロック制のため一覧には旗だけ渡す */
    hasCommentary?: boolean;
    /** 投稿者の星評価（0件のときは null） */
    authorRating?: { avg: number; count: number } | null;
    author: {
        name: string | null;
        role: string;
    } | null;
    _count?: {
        transactions: number;
    };
};
