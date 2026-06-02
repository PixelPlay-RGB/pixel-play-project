// 사용자 후원 지갑의 탭별 내역 표를 표시합니다.
import type {
  UserDonationFreeGrantHistoryItem,
  UserDonationPurchaseHistoryItem,
  UserDonationSnapshot,
  UserDonationUsageHistoryItem,
} from "@/types/donations/user-donations";
import type { ReactNode } from "react";

interface Props {
  snapshot: UserDonationSnapshot;
}

export function UserDonationHistoryTable({ snapshot }: Props) {
  if (snapshot.filter.tab === "purchase") {
    return <PurchaseHistoryTable items={snapshot.purchaseHistories} />;
  }

  if (snapshot.filter.tab === "free") {
    return <FreeGrantHistoryTable items={snapshot.freeGrantHistories} />;
  }

  return (
    <UsageHistoryTable
      items={snapshot.usageHistories}
      emptyMessage={
        snapshot.filter.usageKind === "party"
          ? "파티 후원 사용 내역이 없습니다."
          : "사용 내역이 없습니다."
      }
    />
  );
}

function UsageHistoryTable({
  items,
  emptyMessage,
}: {
  items: UserDonationUsageHistoryItem[];
  emptyMessage: string;
}) {
  return (
    <HistoryTable
      headers={["사용일시", "사용수량", "사용내용", "사용채널", "후원 메시지"]}
      emptyMessage={emptyMessage}
      columnCount={5}
    >
      {items.map((item) => (
        <tr key={item.id} className="border-border border-b last:border-b-0">
          <td className="px-4 py-4 text-sm whitespace-nowrap">{formatKstDateTime(item.usedAt)}</td>
          <td className="px-4 py-4 text-sm font-bold whitespace-nowrap">
            {formatPointAmount(item.amount)}
          </td>
          <td className="px-4 py-4 text-sm">{item.content}</td>
          <td className="px-4 py-4 text-sm">{item.channelName}</td>
          <td className="text-muted-foreground px-4 py-4 text-sm">
            {item.message || "메시지 없음"}
          </td>
        </tr>
      ))}
    </HistoryTable>
  );
}

function PurchaseHistoryTable({ items }: { items: UserDonationPurchaseHistoryItem[] }) {
  return (
    <HistoryTable
      headers={["구매일시", "구매수량", "구매내용", "결제상태", "주문번호"]}
      emptyMessage="구매 내역이 없습니다."
      columnCount={5}
    >
      {items.map((item) => (
        <tr key={item.id} className="border-border border-b last:border-b-0">
          <td className="px-4 py-4 text-sm whitespace-nowrap">
            {formatKstDateTime(item.purchasedAt)}
          </td>
          <td className="px-4 py-4 text-sm font-bold whitespace-nowrap">
            {formatPointAmount(item.amount)}
          </td>
          <td className="px-4 py-4 text-sm">{item.content}</td>
          <td className="px-4 py-4 text-sm">{getTransactionStatusLabel(item.status)}</td>
          <td className="text-muted-foreground px-4 py-4 font-mono text-xs">
            {item.orderId ?? "-"}
          </td>
        </tr>
      ))}
    </HistoryTable>
  );
}

function FreeGrantHistoryTable({ items }: { items: UserDonationFreeGrantHistoryItem[] }) {
  return (
    <HistoryTable
      headers={["지급일시", "지급수량", "지급내용", "지급사유"]}
      emptyMessage="무료 지급 내역이 없습니다."
      columnCount={4}
    >
      {items.map((item) => (
        <tr key={item.id} className="border-border border-b last:border-b-0">
          <td className="px-4 py-4 text-sm whitespace-nowrap">
            {formatKstDateTime(item.grantedAt)}
          </td>
          <td className="px-4 py-4 text-sm font-bold whitespace-nowrap">
            {formatPointAmount(item.amount)}
          </td>
          <td className="px-4 py-4 text-sm">{item.content}</td>
          <td className="text-muted-foreground px-4 py-4 text-sm">{item.reason}</td>
        </tr>
      ))}
    </HistoryTable>
  );
}

function HistoryTable({
  headers,
  emptyMessage,
  columnCount,
  children,
}: {
  headers: string[];
  emptyMessage: string;
  columnCount: number;
  children: ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-200 table-fixed border-collapse">
          <thead className="bg-muted/50">
            <tr className="border-border border-b">
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="text-muted-foreground px-4 py-3 text-left text-sm font-black whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              children
            ) : (
              <tr>
                <td
                  colSpan={columnCount}
                  className="text-muted-foreground h-60 px-4 text-center text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatPointAmount(value: number) {
  return `${value.toLocaleString("ko-KR")} P`;
}

function formatKstDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getTransactionStatusLabel(status: UserDonationPurchaseHistoryItem["status"]) {
  switch (status) {
    case "succeeded":
      return "결제 완료";
    case "pending":
      return "결제 대기";
    case "failed":
      return "결제 실패";
    case "canceled":
      return "결제 취소";
  }
}
