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
    author: {
        name: string | null;
        role: string;
    } | null;
    _count?: {
        transactions: number;
    };
};
