export interface PlanItem {
  readonly srcAbs: string;
  readonly outAbs: string;
  readonly action: "write" | "copy";
  readonly renderedContent?: string;
}

export interface BuildPlanResult {
  readonly items: PlanItem[];
}
