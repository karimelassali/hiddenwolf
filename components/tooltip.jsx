"use client";
import React from "react";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

export function AnimatedTooltipPeople({ people }) {
  return (
    <div className="flex flex-row items-center justify-center mb-10 w-full">
      <AnimatedTooltip items={people} />
    </div>
  );
}
