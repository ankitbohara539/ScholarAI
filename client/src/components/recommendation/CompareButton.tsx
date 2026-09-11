import { Check, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import type { RecommendationItem } from "@/types/recommendation";

export function CompareButton({ item }: { item: RecommendationItem }) {
  const { add, remove, contains } = useCompare();
  const [limit, setLimit] = useState(false);
  const selected = contains(item.university.id);
  function toggle() {
    setLimit(false);
    if (selected) remove(item.university.id);
    else if (!add(item.university.id)) setLimit(true);
  }
  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant={selected ? "secondary" : "outline"}
        onClick={toggle}
      >
        {selected ? <Check /> : <GitCompareArrows />}
        {selected ? "Added" : "Add to Compare"}
      </Button>
      {limit && (
        <p className="mt-1 text-xs text-destructive">
          You can compare up to 3 universities.
        </p>
      )}
    </div>
  );
}
