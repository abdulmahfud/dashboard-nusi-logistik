"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadOrderLabel } from "@/lib/apiClient";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { AxiosError } from "axios";

interface PrintLabelButtonProps {
  orderId: number;
  className?: string;
}

export function PrintLabelButton({
  orderId,
  className,
}: PrintLabelButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePrintLabel = async () => {
    if (!orderId) {
      toast.error("Order ID not found");
      return;
    }

    try {
      setIsLoading(true);
      const blob = await downloadOrderLabel(orderId);

      // Create a blob URL and open in new tab
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Label opened successfully!");
    } catch (error: unknown) {
      console.error("Error downloading label:", error);
      let errorMessage = "Failed to download label";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response?.data === "string") {
          errorMessage = error.response.data;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePrintLabel}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-1" />
          Cetak Resi
        </>
      )}
    </Button>
  );
}
