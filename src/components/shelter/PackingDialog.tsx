import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Shelter } from "./data";

type Props = {
  shelter: Shelter | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

const THANK_YOU_MESSAGE =
  "親愛的收容所團隊，感謝您們在第一線為流浪動物的付出。這是一點微薄的心意，希望能為毛孩們帶來溫暖。";
const TAIPEI_DONATION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfqycFMOSkh1ISzgknfWHV4egbFNRAxix7AGRA8ddv9rqX6lw/viewform";

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|\s]+/g, "_");
}

export function PackingDialog({ shelter, open, onOpenChange }: Props) {
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [donorName, setDonorName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [donationItems, setDonationItems] = useState("");
  const [notes, setNotes] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!shelter) {
      return;
    }

    setDonorName("");
    setContactPhone("");
    setDonationItems(shelter.needs.join("、"));
    setNotes("");
    setExportError(null);
  }, [open, shelter]);

  if (!shelter) return null;

  const handleExportPdf = async () => {
    if (!pdfRef.current) {
      setExportError("PDF 內容尚未準備完成，請再試一次。");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      await document.fonts?.ready;
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("PDF canvas is empty.");
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`愛心捐贈明細_${sanitizeFileName(shelter.name)}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF", error);
      setExportError("PDF 匯出失敗，請重新整理頁面後再試一次。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">愛心捐贈明細與心意卡</DialogTitle>
          <DialogDescription>
            請填寫捐贈人資訊，系統將直接幫您匯出成 PDF，方便放入物資箱內。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {shelter.city === "台北市" || shelter.city === "臺北市" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">臺北市合規提醒</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                臺北市寄送前請先確認是否符合動保處捐贈規範，必要時請完成線上申報。
              </p>
              <a
                href={TAIPEI_DONATION_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-sm font-medium text-red-700 underline underline-offset-4 dark:text-red-300"
              >
                🔗 點此填寫臺北市動保處線上捐贈表單
              </a>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="donor-name">捐贈人姓名</Label>
            <Input
              id="donor-name"
              value={donorName}
              onChange={(event) => setDonorName(event.target.value)}
              placeholder="例：林小花"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="donor-phone">聯絡電話</Label>
            <Input
              id="donor-phone"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="例：0912-345-678"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="donation-items">捐贈物資內容</Label>
            <Textarea
              id="donation-items"
              rows={5}
              value={donationItems}
              onChange={(event) => setDonationItems(event.target.value)}
              placeholder="請輸入捐贈物資內容"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="donation-notes">給收容所的備註</Label>
            <Textarea
              id="donation-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="例如：請幫我開立捐物收據或感謝狀，以茲證明..."
            />
          </div>
        </div>

        {exportError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {exportError}
          </div>
        ) : null}

        <div
          ref={pdfRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "794px",
            minHeight: "1123px",
            padding: "44px",
            backgroundColor: "#ffffff",
            color: "#111827",
            fontFamily: "Noto Sans TC, Microsoft JhengHei, sans-serif",
            boxSizing: "border-box",
            lineHeight: 1.5,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                textAlign: "center",
                borderBottom: "1px dashed #e5e7eb",
                paddingBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#f43f5e",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                愛心捐贈明細
              </div>
              <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                毛孩物資愛心捐贈明細
              </div>
              <div style={{ marginTop: "10px", fontSize: "14px", color: "#6b7280" }}>
                {THANK_YOU_MESSAGE}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #fde68a",
                backgroundColor: "#fffbeb",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#b45309",
                      letterSpacing: "0.2em",
                    }}
                  >
                    收件資訊
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "24px", fontWeight: 700 }}>
                    {shelter.name}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#b45309",
                    maxWidth: "320px",
                    textAlign: "right",
                  }}
                >
                  {shelter.address}
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>收件地址</div>
                  <div style={{ marginTop: "6px", fontSize: "14px", fontWeight: 600 }}>
                    {shelter.address}
                  </div>
                </div>
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>聯絡電話</div>
                  <div style={{ marginTop: "6px", fontSize: "14px", fontWeight: 600 }}>
                    {shelter.phone}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "16px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                  捐贈人姓名
                </div>
                <div style={{ marginTop: "8px", minHeight: "24px", color: "#6b7280" }}>
                  {donorName || "未填寫"}
                </div>
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "16px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>聯絡電話</div>
                <div style={{ marginTop: "8px", minHeight: "24px", color: "#6b7280" }}>
                  {contactPhone || "未填寫"}
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "16px",
                backgroundColor: "#ffffff",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                捐贈物資內容
              </div>
              <div
                style={{
                  marginTop: "8px",
                  whiteSpace: "pre-wrap",
                  minHeight: "72px",
                  color: "#6b7280",
                }}
              >
                {donationItems || "未填寫"}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "16px",
                backgroundColor: "#ffffff",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                給收容所的備註
              </div>
              <div
                style={{
                  marginTop: "8px",
                  whiteSpace: "pre-wrap",
                  minHeight: "72px",
                  color: "#6b7280",
                }}
              >
                {notes || "未填寫"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "8px",
                paddingTop: "12px",
                borderTop: "1px dashed #e5e7eb",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>
                  捐贈人親筆簽名：________________
                </div>
                <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: 600 }}>
                  日期：________________
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "right" }}>
                本系統由 程雍和 (Yong-He Cheng) 全額發起與贊助
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
          <Button type="button" onClick={handleExportPdf} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "正在匯出..." : "下載愛心捐贈明細與心意卡 (PDF)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
