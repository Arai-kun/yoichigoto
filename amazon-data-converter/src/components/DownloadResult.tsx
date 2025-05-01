"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function DownloadResult() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    reviewItems: 0,
  });

  useEffect(() => {
    // In a real app, we would fetch this data from the server
    // For demo purposes, we'll use random numbers
    setStats({
      totalProducts: Math.floor(Math.random() * 50) + 10, // 10-60 products
      reviewItems: Math.floor(Math.random() * 10) + 1, // 1-10 review items
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">処理結果サマリー:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>処理した商品数:</div>
          <div className="font-medium">{stats.totalProducts} 件</div>
          <div>要確認項目:</div>
          <div className="font-medium text-amber-600">{stats.reviewItems} 件</div>
        </div>
      </div>

      {stats.reviewItems > 0 && (
        <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertTitle className="text-amber-800">確認が必要な項目があります</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            カテゴリマッチングの確信度が低い項目や、規約に違反している可能性のある項目が赤色でマークされています。
            ダウンロードしたExcelファイルを確認してください。
          </AlertDescription>
        </Alert>
      )}

      <Button className="w-full flex items-center justify-center gap-2" asChild>
        <Link href="/api/download">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Amazon形式のExcelファイルをダウンロード
        </Link>
      </Button>
    </div>
  );
}
