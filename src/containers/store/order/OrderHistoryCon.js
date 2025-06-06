import {useEffect, useMemo, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  completePartialItems,
  fetchOrderDetail,
  completeOrder,
} from "../../../service/store/OrderService";
import { fetchAllPartTimers } from "../../../service/store/PartTimeService";
import OrderHistoryCom from "../../../components/store/order/OrderHistoryCom";

function OrderHistoryCon() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [partialItems, setPartialItems] = useState([]);
  const [partTimers, setPartTimers] = useState([]);
  const [selectedPartTimerId, setSelectedPartTimerId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  const pagedItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);


  // ▶ 아이템과 남은 수량을 반환하는 유틸
const getItemAndRemainingQty = (itemId) => {
  const item = items.find((i) => i.itemId === itemId);
  if (!item) return { item: null, remainingQty: 0 };
  const remainingQty = item.orderQuantity - item.receivedQuantity;
  return { item, remainingQty };
};

  // ▶ 알바 목록 불러오기
  useEffect(() => {
    fetchAllPartTimers()
        .then(setPartTimers)
        .catch(() => alert("알바 목록 로딩 실패"));
  }, []);

  // ▶ 발주 상세 불러오기
  useEffect(() => {
    fetchOrderDetail(orderId)
        .then((res) => setItems(res.data))
        .catch(() => alert("상세 내역 조회 실패"));
  }, [orderId]);

  const handleToggleItem = (itemId, defaultQty = null) => {
    const { remainingQty } = getItemAndRemainingQty(itemId);
    setPartialItems((prev) => {
      const exists = prev.find((i) => i.itemId === itemId);
      return exists
        ? prev.filter((i) => i.itemId !== itemId)
        : [...prev, { itemId, inQuantity: defaultQty ?? remainingQty, reason: "" }];
    });
  };
  
  const handleChangeQuantity = (itemId, value) => {
    const parsed = parseInt(value, 10);
    const inQuantity = isNaN(parsed) ? 0 : parsed;
    const { remainingQty } = getItemAndRemainingQty(itemId);
  
    setPartialItems((prev) => {
      const exists = prev.find((i) => i.itemId === itemId);
      if (exists) {
        return prev.map((i) =>
          i.itemId === itemId ? { ...i, inQuantity } : i
        );
      } else {
        return [...prev, { itemId, inQuantity, reason: "" }];
      }
    });
  };

  // ▶ 사유 입력
  const handleChangeReason = (itemId, value) => {
    setPartialItems((prev) =>
        prev.map((i) =>
            i.itemId === itemId ? { ...i, reason: value } : i
        )
    );
  };

  // ▶ 전체 선택 토글
  const handleToggleAll = (isChecked) => {
    if (isChecked) {
      const updated = items
          .filter((item) => item.orderQuantity - (item.receivedQuantity ?? 0) > 0)
          .map((item) => ({
            itemId: item.itemId,
            inQuantity: item.orderQuantity - (item.receivedQuantity ?? 0),
            reason: "",
          }));
      setPartialItems(updated);
    } else {
      setPartialItems([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPartTimerId) {
      alert("입고 처리 담당 아르바이트를 선택해주세요.");
      return;
    }

    if (partialItems.length === 0) {
      alert("입고할 항목을 선택해주세요.");
      return;
    }

    //  이미 전체 입고 완료된 항목이면 차단
    const allCompleted = items.every(item => item.orderQuantity === item.receivedQuantity);
    if (allCompleted) {
      alert("이미 입고가 완료된 발주입니다.");
      navigate("/store/order/list");
      return;
    }

    let isAllCompleted = true;

    for (let partialItem of partialItems) {
      const origin = items.find((i) => i.itemId === partialItem.itemId);
      if (!origin) continue;

      const maxQty = origin.orderQuantity - origin.receivedQuantity;

      if (partialItem.inQuantity > maxQty) {
        alert(`${origin.productName}의 입고 수량이 주문 수량을 초과합니다.`);
        return;
      }

      if (partialItem.inQuantity < maxQty) {
        isAllCompleted = false;
        if (!partialItem.reason?.trim()) {
          alert(`${origin.productName}의 입고 수량이 부족한 경우, 사유를 입력해야 합니다.`);
          return;
        }
      }
    }

    try {
      if (isAllCompleted && partialItems.length === items.length) {
        await completeOrder(orderId, selectedPartTimerId);
        alert("전체 입고 완료!");
      } else {
        await completePartialItems(orderId, selectedPartTimerId, partialItems);
        alert("부분 입고 완료!");
      }

      const res = await fetchOrderDetail(orderId);
      setItems(res.data);
      setPartialItems([]);
      navigate("/store/order/list");
    } catch {
      alert("입고 처리 실패");
    }
  };

  return (
      <OrderHistoryCom
          itemList={pagedItems}
          totalItems={items.length}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          partialItems={partialItems}
          partTimers={partTimers}
          selectedPartTimerId={selectedPartTimerId}
          setSelectedPartTimerId={setSelectedPartTimerId}
          onCheckboxChange={handleToggleItem}
          onQuantityChange={handleChangeQuantity}
          onReasonChange={handleChangeReason}
          handleSubmitStockIn={handleSubmit}
          onSelectAllChange={handleToggleAll}
          navigate={navigate}
      />
  );
}

export default OrderHistoryCon;