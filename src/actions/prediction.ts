"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Formation } from "@/lib/bet-logic";

export async function publishPrediction(data: {
    title: string;
    commentary: string;
    price: number;
    placeName: string;
    raceNumber: number;
    raceDate: Date;
    deadlineAt: Date;
    cartData: Formation[];
    isPrivate?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to publish a prediction.");
    }

    // Ensure cart is not empty
    if (data.cartData.length === 0) {
        throw new Error("Cart is empty. Please add selections before publishing.");
    }

    // Deadline Guard
    if (new Date(data.deadlineAt) < new Date()) {
        throw new Error("締切時刻を過ぎたレースの予想は公開できません。");
    }

    // Convert cart to JSON string for SQLite
    const predictedNumbersStr = JSON.stringify(data.cartData);

    const prediction = await prisma.prediction.create({
        data: {
            title: data.title,
            commentary: data.commentary,
            price: data.price,
            predictedNumbers: predictedNumbersStr,
            authorId: session.user.id,
            placeName: data.placeName,
            raceNumber: data.raceNumber,
            raceDate: data.raceDate,
            deadlineAt: data.deadlineAt,
            isPrivate: data.isPrivate || false,
        },
    });

    // Redirect to the newly created prediction page
    redirect(`/predictions/${prediction.id}`);
}
