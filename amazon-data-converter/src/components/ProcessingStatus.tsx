"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default function ProcessingStatus() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    // Simulate processing steps
    const timer = setTimeout(() => {
      if (progress < 100) {
        const newProgress = progress + 1;
        setProgress(newProgress);
        
        // Update current step based on progress
        if (newProgress > 33 && newProgress <= 66) {
          setCurrentStep(2);
        } else if (newProgress > 66) {
          setCurrentStep(3);
        }
        
        // Redirect to download page when complete
        if (newProgress >= 100) {
          setTimeout(() => {
            router.push("/download");
          }, 500);
        }
      }
    }, 50); // Update every 50ms for a total of ~5 seconds

    return () => clearTimeout(timer);
  }, [progress, router]);

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>処理ステップ</span>
          <span>OCR → 構造化 → マッチング</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="space-y-4">
        <div className={`border rounded-lg p-4 bg-gray-50 ${currentStep === 1 ? "" : "opacity-50"}`}>
          <h3 className="font-medium text-sm mb-2">
            {currentStep === 1 ? "現在の処理:" : "完了:"}
          </h3>
          <p className="text-sm text-gray-600">
            <span className="font-bold">① OCR処理</span> - 商品データからテキスト情報を抽出しています
          </p>
        </div>
        
        <div className={`border rounded-lg p-4 bg-gray-50 ${currentStep === 2 ? "" : "opacity-50"}`}>
          <h3 className="font-medium text-sm mb-2">
            {currentStep === 2 ? "現在の処理:" : currentStep > 2 ? "完了:" : "次のステップ:"}
          </h3>
          <p className="text-sm text-gray-600">
            <span className="font-bold">② データ構造化</span> - 抽出したデータを整理します
          </p>
        </div>
        
        <div className={`border rounded-lg p-4 bg-gray-50 ${currentStep === 3 ? "" : "opacity-50"}`}>
          <h3 className="font-medium text-sm mb-2">
            {currentStep === 3 ? "現在の処理:" : "最終ステップ:"}
          </h3>
          <p className="text-sm text-gray-600">
            <span className="font-bold">③ Amazonフォーマットへの変換</span> - データをAmazon形式に変換します
          </p>
        </div>
      </div>
    </div>
  );
}
