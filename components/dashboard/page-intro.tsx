import type { ReactNode } from "react";

type PageIntroProps = {
  description: string;
  action?: ReactNode;
};

export function PageIntro({ description, action }: PageIntroProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
