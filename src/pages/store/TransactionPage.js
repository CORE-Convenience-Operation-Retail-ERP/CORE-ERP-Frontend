import React, { useEffect, useState } from "react";
import TransactionTable from "../../components/store/sales/TransactionTable";
import TransactionCon from "../../containers/store/TransactionCon";
import Pagination from "../../components/store/common/Pagination";
import { fetchTransactionsByStore } from "../../service/store/TransactionService";

const ITEMS_PER_PAGE = 10;

const TransactionPage = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // 데이터 로딩
  useEffect(() => {
    const storeId = localStorage.getItem("storeId");
    const token = localStorage.getItem("token");

    console.log("🟢 storeId:", storeId);
    console.log("🟢 accessToken:", token ? token.slice(0, 10) + "..." : "없음");

    const loadTransactions = async () => {
      try {
        const data = await fetchTransactionsByStore(storeId);

        const flat = data.flatMap((transaction) =>
          transaction.details.map((detail) => ({
            ...detail,
            transactionId: transaction.transactionId,
            paymentMethod: transaction.paymentMethod,
            finalAmount: transaction.finalAmount,
            paidAt: transaction.paidAt,
            isRefunded: transaction.isRefunded,
          }))
        );

        console.log("📦 전체 거래 데이터:", flat);

        setAllTransactions(flat);
        setFilteredTransactions(flat);
      } catch (error) {
        console.error("❌ 거래내역 불러오기 실패:", error);
      }
    };

    if (storeId && token) {
      loadTransactions();
    } else {
      console.warn("⚠️ storeId 또는 accessToken이 없습니다.");
    }
  }, []);

  // 검색 처리
  const handleSearch = (params) => {
    console.log("🔍 검색 파라미터:", params);

    const filtered = allTransactions.filter((row) =>
      Object.entries(params).every(([key, value]) => {
        const rowValue = row[key];

        if (typeof rowValue === 'number') {
          return Number(value) === rowValue;
        }

        if (typeof rowValue === 'string') {
          return rowValue.toUpperCase() === String(value).toUpperCase();
        }

        return String(rowValue) === String(value);
      })
    );

    console.log("✅ 필터링 결과:", filtered);
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  // 페이징 처리
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentData = filteredTransactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  return (
    <div>
      {/* 검색 바 */}
      <TransactionCon onSearch={handleSearch} />

      {/* 거래 테이블 */}
      <TransactionTable rows={currentData} />

      {/* 페이지네이션 */}
      <Pagination
        currentPage={currentPage - 1}           // 0-indexed
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page + 1)} // 1-indexed로 변환
      />
    </div>
  );
};

export default TransactionPage;
