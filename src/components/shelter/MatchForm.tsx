import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TAIWAN_CITIES } from "./data";

type Props = {
  description: string;
  city: string;
  onDescriptionChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onMatch: () => void;
  loading: boolean;
};

export function MatchForm({
  description, city, onDescriptionChange, onCityChange, onMatch, loading,
}: Props) {
  return (
    <section id="match" className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-warm md:p-12">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            開始智能媒合
          </h2>
          <p className="mt-3 text-muted-foreground">
            描述您的物資，選擇所在縣市，AI 將為您推薦最急需的收容所。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_240px]">
          <div className="space-y-2">
            <Label htmlFor="goods" className="text-sm font-medium">
              物資描述
            </Label>
            <Textarea
              id="goods"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="請描述您想捐贈的物資，例如無穀貓飼料或舊毛巾"
              rows={5}
              className="resize-none border-border bg-background text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              所在縣市
            </Label>
            <Select value={city} onValueChange={onCityChange}>
              <SelectTrigger id="city" className="h-11 bg-background">
                <SelectValue placeholder="請選擇縣市" />
              </SelectTrigger>
              <SelectContent>
                {TAIWAN_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onMatch}
              disabled={loading}
              size="lg"
              className="mt-4 h-12 w-full text-base font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "媒合中…" : "AI 智能媒合"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
