import { Check, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import type { University } from "@/types/university";

export function UniversityCompareButton({
  university,
}: {
  university: University;
}) {
  const { add, remove, contains } = useCompare();
  const [limit, setLimit] = useState(false);
  const selected = contains(university.id);
  function toggle() {
    setLimit(false);
    if (selected) remove(university.id);
    else if (!add(university.id)) setLimit(true);
  }
  return (
    <div>
      <Button
        type="button"
        className="w-full"
        variant={selected ? "secondary" : "outline"}
        onClick={toggle}
      >
        {selected ? <Check /> : <GitCompareArrows />}
        {selected ? "Added to Compare" : "Add to Compare"}
      </Button>
      {limit && (
        <p className="mt-1 text-xs text-destructive">
          Remove one of the 3 selected universities first.
        </p>
      )}
    </div>
  );
}
