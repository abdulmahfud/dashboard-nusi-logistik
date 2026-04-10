import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefix?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  className,
  disabled = false,
  prefix = "Rp",
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Format number with thousands separator
  const formatNumber = (num: string) => {
    // Remove any non-digit characters
    const cleanNumber = num.replace(/\D/g, "");

    if (cleanNumber === "") return "";

    // Add thousands separator
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Remove formatting to get raw number
  const parseNumber = (formatted: string) => {
    return formatted.replace(/\./g, "");
  };

  // Update display value when prop value changes
  useEffect(() => {
    const next = formatNumber(value);
    setDisplayValue((prev) => (prev === next ? prev : next));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove any non-digit characters except dots
    const cleanInput = inputValue.replace(/[^\d.]/g, "");

    // Get the raw number without formatting
    const rawNumber = parseNumber(cleanInput);

    // Format for display
    const formatted = formatNumber(rawNumber);

    // Update display
    setDisplayValue(formatted);

    // Send raw number to parent
    onChange(rawNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      [8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey) ||
      (e.keyCode === 67 && e.ctrlKey) ||
      (e.keyCode === 86 && e.ctrlKey) ||
      (e.keyCode === 88 && e.ctrlKey)
    ) {
      return;
    }

    // Ensure that it is a number and stop the keypress
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-600">
        {prefix}
      </div>
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-10", className)}
        autoComplete="off"
      />
    </div>
  );
}
