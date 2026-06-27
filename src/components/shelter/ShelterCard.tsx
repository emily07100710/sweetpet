import { MapPin, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Shelter } from "./data";

export function ShelterCard({
  shelter,
  matchReason,
  onPack,
}: {
  shelter: Shelter;
  matchReason?: string;
  onPack: (s: Shelter) => void;
}) {
  return (
    <Card className="flex flex-col border-border bg-card transition-shadow hover:shadow-warm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {shelter.city}
          </span>
        </div>
        <h3 className="font-display text-xl leading-snug text-foreground">{shelter.name}</h3>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
          <span>{shelter.address}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {matchReason ? (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm leading-relaxed text-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI 語意推論理由
            </div>
            <p>{matchReason}</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              急缺物資
            </p>
            <div className="flex flex-wrap gap-2">
              {shelter.needs.map((n) => (
                <Badge key={n} variant="secondary" className="bg-accent text-accent-foreground">
                  {n}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onPack(shelter)} className="w-full" variant="default">
          <Package className="mr-2 h-4 w-4" />
          生成物資寄送打包單
        </Button>
      </CardFooter>
    </Card>
  );
}
