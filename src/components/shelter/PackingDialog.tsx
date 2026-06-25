import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Shelter } from "./data";

type Props = {
  shelter: Shelter | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function PackingDialog({ shelter, open, onOpenChange }: Props) {
  if (!shelter) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl print-area">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">物資捐贈打包明細單</DialogTitle>
          <DialogDescription>
            請列印此明細單並黏貼於包裹外箱，方便收容所辨識。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="rounded-xl border border-border bg-secondary/40 p-5">
            <h4 className="mb-3 text-sm font-semibold text-primary">收件資訊</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-muted-foreground">收件單位</dt>
                <dd className="font-medium text-foreground">{shelter.name}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-muted-foreground">收件地址</dt>
                <dd className="text-foreground">{shelter.address}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-muted-foreground">聯絡電話</dt>
                <dd className="text-foreground">{shelter.phone}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-muted-foreground">急缺物資</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {shelter.needs.map((n) => (
                    <Badge key={n} variant="outline">{n}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-dashed border-border p-5">
            <h4 className="mb-3 text-sm font-semibold text-primary">寄件人資訊</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sender-name">姓名</Label>
                <Input id="sender-name" placeholder="" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sender-phone">電話</Label>
                <Input id="sender-phone" placeholder="" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="sender-address">寄件地址</Label>
                <Input id="sender-address" placeholder="" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="sender-note">備註（物資內容、數量等）</Label>
                <Textarea id="sender-note" rows={3} placeholder="" />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            列印此明細單
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
